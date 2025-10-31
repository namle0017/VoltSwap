using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Models;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface ISubscriptionService
    {
        //Task<ServiceResult> RegisterSubcriptionAsync(string DriverId, string PlanId);
        Task<ServiceResult> UserPlanCheckerAsync(CheckSubRequest requestDto);
        Task<ServiceResult> ChangeSubcriptionAsync(string DriverId, string SubId, string newPlanId);
        Task<ServiceResult> RenewSubcriptionAsync(string DriverId, string SubId);
        Task<List<Subscription>> GetPreviousSubscriptionAsync(CurrentSubscriptionResquest requestDto);
    }
}
