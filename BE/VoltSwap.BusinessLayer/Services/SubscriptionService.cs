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
        private readonly IPlanService _planService;
        private readonly IGenericRepositories<Subscription> _subRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public SubscriptionService(
            IServiceProvider serviceProvider,
            IGenericRepositories<Subscription> subRepo,
            PlanService planService,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _subRepo = subRepo;
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

        public async Task<ServiceResult> GetUserSubscriptionsAsync(CheckSubRequest request)
        {
            var userSubscriptions = await _unitOfWork.Subscriptions
                .GetSubscriptionByUserIdAsync(request.DriverId);

            if (userSubscriptions == null || !userSubscriptions.Any())
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "No subscriptions found for the user."
                };
            }

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            bool hasChanges = false;


            foreach (var sub in userSubscriptions)
            {
                // Nếu đã quá 4 ngày kể từ EndDate -> Inactive 
                if (sub.EndDate.AddDays(4) < today && sub.Status != "Inactive")
                {
                    sub.Status = "Inactive";
                    hasChanges = true;
                }
                // Nếu hết hạn nhưng chưa quá 4 ngày -> Expired
                else if (sub.EndDate < today && sub.Status == "Active")
                {
                    sub.Status = "Expired";
                    hasChanges = true;
                }
            }

            // Nếu có thay đổi -> cập nhật DB
            if (hasChanges)
            {
                _unitOfWork.Subscriptions.UpdateRange(userSubscriptions);
                await _unitOfWork.SaveChangesAsync();
            }

            var subscriptionDtos = userSubscriptions
                .Where(sub => sub.Status != "Inactive")
                .Select(sub => new ServiceOverviewItemDto
                {
                    SubId = sub.SubscriptionId,
                    PlanName = sub.Plan?.PlanName,
                    PlanStatus = sub.Status,
                    SwapLimit = null,
                    Remaining_swap = sub.RemainingSwap,
                    Current_miligate = sub.CurrentMileage,
                    EndDate = sub.EndDate
                })
                .ToList();

            return new ServiceResult
            {
                Status = 200,
                Message = "Subscriptions retrieved successfully.",
                Data = subscriptionDtos
            };
        }

        public async Task<ServiceResult> RenewPlanAsync(string UserDriverId, string subcriptionId)
        {
            var getsub = await _unitOfWork.Subscriptions
                .GetAllQueryable()
                .FirstOrDefaultAsync(s => s.SubscriptionId == subcriptionId
                                        && s.UserDriverId == UserDriverId);
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
            getsub.PreviousSubscriptionId = subcriptionId;
            getsub.StartDate = today;
            getsub.EndDate = today.AddDays(durationDays);
            getsub.Status = "Active";
            _unitOfWork.Subscriptions.Update(getsub);
            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = "Subscription renewed successfully.",
                Data = new
                {
                    getsub.SubscriptionId,
                    getsub.PreviousSubscriptionId,
                    getsub.PlanId,
                    getsub.StartDate,
                    getsub.EndDate,
                    getsub.Status
                }
            };
        }
        public async Task<ServiceResult> ChangePlanAsync(string UserDriverId, string subcriptionId, string newPlanId)
        {
            var getsub = await _unitOfWork.Subscriptions
                .GetAllQueryable()
                .FirstOrDefaultAsync(s => s.SubscriptionId == subcriptionId
                               && s.UserDriverId == UserDriverId);

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (getsub.Status == "Active")
            {
                return new ServiceResult(409, "Subscription is still active. You can only change after it expires.");
            }

            if (getsub.Status == "Inactive")
            {
                return new ServiceResult(409, "Subscription is inactive and cannot be changed.");
            }

            var durationDays = await _planService.GetDurationDays(newPlanId);

            getsub.PlanId = newPlanId;
            getsub.PreviousSubscriptionId = subcriptionId;
            getsub.StartDate = today;
            getsub.EndDate = today.AddDays(durationDays);
            getsub.Status = "active";

            _unitOfWork.Subscriptions.Update(getsub);
            await _unitOfWork.SaveChangesAsync();

            var newSubId = await GenerateSubscriptionId();
            var data = new ChangePlanResponse
            {
                SubscriptionId = newSubId,
                PreviousSubcriptionId = subcriptionId,
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
                subscriptionId = $"SUB-{string.Concat(Enumerable.Range(0, 10).Select(_ => random.Next(0, 10).ToString()))}";

                // Kiểm tra xem có trùng không
                isDuplicated = await _subRepo.AnyAsync(u => u.SubscriptionId == subscriptionId);

            } while (isDuplicated);
            return subscriptionId;
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
