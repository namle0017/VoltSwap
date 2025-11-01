using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.Extensions.Configuration;
using Microsoft.Identity.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata.Ecma335;
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
    public class SubscriptionService : BaseService, ISubscriptionService
    {
        private readonly IGenericRepositories<Transaction> _transRepo;
        private readonly IGenericRepositories<Fee> _feeRepo;
        private readonly IGenericRepositories<Plan> _planRepo;
        private readonly IPlanService _planService;
        private readonly IGenericRepositories<Subscription> _subRepo;
        private readonly ITransactionService _transService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;


        public SubscriptionService(
            IServiceProvider serviceProvider,
            IGenericRepositories<Subscription> subRepo,
            IGenericRepositories<Transaction> transRepo,
            IGenericRepositories<Fee> feeRepo,
            IGenericRepositories<Plan> planRepo,
            IPlanService planService,
            ITransactionService transService,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _subRepo = subRepo;
            _transRepo = transRepo;
            _feeRepo = feeRepo;
            _planRepo = planRepo;
            _planService = planService;
            _transService = transService;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
            _planService = planService;
        }

        public async Task<ServiceResult> UserPlanCheckerAsync(CheckSubRequest requestDto)
        {
            var checkUserPlan = await _unitOfWork.Subscriptions.GetSubscriptionByUserIdAsync(requestDto.DriverId);
            if (checkUserPlan == null)
            {
                //204 User chưa mua gì hết
                return new ServiceResult
                {
                    Status = 204,
                    Message = "User has not purchased any plans."
                };

            }
            else
            {
                var getUserPlan = checkUserPlan.Select(sub => new ReponseSub
                {
                    SubscriptionId = sub.SubscriptionId,
                    PlanName = sub.Plan.PlanName,
                    Status = sub.Status,
                });
            }

            return new ServiceResult(200, "Done");
        }
        //Hàm đăng ký subcription mới
        //public async Task<ServiceResult> RegisterSubcriptionAsync( string DriverId, string PlanId)
        //{
        //    var today = DateOnly.FromDateTime(DateTime.UtcNow);
        //    var durationDays = await _planService.GetDurationDays(PlanId);
        //    var newSubId = await GenerateSubscriptionId();
        //    var newSubscription = new Subscription
        //    {
        //        SubscriptionId = newSubId,
        //        UserDriverId = DriverId,
        //        PlanId = PlanId,
        //        StartDate = today,
        //        EndDate = today.AddDays(durationDays),
        //        Status = "Active",
        //        CurrentMileage = 0,
        //        RemainingSwap = 0,
        //        CreateAt = DateTime.UtcNow
        //    };
        //    await _unitOfWork.Subscriptions.CreateAsync(newSubscription);
        //    await _unitOfWork.SaveChangesAsync();
        //    return new ServiceResult
        //    {
        //        Status = 201,
        //        Message = "Subscription registered successfully.",
        //        Data = new
        //        {
        //            newSubscription.SubscriptionId,
        //            newSubscription.PlanId,
        //            newSubscription.StartDate,
        //            newSubscription.EndDate,
        //            newSubscription.Status
        //        }
        //    };
        //}
        public async Task<ServiceResult> RenewSubcriptionAsync(string DriverId, string SubId)
        {
            var getsub = await _unitOfWork.Subscriptions
                .GetAllQueryable()
                .FirstOrDefaultAsync(s => s.SubscriptionId == SubId
                                        && s.UserDriverId == DriverId);
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (getsub.Status == "Active")
            {
                return new ServiceResult(409, "Subscription is still active. You can only change after it expires.");
            }

            if (getsub.Status == "Inactive")
            {
                return new ServiceResult(409, "Subscription is inactive and cannot be changed.");
            }

            var durationDays = await _planService.GetDurationDays(getsub.PlanId);
            getsub.PreviousSubscriptionId = SubId;
            getsub.StartDate = today;
            getsub.EndDate = today.AddDays(durationDays);
            getsub.Status = "Inactive";
            _unitOfWork.Subscriptions.Update(getsub);
            await _unitOfWork.SaveChangesAsync();

            //Tạo transaction cho việc renew
            var newTransId = await GenerateTransactionId();
            var price = await _planService.GetPriceByPlanId(getsub.PlanId);
            string transactionContext = $"{DriverId}-RENEW_PACKAGE-{newTransId.Substring(6)}";
            var newTransaction = new Transaction
            {
                TransactionId = newTransId,
                SubscriptionId = getsub.SubscriptionId,
                UserDriverId = DriverId,
                TransactionType = "Renew",
                Amount = price,
                Currency = "VND",
                TransactionDate = DateTime.UtcNow,
                PaymentMethod = "Bank transfer",
                Status = "Pending",
                Fee = 0,
                TotalAmount = price,
                Note = $"Note for renew {getsub.SubscriptionId}",
                TransactionContext = transactionContext,
            };

            await _unitOfWork.Trans.CreateAsync(newTransaction);
            await _unitOfWork.SaveChangesAsync();


            return new ServiceResult
            {
                Status = 200,
                Message = "Subscription renewed successfully.",
                Data = new
                {
                    newTransId,
                    getsub.SubscriptionId,
                    getsub.PreviousSubscriptionId,
                    getsub.PlanId,
                    getsub.StartDate,
                    getsub.EndDate,
                    getsub.Status
                }
            };
        }
        public async Task<ServiceResult> ChangeSubcriptionAsync(string DriverId, string SubId, string newPlanId)
        {
            var getsub = await _unitOfWork.Subscriptions
                .GetAllQueryable()
                .FirstOrDefaultAsync(s => s.SubscriptionId == SubId
                               && s.UserDriverId == DriverId);

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (getsub.Status == "Active")
            {
                return new ServiceResult(409, "Subscription is still active. You can only change after it expires.");
            }

            if (getsub.Status == "Inactive")
            {
                return new ServiceResult(409, "Subscription is inactive and cannot be changed.");
            }

            //Tạo transaction cho việc change plan
            var newTransId = await GenerateTransactionId();
            var price = await _planService.GetPriceByPlanId(getsub.PlanId);
            string transactionContext = $"{DriverId}-CHANGE_PACKAGE-{newTransId.Substring(6)}";

            //kiểm tra xem plan mới có số lương pin hơn plan cũ không
            var newPlanBattery = await _planService.GetSwapLimitByPlanId(newPlanId);
            var currentPlanBattery = await _planService.GetSwapLimitByPlanId(getsub.PlanId);
            decimal deposit = 0;
            if (newPlanBattery > currentPlanBattery)
            {
                var FeeDeposit = await _feeRepo.GetAllQueryable()
                      .FirstOrDefaultAsync(fee => fee.TypeOfFee == "Battery Deposit" && fee.PlanId == newPlanId);
                deposit = (newPlanBattery - currentPlanBattery) * FeeDeposit.Amount;

            }


            var newTransaction = new Transaction
            {
                TransactionId = newTransId,
                SubscriptionId = getsub.SubscriptionId,
                UserDriverId = DriverId,
                TransactionType = "Change",
                Amount = price,
                Currency = "VND",
                TransactionDate = DateTime.UtcNow,
                PaymentMethod = "Bank transfer",
                Status = "Waiting",
                Fee = deposit,
                TotalAmount = price + deposit,
                Note = $"Note for change {getsub.SubscriptionId}",
                TransactionContext = transactionContext,
            };

            await _unitOfWork.Trans.CreateAsync(newTransaction);
            await _unitOfWork.SaveChangesAsync();
            var durationDays = await _planService.GetDurationDays(newPlanId);

            getsub.PlanId = newPlanId;
            getsub.PreviousSubscriptionId = SubId;
            getsub.StartDate = today;
            getsub.EndDate = today.AddDays(durationDays);
            getsub.Status = "Inactive";

            _unitOfWork.Subscriptions.Update(getsub);
            await _unitOfWork.SaveChangesAsync();

            var newSubId = await GenerateSubscriptionId();
            var data = new ChangePlanResponse
            {
                TransactionId = newTransId,
                SubscriptionId = newSubId,
                PreviousSubcriptionId = SubId,
                PlanId = getsub.PlanId,
                StartDate = getsub.StartDate,
                EndDate = getsub.EndDate,
                Status = getsub.Status
            };

            return new ServiceResult
            {
                Status = 200,
                Message = "Plan changed successfully ",
                Data = data
            };
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
                subscriptionId = $"SUB-{string.Concat(Enumerable.Range(0, 8).Select(_ => random.Next(0, 8).ToString()))}";

                // Kiểm tra xem có trùng không
                isDuplicated = await _subRepo.AnyAsync(u => u.SubscriptionId == subscriptionId);

            } while (isDuplicated);
            return subscriptionId;
        }
        //Tao ra transactionID
        public async Task<string> GenerateTransactionId()
        {
            string transactionId;
            bool isDuplicated;
            string dayOnly = DateTime.Today.Day.ToString("D2");
            do
            {
                // Sinh 8 chữ số ngẫu nhiên
                var random = new Random();
                transactionId = $"TRANS-{dayOnly}-{string.Concat(Enumerable.Range(0, 10).Select(_ => random.Next(0, 10).ToString()))}";

                // Kiểm tra xem có trùng không
                isDuplicated = await _unitOfWork.Trans.AnyAsync(u => u.TransactionId == transactionId);

            } while (isDuplicated);
            return transactionId;
        }

        //Hàm này sẽ để check xem lấy các subId có pin đang sử dụng không
        //chỗ này chưa biết trả về Task<> gì nên để tạm
        public async Task<List<Subscription>> GetPreviousSubscriptionAsync(CurrentSubscriptionResquest requestDto)
        {
            var getAllSub = await _subRepo.GetByIdAsync(requestDto.CurrentSubscription);
            var getAllSubChain = new List<Subscription>();
            if (getAllSub.PreviousSubscriptionId == null)
            {
                getAllSubChain.Add(getAllSub);
                return getAllSubChain;
            }

            while (getAllSub.PreviousSubscriptionId != null)
            {
                var previousId = getAllSub.PreviousSubscriptionId;
                getAllSub = await _subRepo.GetByIdAsync(previousId);
                if (getAllSub == null) break;
            }
            if (getAllSub != null) getAllSubChain.Add(getAllSub);  // Add cuối sau loop
            getAllSubChain.Reverse();  // Optional: Từ cũ → mới
            return getAllSubChain;
        }
    }
}
