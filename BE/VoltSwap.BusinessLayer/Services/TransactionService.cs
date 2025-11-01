using Azure.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Runtime.CompilerServices;
using System.Runtime.Intrinsics.Arm;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.IRepositories;
using VoltSwap.DAL.Models;
using VoltSwap.DAL.UnitOfWork;
using static VoltSwap.Common.DTOs.VnPayDtos;

namespace VoltSwap.BusinessLayer.Services
{
    public class TransactionService : BaseService, ITransactionService
    {
        private readonly IGenericRepositories<Transaction> _transRepo;
        private readonly IGenericRepositories<User> _driverRepo;
        private readonly IPillarSlotRepository _slotRepo;
        private readonly IGenericRepositories<Subscription> _subRepo;
        private readonly IGenericRepositories<Plan> _planRepo;

        private readonly IGenericRepositories<Fee> _feeRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        private readonly IVnPayService _vnPayService;
        private readonly IPlanService _planService;
        private static readonly TimeZoneInfo VN_TZ =
    System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(System.Runtime.InteropServices.OSPlatform.Windows)
        ? TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time")
        : TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
        public TransactionService(
            IServiceProvider serviceProvider,
            IGenericRepositories<User> driverRepo,
            IGenericRepositories<Transaction> transRepo,
            IGenericRepositories<Subscription> subRepo,

            IGenericRepositories<Fee> feeRepo,
            IGenericRepositories<Plan> planRepo,
            IVnPayService vnPayService,
            IPillarSlotRepository slotRepo,
            IPlanService plansService,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {

            _transRepo = transRepo;
            _driverRepo = driverRepo;
            _subRepo = subRepo;
            _planService = plansService;
            _vnPayService = vnPayService;
            _planRepo = planRepo;
            _feeRepo = feeRepo;
            _slotRepo = slotRepo;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }
        //Hàm này để tạo transaction mới sau đó là list ra lịch sử transaction của user
        public async Task<ServiceResult> CreateTransactionAsync(TransactionRequest requestDto)
        {
            try
            {
                // chỗ này sẽ check coi driverId đã có chưa, nếu có rồi thì bỏ qua
                if (string.IsNullOrEmpty(requestDto.DriverId))
                    return new ServiceResult { Status = 400, Message = "DriverId is required" };

                // chỗ này thì để tạo transactionid và SubId đang lỗi chỗ này
                //Nếu chạy chỗ này thì kêu gọi 2 hàm để generate ra transId và SubId và 2 cái này đều sẽ lấy số random cộng với là sẽ check lại nếu bị vấn đề dup id để tránh conflict
                string transactionId = await GenerateTransactionId();

                var transactionDetail = new Transaction
                {
                    TransactionId = transactionId,
                    SubscriptionId = requestDto.SubId,
                    UserDriverId = requestDto.DriverId,
                    TransactionType = requestDto.TransactionType,
                    Amount = requestDto.Amount,
                    Currency = "VND",
                    TransactionDate = DateTime.UtcNow.ToLocalTime(),
                    PaymentMethod = requestDto.PaymentMethod,
                    Status = requestDto.Status,
                    Fee = requestDto.Fee,
                    TotalAmount = (requestDto.Amount + requestDto.Fee),
                    TransactionContext = requestDto.TransactionContext,
                    Note = $"{requestDto.SubId}-{requestDto.TransactionType}",
                };
                await _transRepo.CreateAsync(transactionDetail);
                var saved = await _unitOfWork.SaveChangesAsync();
                if (saved <= 0)
                {
                    return new ServiceResult
                    {
                        Status = 500,
                        Message = "Failed to save transaction to database"
                    };
                }


                return new ServiceResult
                {
                    Status = 200,
                    Message = "Transaction created successfully",
                    Data = transactionDetail
                };
            }
            catch (DbUpdateException dbEx)
            {
                // Có thể console log hoặc debug để xem lỗi
                Console.WriteLine($"Database error: {dbEx.Message}");

                return new ServiceResult
                {
                    Status = 500,
                    Message = "Database error occurred while creating transaction"
                };
            }
            catch (Exception ex)
            {
                // Có thể console log hoặc debug để xem lỗi
                Console.WriteLine($"Unexpected error: {ex.Message}");

                return new ServiceResult
                {
                    Status = 500,
                    Message = "An unexpected error occurred"
                };
            }
        }

        //Hàm này để hiển thị lên transaction mà user cần trả thông qua TransactionReponse
        public async Task<ServiceResult> GetTransactionDetailAsync(string transactionId)
        {
            var prevMonth = DateTime.UtcNow.AddMonths(-1).ToLocalTime().Month;
            var currYear = DateTime.UtcNow.ToLocalTime().Year;
            if (prevMonth == 12)
            {
                currYear = DateTime.UtcNow.AddYears(-1).ToLocalTime().Year;
            }

            //Lấy transaction theo transID
            var transaction = await _transRepo.GetByIdAsync(t => t.TransactionId == transactionId);
            if (transaction == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Can't find this transaction."
                };
            }
            //2. Lấy số lần booking trong tháng đó
            var getNumberOfAppointment = await _unitOfWork.Bookings.GetAllQueryable()
                                                .Where(app => app.SubscriptionId == transaction.SubscriptionId
                                                && app.DateBooking.Month == prevMonth
                                                && app.DateBooking.Year == currYear)
                                                .CountAsync();
            //3. Lấy Plan dựa trên subId
            var getPlan = await _unitOfWork.Subscriptions.GetAllQueryable()
                                            .Where(sub => sub.SubscriptionId == transaction.SubscriptionId)
                                            .Include(sub => sub.Plan)
                                            .FirstOrDefaultAsync();

            //4. Lấy tên của user
            var getUserName = await _unitOfWork.Users.GetAllQueryable()
                                        .FirstOrDefaultAsync(us => us.UserId == transaction.UserDriverId);

            var transactionResponse = new TransactionDetailResponse
            {
                TransactionId = transactionId,
                TransactionType = transaction.TransactionType,
                SubscriptionId = transaction.SubscriptionId,
                PlanName = getPlan.Plan.PlanName,
                DriverId = transaction.UserDriverId,
                DriverName = getUserName.UserName,
                Status = transaction.Status,
                NumberOfBooking = getNumberOfAppointment,
                TotalFee = transaction.Fee,
                TotalAmount = transaction.TotalAmount,
            };

            return new ServiceResult
            {
                Status = 200,
                Message = "Transaction details retrieved successfully.",
                Data = transactionResponse
            };
        }

