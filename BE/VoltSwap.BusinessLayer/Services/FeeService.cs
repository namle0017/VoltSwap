using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;
using VoltSwap.DAL.UnitOfWork;
using static VoltSwap.Common.DTOs.FeeDtos;

namespace VoltSwap.BusinessLayer.Services
{
    public class FeeService : BaseService , IFeeService
    {
        private readonly IGenericRepositories<Fee> _feeRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public FeeService(
            IServiceProvider serviceProvider,
            IGenericRepositories<Fee> feeRepo,
             IUnitOfWork unitOfWork,
            IConfiguration configuration
            ) : base(serviceProvider)
        {
            _feeRepo = feeRepo;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }

        //Bin:update các fee theo loại gói 
        public async Task<ServiceResult> UpdateFeesByGroupKeyAsync(UpdateFeeGroupRequest request)
        {
            var plans = await _unitOfWork.Plans.GetAllAsync();
            var targetPlans = plans
                .Where(p => GetGroupKey(p.PlanName) == request.GroupKey)
                .ToList();

            if (!targetPlans.Any())
                return new ServiceResult { Status = 404, Message = "No plans found for this group" };

            foreach (var plan in targetPlans)
            {
                foreach (var feeReq in request.Fees)
                {
                    if (feeReq.TypeOfFee.Equals("Excess Mileage", StringComparison.OrdinalIgnoreCase))
                    {
                        var fees = await _unitOfWork.Fees.GetAllQueryable()
                            .Where(f => f.PlanId == plan.PlanId && f.TypeOfFee == "Excess Mileage")
                            .OrderBy(f => f.MinValue)
                            .ToListAsync();

                        for (int i = 0; i < feeReq.Tiers.Count && i < fees.Count; i++)
                        {
                            var dbFee = fees[i];
                            var reqTier = feeReq.Tiers[i];

                            dbFee.MinValue = reqTier.MinValue;
                            dbFee.MaxValue = reqTier.MaxValue;
                            dbFee.Amount = reqTier.Amount;
                            dbFee.Unit = reqTier.Unit;

                            _unitOfWork.Fees.Update(dbFee);
                        }
                    }
                    else
                    {
                        var fee = await _unitOfWork.Fees.GetByIdAsync(f =>
                            f.PlanId == plan.PlanId &&
                            f.TypeOfFee == feeReq.TypeOfFee);
                        fee.Amount = (decimal)(feeReq.Amount ?? 0);
                        fee.Unit = feeReq.Unit;

                        _unitOfWork.Fees.Update(fee);
                    }
                }
            }

            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = $"Updated fees successfully for group {request.GroupKey}"
            };
        }


        //Hàm để lấy nhóm plan
        private string GetGroupKey(string? planName)
        {

            var name = planName.Trim();
            if (name.StartsWith("TP", StringComparison.OrdinalIgnoreCase)) return "TP";
            if (name.StartsWith("G", StringComparison.OrdinalIgnoreCase)) return "G";
            return "Other";
        }

    }
}
