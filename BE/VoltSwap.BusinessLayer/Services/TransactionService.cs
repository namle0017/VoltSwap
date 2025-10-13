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

        public async Task<ServiceResult> CreateTransactionAsync(TransactionRequest requestDto)
        {
            string transactionId = await GenerateTransactionId();
            string subId = await GenerateSubscriptionId();

            string transactionContext = $"{requestDto.DriverId}-{requestDto.TransactionType.Replace(" ", "_").ToUpper()}-{transactionId.Substring(9)}";

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
                TotalAmount = (requestDto.Amount+ requestDto.Fee),
                Note = $"Note for {requestDto.TransactionType}",
            };


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

            await _transRepo.CreateAsync(transactionDetail);
            await _subRepo.CreateAsync(subscriptionDetail);
            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = "Successfull",
                Data = new TransactionReponse
                {
                    TransactionId = transactionId,
                    Amount = requestDto.Amount,
                    PaymentStatus = "Pending",
                    BankName = "TP Bank - Tien Phong Bank",
                    TransactionContext = transactionContext,
                    PaymentAccount = "17647502973",
                }
            };

        }


        //Tao ra transactionID
        private async Task<string> GenerateTransactionId()
        {
            string transactionId;
            bool isDuplicated;

            do
            {
                // Sinh 10 chữ số ngẫu nhiên
                var random = new Random();
                transactionId = $"TRANS-{DateTime.Today}-{string.Concat(Enumerable.Range(0, 10).Select(_ => random.Next(0, 10).ToString()))}";

                // Kiểm tra xem có trùng không
                isDuplicated = await _transRepo.AnyAsync(u => u.TransactionId == transactionId);

            } while (isDuplicated);
            return transactionId ;
        }

        //Tao ra SubscriptionId
        public async Task<string> GenerateSubscriptionId()
        {
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
            return subscriptionId ;
        }
    }
}
