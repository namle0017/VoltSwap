using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;

namespace VoltSwap.DAL.IRepositories
{
    public interface IPlanRepository : IGenericRepositories<Plan>
    {
        Task<Plan?> GetPlanAsync(string planId);
        Task<List<Fee>> GetAllFeeAsync(string planId);
        Task<List<Subscription>> GetCurrentWithSwapSubscriptionByUserIdAsync(string userId);
        Task<List<string>> GetCurrentSubscriptionByUserIdAsync(string userId);
        Task<int> CountUsersByPlanIdAsync(string planId, int month, int year);
        Task<decimal> GetRevenueByPlanIdAsync(string planId, int month, int year);
        Task<decimal> GetRevenueCurrentMonthByPlanIdAsync(string planId);
        Task<int> CountUsersCurrentMonthByPlanIdAsync(string planId);

    }
}
