using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;
using VoltSwap.DAL.UnitOfWork;

namespace VoltSwap.BusinessLayer.Services
{
    public class TransactionService : BaseService, ITransactionService
    {
        private readonly IGenericRepositories<Transaction> _transRepo;
        private readonly IGenericRepositories<User> _driverRepo;
        private readonly IGenericRepositories<Subscription> _subRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        private readonly IPlanService _plansService;
        public TransactionService(
            IServiceProvider serviceProvider,
            IGenericRepositories<User> driverRepo,
            IGenericRepositories<Transaction> transRepo,
            IGenericRepositories<Subscription> subRepo,
            IPlanService plansService,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _transRepo = transRepo;
            _driverRepo = driverRepo;
            _subRepo = subRepo;
            _plansService = plansService;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }
        //Hàm này để tạo transaction mới sau đó là list ra lịch sử transaction của user
        public async Task<ServiceResult> CreateTransactionAsync(TransactionRequest requestDto)
        {
            // chỗ này sẽ check coi driverId đã có chưa, nếu có rồi thì bỏ qua
            if (string.IsNullOrEmpty(requestDto.DriverId))
                return new ServiceResult { Status = 400, Message = "DriverId is required" };

            // chỗ này thì để tạo transactionid và SubId đang lỗi chỗ này
            //Nếu chạy chỗ này thì kêu gọi 2 hàm để generate ra transId và SubId và 2 cái này đều sẽ lấy số random cộng với là sẽ check lại nếu bị vấn đề dup id để tránh conflict
            //Nhưng mà chỗ này đang lỗi conflict :))))))))))))))
            string transactionId = await GenerateTransactionId();
            string subId = await GenerateSubscriptionId();

            string transactionContext = $"{requestDto.DriverId}-{requestDto.TransactionType.Replace(" ", "_").ToUpper()}-{transactionId.Substring(6)}";

            var transactionDetail = new Transaction
            {
                TransactionId = transactionId,
                SubscriptionId = subId,
                UserDriverId = requestDto.DriverId,
                TransactionType = requestDto.TransactionType,
                Amount = requestDto.Amount,
                Currency = "VND",
                TransactionDate = DateTime.UtcNow,
                PaymentMethod = "Bank transfer",
                Status = "Pending",
                Fee = requestDto.Fee,
                TotalAmount = (requestDto.Amount + requestDto.Fee),
                Note = $"Note for {requestDto.TransactionType} {subId}",
            };
            await _transRepo.CreateAsync(transactionDetail);

            var subscriptionDetail = new Subscription
            {
                SubscriptionId = subId,
                PlanId = requestDto.PlanId,
                UserDriverId = requestDto.DriverId,
                StartDate = DateOnly.FromDateTime(DateTime.Today),
                EndDate = DateOnly.FromDateTime(DateTime.Today).AddDays(await _plansService.GetDurationDays(requestDto.PlanId)),
                CurrentMileage = 0,
                RemainingSwap = 0,
                Status = "Inactive",
                CreateAt = DateTime.UtcNow,
            };
            
            await _subRepo.CreateAsync(subscriptionDetail);
            await _unitOfWork.SaveChangesAsync();
            var getTransactionList = await GetUserTransactionHistoryAsync(requestDto.DriverId);
            if (!getTransactionList.Any())
            {
                return new ServiceResult
                {
                    Status = 204,
                    Message = "No transactions found for this user."
                };
            }

            return new ServiceResult
            {
                Status = 200,
                Message = "Successfull",
                Data = getTransactionList,
            };
        }

        //Hàm này để hiển thị lên transaction mà user cần trả thông qua TransactionReponse
        public async Task<ServiceResult> GetTransactionDetailAsync(string transactionId)
        {
            var transaction = await _transRepo.GetByIdAsync(t => t.TransactionId == transactionId);
            if (transaction == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Transaction not found."
                };
            }
            var transactionResponse = new TransactionReponse
            {
                TransactionId = transaction.TransactionId,
                Amount = transaction.TotalAmount,
                PaymentStatus = transaction.Status,
                BankName = "Vietcombank",
                TransactionContext = transaction.TransactionContext,
                PaymentAccount = "123456789"
            };
            return new ServiceResult
            {
                Status = 200,
                Message = "Transaction details retrieved successfully.",
                Data = transactionResponse
            };
        }


