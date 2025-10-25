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
<<<<<<< HEAD
        Task<ReportSummaryResponse> GetPlanSummaryAsync(int month, int year)
=======
        Task<ServiceResult> GetPlanDetailListAsync();
>>>>>>> f44f047b01504e316d67782ce1471ff341e4a160
    }
}
