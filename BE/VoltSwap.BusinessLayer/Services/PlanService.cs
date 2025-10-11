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
    public class PlanService : BaseService, IPlanService
    {
        private readonly IGenericRepositories<Plan> _planRepo;
        private readonly IGenericRepositories<Fee> _feeRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public PlanService(
            IServiceProvider serviceProvider,
            IGenericRepositories<Plan> planRepo,
            IGenericRepositories<Fee> feeRepo,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _planRepo = planRepo;
            _feeRepo = feeRepo;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }

        public async Task<ServiceResult> GetPlanAsync()
        {
            var getPlanList = await _planRepo.GetAllAsync();
            var getList = getPlanList.Select(plan => new PlanDtos
            {
                PlanId = plan.PlanId,
                PlanName = plan.PlanName,
                NumberBattery = plan.NumberOfBattery ?? 0,
                DurationDays = plan.DurationDays ?? 0,
                MilleageBaseUsed = plan.MileageBaseUsed ?? 0,
                SwapLimit = plan.SwapLimit ?? 0,
                Price = plan.Price,
            }).ToList();

            return new ServiceResult
            {
                Status = 200,
                Message = "Successfull",
                Data = getList
            };
        }

        public async Task<int> GetDurationDays(string planId)
        {
            var getPlan = await _planRepo.GetByIdAsync(planId);
            int getDurationDays = getPlan.DurationDays ?? 0;
            return getDurationDays;
        }
    }
}