        //Tao ra transactionID
        public async Task<string> GenerateTransactionId()
        {
            string transactionId;
            bool isDuplicated;
            string dayOnly = DateTime.Today.Day.ToString("D2");
            do
            {
                // Sinh 10 chữ số ngẫu nhiên
                var random = new Random();
                transactionId = $"TRANS-{dayOnly}-{string.Concat(Enumerable.Range(0, 10).Select(_ => random.Next(0, 10).ToString()))}";

                // Kiểm tra xem có trùng không
                isDuplicated = await _transRepo.AnyAsync(u => u.TransactionId == transactionId);

            } while (isDuplicated);
            return transactionId;
        }

        //Tao ra SubscriptionId
        public async Task<string> GenerateSubscriptionId()
        {
            string dayOnly = DateTime.Today.Day.ToString("D2");
            string subscriptionId;
            bool isDuplicated;

            do
            {
                // Sinh 10 chữ số ngẫu nhiên
                var random = new Random();
                subscriptionId = $"SUB-{string.Concat(Enumerable.Range(0, 10).Select(_ => random.Next(0, 8).ToString()))}";

                // Kiểm tra xem có trùng không
                isDuplicated = await _subRepo.AnyAsync(u => u.SubscriptionId == subscriptionId);

            } while (isDuplicated);
            return subscriptionId;
        }


        //Hàm này để admin có thể xem các transaction mà user mới tạo, để check coi là approve hay deny nếu approve thì trong transaction sẽ được cập nhật status thành Active và trong subscription sẽ được cập nhật status thành active nếu mà transactionType là Buy plan hoặc là Renew plan
        public async Task<ServiceResult> GetAllPendingTransactionsAsync()
        {
            var transactions = await _transRepo.GetAllAsync(t => t.Status == "Pending");
            if (transactions == null || !transactions.Any())
            {
                return new ServiceResult
                {
                    Status = 204,
                    Message = "No pending transactions found."
                };
            }
            var pendingTransactions = transactions.Select(t => new TransactionListForAdminResponse
            {
                TransactionId = t.TransactionId,
                Amount = t.TotalAmount,
                PaymentDate = t.TransactionDate,
                TransactionContext = t.TransactionContext,
                PaymentStatus = t.Status,
                TransactionNote = t.Note
            }).ToList();
            return new ServiceResult
            {
                Status = 200,
                Message = "Pending transactions retrieved successfully.",
                Data = pendingTransactions
            };
        }

        public async Task<ServiceResult> UpdateTransactionStatusAsync(ApproveTransactionRequest requestDto)
        {
            var transaction = await _transRepo.GetByIdAsync(t => t.TransactionId == requestDto.RequestTransactionId);
            if (transaction == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Transaction not found."
                };
            }
            transaction.Status = requestDto.NewStatus;
            _transRepo.UpdateAsync(transaction);
            await _unitOfWork.SaveChangesAsync();
            // Nếu transaction được duyệt (approved), cập nhật trạng thái của subscription tương ứng
            if (requestDto.NewStatus.Equals("Approved", StringComparison.OrdinalIgnoreCase))
            {
                var subscription = await _subRepo.GetByIdAsync(s => s.SubscriptionId == transaction.SubscriptionId);
                if (subscription != null)
                {
                    subscription.Status = "Active";
                    _subRepo.UpdateAsync(subscription);
                    await _unitOfWork.SaveChangesAsync();
                }
            }
            return new ServiceResult
            {
                Status = 200,
                Message = "Transaction status updated successfully."
            };
        }

        //Hàm này để lấy lịch sử transaction của user
        public async Task<List<TransactionListReponse>> GetUserTransactionHistoryAsync(string driverId)
        {
            if (string.IsNullOrEmpty(driverId))
            {
                throw new ArgumentException("Invalid driver ID provided.", nameof(driverId)); // Throw exception cho error
            }

            var transactions = await _transRepo.GetAllAsync(t => t.UserDriverId == driverId);

            if (transactions == null || !transactions.Any())
            {
                return new List<TransactionListReponse>(); // Return empty list nếu không có data (không throw, để caller handle)
            }

            var transactionHistory = transactions.Select(t => new Transaction
            {
                TransactionId = t.TransactionId,
                SubscriptionId = t.SubscriptionId,
                UserDriverId = t.UserDriverId,
                TransactionType = t.TransactionType,
                Amount = t.Amount,
                Currency = "VND",
                TransactionDate = t.TransactionDate,
                PaymentMethod = t.PaymentMethod,
                Status = t.Status,
                Fee = t.Fee,
                TotalAmount = t.TotalAmount,
                Note = t.Note,
            }).ToList();

            return transactionHistory.Select(t => new TransactionListReponse
            {
                TransactionId = t.TransactionId,
                Amount = t.TotalAmount,
                PaymentDate = t.TransactionDate,
                PaymentStatus = t.Status,
                TransactionNote = t.Note
            }).ToList();
        }
    }
}
