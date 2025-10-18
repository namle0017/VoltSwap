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
        Task<ServiceResult> UserPlanCheckerAsync(CheckSubRequest requestDto);
        Task<ServiceResult> GetUserSubscriptionsAsync(CheckSubRequest request);
        Task<ServiceResult> ChangePlanAsync(string UserDriverId, string subcriptionId, string newPlanId);
        Task<ServiceResult> RenewPlanAsync(string UserDriverId, string subcriptionId);
        Task<List<Subscription>> GetPreviousSubscriptionAsync(CurrentSubscriptionResquest requestDto);
    }
}
