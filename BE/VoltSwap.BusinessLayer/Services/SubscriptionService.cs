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
            var userSubscriptions = await _unitOfWork.Subscriptions.GetSubscriptionByUserIdAsync(request.DriverId);
            if (userSubscriptions == null || !userSubscriptions.Any())
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "No subscriptions found for the user."
                };
            }
            var subscriptionDtos = userSubscriptions.Select(sub => new ServiceOverviewItemDto
            {
                SubId = sub.SubscriptionId,
                PlanName = sub.Plan.PlanName,
                PlanStatus = sub.Status,
                SwapLimit = null,
                Remaining_swap = sub.RemainingSwap,
                Current_miligate = sub.CurrentMileage,
                EndDate = sub.EndDate

            }).ToList();

            return new ServiceResult
            {
                Status = 200,
                Message = "Done",
                Data = subscriptionDtos
            };



        }
        public async Task<ServiceResult> RegisterPlanAsync(string UserDriverId, string subcriptionId)
        {
            var getsub = await _unitOfWork.Subscriptions
                .GetAllQueryable()
                .FirstOrDefaultAsync( s => s.SubscriptionId == subcriptionId
                                        && s.UserDriverId == UserDriverId);
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            bool isExpired = getsub.EndDate < today;

            if (!isExpired)
            {
                return new ServiceResult(409, "Subscription is still active. You can change after it expires.");
            }
            var durationDays = await _planService.GetDurationDays(getsub.PlanId);

            getsub.StartDate = today;
            getsub.EndDate = today.AddDays(durationDays);
            getsub.Status = "active";
            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = "Subscription renewed successfully.",
                Data = new
                {
                    getsub.SubscriptionId,
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
            bool isExpired = getsub.EndDate < today;

            if (!isExpired)
            {
                return new ServiceResult(409, "Subscription is still active. You can change after it expires.");
            }

            var durationDays = await _planService.GetDurationDays(newPlanId);

            getsub.PlanId = newPlanId;
            getsub.StartDate = today;
            getsub.EndDate = today.AddDays(durationDays);
            getsub.Status = "active";

            _unitOfWork.Subscriptions.Update(getsub);
            await _unitOfWork.SaveChangesAsync();

            var newSubId = await GenerateSubscriptionId();
            var data = new ChangePlanResponse
            {
                SubscriptionId = newSubId,
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
                subscriptionId = $"SUB-{string.Concat(Enumerable.Range(0, 10).Select(_ => random.Next(0, 8).ToString()))}";

                // Kiểm tra xem có trùng không
                isDuplicated = await _subRepo.AnyAsync(u => u.SubscriptionId == subscriptionId);

            } while (isDuplicated);
            return subscriptionId;
        }
    }
}
