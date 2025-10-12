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
    public class SubscriptionService : BaseService, ISubscriptionService
    {
        private readonly IGenericRepositories<Subscription> _subRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public SubscriptionService(
            IServiceProvider serviceProvider,
            IGenericRepositories<Subscription> subRepo,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _subRepo = subRepo;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }

        public async Task<ServiceResult> UserPlanCheckerAsync(CheckSubRequest requestDto)
        {
            var checkUserPlan = await _unitOfWork.Subscriptions.GetSubscriptionByUserIdAsync(requestDto.UserId);
            if(checkUserPlan == null)
            {
                //204 User chưa mua gì hết
                return new ServiceResult
                {
                    Status = 204,
                    Message= "User has not purchased any plans."
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
    }
}