        //Nemo: Làm thêm hàm để có thể confirm sau khi đã chuyển tiền
        // renew : Not Done
        // register : Not Done
        // Booking : Not Done
        // Cancel : Not Done
        public async Task<IServiceResult> ConfirmPaymentAsync(string transactionId)
        {
            var transaction = await _transRepo.GetByIdAsync(t => t.TransactionId == transactionId);
            transaction.Status = "Pending";
            if (transaction == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Something wrong! Please contact to admin for support",
                };
            }
            await _transRepo.UpdateAsync(transaction);
            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = "Confirm successfull",
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
                subscriptionId = $"SUB-{string.Concat(Enumerable.Range(0, 8).Select(_ => random.Next(0, 8).ToString()))}";

                // Kiểm tra xem có trùng không
                isDuplicated = await _subRepo.AnyAsync(u => u.SubscriptionId == subscriptionId);

            } while (isDuplicated);
            return subscriptionId;
        }


        //Hàm này để admin có thể xem các transaction mà user mới tạo, để check coi là approve hay deny nếu approve thì trong transaction sẽ được cập nhật status thành Active và trong subscription sẽ được cập nhật status thành active nếu mà transactionType là Buy plan hoặc là Renew plan
        public async Task<ServiceResult> GetTransactionsByAdminAsync()
        {
            //1. Update Status của các Transaction quá hạn
            var updateStatusTrans = await UpdateStatusExpiredTransaction();
            //2. Tìm tất cả các transaction có expired và pending và cả waiting
            var transactions = await _transRepo.GetAllAsync(t => t.Status == "Pending"
                                        && t.Status == "Waiting"
                                        && t.Status == "Expired"
                                        && t.Status == "Failed");
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
                Message = "Waiting transactions retrieved successfully.",
                Data = pendingTransactions
            };
        }

        //Nemo: Update Status Expired For Transaction
        private async Task<int> UpdateStatusExpiredTransaction()
        {
            var currentDate = DateTime.UtcNow.ToLocalTime();
            var transactions = await _transRepo.GetAllAsync(t => t.Status == "Pending");
            foreach (var trans in transactions)
            {
                var getTransDate = trans.CreateAt.Value.Date;
                if (getTransDate >= currentDate.Date.AddDays(4))
                {
                    trans.Status = "Expired";
                    await _transRepo.UpdateAsync(trans);
                }
            }
            return await _unitOfWork.SaveChangesAsync();
        }

        //Bin: admin bấm nút Create All để hiển thị transaction bên người dùng
        public async Task<ServiceResult> CreateAllTransactionForUserAsync()
        {
            var transactions = await _transRepo.GetAllAsync(t => t.Status == "Waiting");
            if (transactions == null || !transactions.Any())
            {
                return new ServiceResult
                {
                    Status = 204,
                    Message = "No Waiting transactions found."
                };
            }

            foreach (var transaction in transactions)
            {
                transaction.Status = "Pending";
            }
            _transRepo.UpdateRange(transactions);
            await _unitOfWork.SaveChangesAsync();

            var pendingTransactions = transactions.Select(t => new TransactionListReponse
            {
                TransactionId = t.TransactionId,
                Amount = t.TotalAmount,
                PaymentDate = t.TransactionDate,
                PaymentStatus = t.Status,
                TransactionNote = t.Note
            }).ToList();
            return new ServiceResult
            {
                Status = 200,
                Message = "transactions retrieved successfully.",
                Data = pendingTransactions
            };
        }

        private static DateTime ToUtcFromVn(DateTime vnLocal)
        {
            var unspecified = DateTime.SpecifyKind(vnLocal, DateTimeKind.Unspecified);
            return TimeZoneInfo.ConvertTimeToUtc(unspecified, VN_TZ);
        }

        private static int CalculateCancelCountdownSeconds(Appointment appointment, bool addExtraHour = true)
        {
            var nowUtc = DateTime.UtcNow;
            var scheduledLocalVn = appointment.DateBooking.ToDateTime(appointment.TimeBooking);
            var scheduledUtc = ToUtcFromVn(scheduledLocalVn);
            var expireAtUtc = addExtraHour ? scheduledUtc.AddHours(1) : scheduledUtc;
            var realSecondsRemaining = (expireAtUtc - nowUtc).TotalSeconds;
            var scaledSeconds = realSecondsRemaining * (10.0 / 3600.0);
            if (scaledSeconds <= 0) return 0;
            return (int)Math.Ceiling(scaledSeconds);
        }

        //Hàm này để lấy lịch sử transaction của user
        public async Task<List<TransactionListReponse>> GetUserTransactionHistoryAsync(string driverId)
        {
            if (string.IsNullOrEmpty(driverId))
            {
                throw new ArgumentException("Invalid driver ID provided.", nameof(driverId)); // Throw exception cho error
            }

            var transactions = await _transRepo.GetAllAsync(t => t.UserDriverId == driverId && t.Status != "Waiting");

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
                Currency = t.Currency,
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


        public async Task<int> CreateTransactionBooking(BookingTransactionRequest requestDto)
        {
            string transactionId = await GenerateTransactionId();
            string transactionContext = $"{requestDto.DriverId}-{requestDto.TransactionType.Replace(" ", "_").ToUpper()}-{transactionId.Substring(6)}";

            var transactionDetail = new Transaction
            {
                TransactionId = transactionId,
                SubscriptionId = requestDto.SubId,
                UserDriverId = requestDto.DriverId,
                TransactionType = requestDto.TransactionType,
                Amount = requestDto.Amount,
                Currency = "VND",
                TransactionDate = DateTime.UtcNow.ToLocalTime(),
                PaymentMethod = "Bank transfer",
                Status = "Pending",
                Fee = requestDto.Fee,
                TotalAmount = (requestDto.Amount + requestDto.Fee),
                TransactionContext = transactionContext,
                Note = $"Note for {requestDto.TransactionType} {requestDto.SubId}",
            };
            await _transRepo.CreateAsync(transactionDetail);
            return await _unitOfWork.SaveChangesAsync();
        }


        //Nemo: Lấy doanh thu hằng tháng của cả hệ thống
        public async Task<MonthlyRevenueResponse> GetMonthlyRevenue()
        {
            var getDateNow = DateTime.UtcNow.ToLocalTime();
            var totalMonth = await _transRepo.GetAllQueryable()
                .Where(trans => trans.Status == "Waiting" && trans.TransactionDate.Month == getDateNow.Month)
                .GroupBy(trans => trans.SubscriptionId)
                .Select(g => new
                {
                    SubscriptionId = g.Key,
                    Total = g.Sum(x => x.Amount)
                })
                .ToListAsync();

            var totalPreviousMonth = await _transRepo.GetAllQueryable()
                .Where(trans => trans.Status == "Success"
                && trans.TransactionType == "Renew"
                && trans.TransactionDate.Month == getDateNow.AddMonths(-1).Month)
                .GroupBy(trans => trans.SubscriptionId)
                .Select(g => new
                {
                    SubscriptionId = g.Key,
                    Total = g.Sum(x => x.Amount)
                })
                .ToListAsync();

            var grandTotal = totalMonth.Sum(trans => trans.Total);
            var grandPreviousTotal = totalPreviousMonth.Sum(trans => trans.Total);
            if (grandPreviousTotal == 0 || grandTotal == 0)
            {
                return new MonthlyRevenueResponse
                {
                    TotalRevenue = (double)grandTotal,
                    MonthlyPnl = 0,
                };
            }

            return new MonthlyRevenueResponse
            {
                TotalRevenue = (double)grandTotal,
                MonthlyPnl = (double)((grandTotal / grandPreviousTotal)) * 100,
            };
        }


        // Nemo: Lấy số khách hàng theo từng gói
        public async Task<List<MonthlySubscriptionResponse>> GetNumberDriverByPlan()
        {
            var getDateNow = DateTime.UtcNow.ToLocalTime();
            var getDriver = await _transRepo.GetAllQueryable()
                .Include(sub => sub.Subscription)
                    .ThenInclude(plan => plan.Plan)
                .Where(trans => trans.TransactionDate.Month == getDateNow.Month
                                && trans.TransactionDate.Year == getDateNow.Year
                                && trans.Status == "Success")
                .GroupBy(trans => new { trans.Subscription.PlanId, trans.Subscription.Plan.PlanName })
                .Select(g => new
                {
                    PlanId = g.Key.PlanId,
                    PlanName = g.Key.PlanName,
                    TotalDriver = g.Select(x => x.UserDriverId).Distinct().Count()
                })
                .ToListAsync();

            var totalDrivers = getDriver.Sum(x => x.TotalDriver);

            var result = getDriver.Select(x => new MonthlySubscriptionResponse
            {
                PlanId = x.PlanId,
                PlanName = x.PlanName,
                TotalDriver = x.TotalDriver,
                PercentDriverByPlan = totalDrivers > 0
                    ? Math.Round((double)x.TotalDriver / totalDrivers * 100, 2)
                    : 0
            }).ToList();

            return result;
        }

        //public async Task<ServiceResult> RegisterNewPlan(RegisterNewPlanDTO requestDto)
        //{
        //    //Nemo: insert thêm vào gói
        //    var getFee = await _feeRepo.GetAllQueryable()
        //                    .FirstOrDefaultAsync(fee => fee.PlanId == requestDto.PlanId &&
        //                    fee.TypeOfFee == "Battery Deposit");
        //    var getPlan = await _unitOfWork.Plans.GetAllQueryable()
        //                    .FirstOrDefaultAsync(plan => plan.PlanId == requestDto.PlanId);

        //    var generateSubId = await GenerateSubscriptionId();
        //    var generateTransactionContext = await GenerateTransactionConext();
        //}

        public async Task<string> GenerateTransactionConext(TransactionContextRequest requestDto)
        {
            return $"{requestDto.DriverId}-{requestDto.TransactionType.Replace(" ", "_").ToUpper()}-{requestDto.SubscriptionId.Substring(6)}";
        }



        public async Task<ServiceResult> CreateTransactionChain()
        {
            var currentYear = DateTime.UtcNow.ToLocalTime().Year;
            if (currentYear == 1)
            {
                currentYear = DateTime.UtcNow.AddYears(-1).ToLocalTime().Year;
            }
            var prevMonth = DateTime.UtcNow.AddMonths(-1).ToLocalTime().Month;
            var getTransactionHiding = await _unitOfWork.Trans.GetAllAsync(
                    predicate: trans => trans.Status == "Waiting"
                    && trans.TransactionDate.Month == prevMonth
                    && trans.TransactionDate.Year == currentYear,
                    asNoTracking: false
                );
            var getSubUnactiveList = new List<string>();
            foreach (var item in getTransactionHiding)
            {
                var checkSubUnactive = await CheckSubEndDate(item.SubscriptionId);
                var createTransactionConext = new TransactionContextRequest
                {
                    TransactionType = item.TransactionType,
                    SubscriptionId = item.SubscriptionId,
                    DriverId = item.UserDriverId,
                };
                item.Status = "Pending";

                item.TransactionContext = await GenerateTransactionConext(createTransactionConext);
                await _transRepo.UpdateAsync(item);
                await _unitOfWork.SaveChangesAsync();
            }
            return new ServiceResult
            {
                Status = 200,
                Message = "Successfull",
            };
        }

        public async Task<bool> CheckSubEndDate(string subId)
        {
            return await _unitOfWork.Subscriptions.AnyAsync(sub => sub.EndDate != null);
        }

        public async Task<string> GetPlanIdBySubId(string subId)
        {
            return await _unitOfWork.Subscriptions.GetAllQueryable()
                            .Where(sub => sub.SubscriptionId == subId)
                            .Select(sub => sub.PlanId)
                            .FirstOrDefaultAsync();
        }


        //Nemo: Chức năng đăng ký gói mới
        public async Task<ServiceResult> RegisterNewPlanAsync(RegisterNewPlanRequest requestDto)
        {
            var getFee = await _feeRepo.GetAllQueryable()
                                    .FirstOrDefaultAsync(fee => fee.PlanId == requestDto.PlanId &&
                                    fee.TypeOfFee == "Battery Deposit");
            var getPlan = await _planRepo.GetAllQueryable().FirstOrDefaultAsync(plan => plan.PlanId == requestDto.PlanId);
            var generateSubId = await GenerateSubscriptionId();
            var getTransactionContext = new TransactionContextRequest
            {
                TransactionType = "Deposit Fee",
                SubscriptionId = generateSubId,
                DriverId = requestDto.DriverId.UserId,
            };
            var generateTransContext = await GenerateTransactionConext(getTransactionContext);
            var getDepositTrans = new TransactionRequest
            {
                DriverId = requestDto.DriverId.UserId,
                SubId = generateSubId,
                PlanId = requestDto.PlanId,
                PaymentMethod = "Bank Transfer",
                Status = "Pending",
                Amount = 0,
                Fee = getFee.Amount,
                TransactionType = "Battery Deposit",

                TransactionContext = generateTransContext,
            };
            var subscriptionDetail = new Subscription
            {
                SubscriptionId = generateSubId,
                PlanId = requestDto.PlanId,
                UserDriverId = requestDto.DriverId.UserId,
                StartDate = DateOnly.FromDateTime(DateTime.Today),
                EndDate = DateOnly.FromDateTime(DateTime.Today).AddDays(await _planService.GetDurationDays(requestDto.PlanId)),
                CurrentMileage = 0,
                RemainingSwap = 0,
                Status = "Inactive",
                CreateAt = DateTime.UtcNow,
            };

            await _unitOfWork.Subscriptions.CreateAsync(subscriptionDetail);
            var createDeposit = await CreateTransactionAsync(getDepositTrans);
            var saved = await _unitOfWork.SaveChangesAsync();
            if (saved < 0)
            {
                return new ServiceResult
                {
                    Status = 500,
                    Message = "Failed to save transaction to database"
                };
            }
            var result = await GetUserTransactionHistoryAsync(requestDto.DriverId.UserId);

            return new ServiceResult
            {
                Status = 200,
                Message = "You have successfully registered for the package.",
                Data = result,
            };
        }


        public async Task<int> CreateNewSubcription(RequestNewPlanDto requestDto)
        {
            var getTrans = await _unitOfWork.Trans.GetAllQueryable().FirstOrDefaultAsync(x => x.TransactionId == requestDto.TransactionId);
            var getPlan = await _unitOfWork.Subscriptions.GetAllQueryable()
                .Where(sub => sub.SubscriptionId == getTrans.SubscriptionId)
                .Include(x => x.Plan).FirstOrDefaultAsync();

            var getNewPlanTransaction = new TransactionRequest
            {
                DriverId = getTrans.UserDriverId,
                SubId = getTrans.SubscriptionId,
                PlanId = getPlan.Plan.PlanId,
                PaymentMethod = "Bank Transfer",
                Status = "Waiting",
                Amount = getPlan.Plan.Price ?? 0m,
                Fee = 0,
                TransactionType = "Monthly Fee",
                TransactionContext = "",
            };
            var createNewPlanTransaction = await CreateTransactionAsync(getNewPlanTransaction);
            return await _unitOfWork.SaveChangesAsync();

        }

        //Nemo: Cho staff tạo cancelPlan
        //public async Task<ServiceResult> CancelPlanAsync(CancelPlanRequest requestDto)
        //{
        //    var generateTransId = await GenerateTransactionId();
        //    var getPlanId = await GetPlanIdBySubId(requestDto.SubId);
        //    var getFee = await _feeRepo.GetAllQueryable()
        //                            .FirstOrDefaultAsync(fee => fee.PlanId == getPlanId &&
        //                            fee.TypeOfFee == "Battery Deposit");
        //    DateOnly date = requestDto.DateBooking;
        //    TimeOnly time = requestDto.TimeBooking;
        //    var createRefund = new Transaction
        //    {
        //        TransactionId = generateTransId,
        //        SubscriptionId = requestDto.SubId,
        //        UserDriverId = requestDto.DriverId,
        //        TransactionType = "Refund",
        //        Amount = -(getFee.Amount),
        //        Currency = "VND",
        //        TransactionDate = date.ToDateTime(time),
        //        PaymentMethod = "Cash",
        //        Status = "Pending",
        //        Fee = 0,
        //        TotalAmount = -(getFee.Amount),
        //        TransactionContext = null,
        //        ConfirmDate = null,
        //        CreatedBy = requestDto.StaffId,
        //    };
        //    await _transRepo.CreateAsync(createRefund);
        //    var result = await _unitOfWork.SaveChangesAsync();
        //    if (result < 0)
        //    {
        //        return new ServiceResult
        //        {
        //            Status = 400,
        //            Message = "Something wrong, please contact to admin or waiting...",
        //        };
        //    }
        //}



        //Nemo: Update Transaction
        public async Task<int> UpdateTransactionAsync(UpdateTransactionRequest requestDto)
        {
            var getTrans = await _unitOfWork.Trans.GetAllQueryable().Where(x => x.SubscriptionId == requestDto.SubId && x.Status == "Waiting").FirstOrDefaultAsync();

            getTrans.Fee += requestDto.Fee;
            await _unitOfWork.Trans.UpdateAsync(getTrans);
            return await _unitOfWork.SaveChangesAsync();
        }

        public async Task<string> CreatePaymentUrlAsync(string transId, HttpContext context)
        {
            var getTrans = await _unitOfWork.Trans.GetByIdAsync(trans => trans.TransactionId == transId);
            var createPayment = new PaymentInformationModel
            {
                TransId = getTrans.TransactionId,
                OrderType = "other",
                Amount = (double)getTrans.TotalAmount,
                OrderDescription = getTrans.TransactionContext,
                Name = "",
            };

            var paymentUrl = _vnPayService.CreatePaymentUrl(createPayment, context);

            // 4. Trả URL về cho controller (để FE redirect sang VNPay)
            return paymentUrl;
        }


        //Nemo: Confirm cancel
        public async Task<ServiceResult> ConfirmCancelAsync(ConfirmTransactionRequest request)
        {
            var gettrans = await _unitOfWork.Trans.GetByIdAsync(request.TransactionId);
            var getsub = await _unitOfWork.Subscriptions.GetByIdAsync(gettrans.SubscriptionId);
            var mess = "";

            mess = "Confirm Success.";
            gettrans.Status = "Success";
            gettrans.CreateAt = DateTime.Now.ToLocalTime();
            getsub.Status = "Inactive";
            await _subRepo.UpdateAsync(getsub);
            await _transRepo.UpdateAsync(gettrans);


            await _unitOfWork.SaveChangesAsync();
            return new ServiceResult
            {
                Status = 200,
                Message = mess,

            };
        }

        public async Task<PaymentResponseModel> ProcessVnPayCallbackAsync(IQueryCollection queryCollection)
        {
            var response = _vnPayService.PaymentExecute(queryCollection);

            // 1. Kiểm tra chữ ký + mã phản hồi
            if (!response.Success || response.VnPayResponseCode != "00")
            {
                await UpdateTransactionStatusAsync(response.OrderId, "Failed");
                response.Message = "Payment failed";
                return response;
            }

            // 2. Tìm giao dịch bằng TransactionId (là vnp_TxnRef)
            var transaction = await _transRepo.GetAllQueryable()
                .FirstOrDefaultAsync(t => t.TransactionId == response.OrderId);


            if (transaction == null)
            {
                response.Success = false;
                response.Message = "No transaction found";
                return response;
            }

            // 3. Cập nhật trạng thái
            transaction.Status = "Success";

            // 4. Xử lý nghiệp vụ theo loại
            if (transaction.TransactionType == "Battery Deposit")
            {
                await HandleDepositSuccessAsync(transaction);
                response.Message = "Deposit successful. Package activated.";
            }
            else if (transaction.TransactionType == "Monthly Fee")
            {
                await HandleMonthlyFeeSuccessAsync(transaction);
                response.Message = "Monthly fee payment successful.";
            }

            await _unitOfWork.SaveChangesAsync();
            return response;
        }


        private async Task HandleDepositSuccessAsync(Transaction depositTrans)
        {
            // 1. Kích hoạt Subscription
            var subscription = await _subRepo.GetAllQueryable()
                .FirstOrDefaultAsync(s => s.SubscriptionId == depositTrans.SubscriptionId);

            if (subscription == null)
            {
                // Không tìm thấy subscription, có thể log hoặc throw
                return;
            }

            subscription.Status = "Active";
            subscription.StartDate = DateOnly.FromDateTime(DateTime.Today);

            // 2. Tạo giao dịch Monthly Fee (Status = Waiting)
            var planId = subscription.PlanId; // tách ra trước
            var plan = await _planRepo.GetAllQueryable()
                .FirstOrDefaultAsync(p => p.PlanId == planId);

            if (plan != null)
            {
                var monthlyTrans = new Transaction
                {
                    TransactionId = await GenerateTransactionId(), // bạn đã có
                    SubscriptionId = depositTrans.SubscriptionId,
                    UserDriverId = depositTrans.UserDriverId,
                    TransactionType = "Monthly Fee",
                    Amount = plan.Price ?? 0m,
                    Fee = 0m,
                    TotalAmount = plan.Price ?? 0m,
                    Currency = "VND",
                    PaymentMethod = "VnPay",
                    Status = "Waiting", // ẨN VỚI USER
                    TransactionDate = DateTime.UtcNow.ToLocalTime(),
                    TransactionContext = $"{depositTrans.SubscriptionId}-MonthlyFee",
                    Note = "Monthly Fee"
                };

                await _transRepo.CreateAsync(monthlyTrans);
            }
        }

        private async Task HandleMonthlyFeeSuccessAsync(Transaction monthlyTrans)
        {
            var subscription = await _subRepo.GetAllQueryable()
                .Include(s => s.Plan)
                .FirstOrDefaultAsync(s => s.SubscriptionId == monthlyTrans.SubscriptionId);

            if (subscription != null)
            {
                var monthlyFeeTrans = new Transaction
                {
                    TransactionId = await GenerateTransactionId(), // bạn đã có
                    SubscriptionId = subscription.SubscriptionId,
                    UserDriverId = subscription.UserDriverId,
                    TransactionType = "Monthly Fee",
                    Amount = subscription.Plan.Price ?? 0m,
                    Fee = 0m,
                    TotalAmount = subscription.Plan.Price ?? 0m,
                    Currency = "VND",
                    PaymentMethod = "VnPay",
                    Status = "Waiting", // ẨN VỚI USER
                    TransactionDate = DateTime.UtcNow.ToLocalTime(),
                    TransactionContext = $"{subscription.SubscriptionId}-MonthlyFee",
                    Note = "Monthly Fee"
                };

                await _transRepo.CreateAsync(monthlyFeeTrans);
            }
        }

        private async Task UpdateTransactionStatusAsync(string? transactionId, string status)
        {
            if (string.IsNullOrEmpty(transactionId)) return;

            var trans = await _transRepo.GetAllQueryable()
                .FirstOrDefaultAsync(t => t.TransactionId == transactionId);

            if (trans != null)
            {
                trans.Status = status;
                await _unitOfWork.SaveChangesAsync();
            }
        }

        public async Task<ServiceResult> RecreateTransaction(string transactionId)
        {
            var getTrans = await _unitOfWork.Trans.GetByIdAsync(transactionId);
            if (getTrans == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = $"This transactionId {transactionId} was not found.",
                };
            }
            var transactionContext = new TransactionContextRequest
            {
                TransactionType = getTrans.TransactionType,
                SubscriptionId = getTrans.SubscriptionId,
                DriverId = getTrans.UserDriverId,
            };


            getTrans.TransactionId = await GenerateTransactionId();
            getTrans.Status = "Pending";
            getTrans.CreateAt = DateTime.UtcNow.ToLocalTime();
            getTrans.TransactionContext = await GenerateTransactionConext(transactionContext);

            await _transRepo.UpdateAsync(getTrans);
            int result = await _unitOfWork.SaveChangesAsync();
            if (result < 0)
            {
                return new ServiceResult
                {
                    Status = 400,
                    Message = "Unable to save.",
                };
            }

            return new ServiceResult
            {
                Status = 200,
                Message = "Recreate transaction successfully.",
            };
        }

        public async Task<bool> CheckPaidMonthly(string subId)
        {
            return await _unitOfWork.Trans
                    .AnyAsync(trans => trans.SubscriptionId == subId
                              && trans.Status == "Pending");
        }
    }
}
