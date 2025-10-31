using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.Common.DTOs;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IPlanService
    {
        Task<ServiceResult> GetPlanAsync();
        Task<int> GetDurationDays(string planId);
        Task<decimal> GetPriceByPlanId(string planId);
        Task<int> GetSwapLimitByPlanId(string newPlanId);
        Task<ServiceResult> GetPlanListSummaryAsync(int month, int year);
        Task<ServiceResult> GetPlanWithSuggestAsync(List<String> planName);
        Task<PlanSummary> GetPlanSummaryAsync(int month, int year);
    }
}
