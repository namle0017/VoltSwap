using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;

namespace VoltSwap.DAL.IRepositories
{
    public interface ISubscriptionRepository : IGenericRepositories<Subscription>
    {
        Task<List<Subscription>> GetSubscriptionByUserIdAsync(string userId);
        Task<bool> IsPlanHoldingBatteryAsync(string subId);
        Task<bool> CheckPlanAvailabel(string subId);
        Task<int> GetNumberOfbatteryInSub(string subId);
        Task<int> GetTotalSwapsUsedByDriverIdAsync(string DriverId);
        Task<int> GetBatteryCountBySubscriptionIdAsync(string subscriptionId);
        Task<int> GetTotalSwapsUsedInMonthAsync(int month, int year);
        Task<User> GetUserBySubscriptionIdAsync(string subId);
    }
}
