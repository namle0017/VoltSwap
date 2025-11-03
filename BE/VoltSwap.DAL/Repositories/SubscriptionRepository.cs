using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Data;
using VoltSwap.DAL.IRepositories;
using VoltSwap.DAL.Models;

namespace VoltSwap.DAL.Repositories
{
    public class SubscriptionRepository : GenericRepositories<Subscription>, ISubscriptionRepository
    {
        private readonly VoltSwapDbContext _context;

        public SubscriptionRepository(VoltSwapDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<List<Subscription>> GetSubscriptionByUserIdAsync(string userId)
        {
            var getSub = await _context.Subscriptions.Where(sub => sub.UserDriverId == userId && (sub.Status == "Active" || sub.Status == "Expired"))
                .OrderByDescending(sub => sub.StartDate)
                .Include(sub => sub.Plan)
                .ToListAsync();
            return getSub;
        }
        public async Task<User> GetUserBySubscriptionIdAsync(string subId)
        {
            var getuser = await _context.Subscriptions.Where(sub => sub.SubscriptionId == subId)
                                                     .Select(u => u.UserDriver)
                                                     .FirstOrDefaultAsync();
            return getuser;
        }

        public async Task<bool> IsPlanHoldingBatteryAsync(string subId)
        {

            //AnyAsync sẽ trả về true fasle
            return await _context.BatterySwaps.AnyAsync(x => x.SubscriptionId == subId);
        }

        public async Task<bool> CheckPlanAvailabel(string subId)
        {
            return await _context.Subscriptions.AnyAsync(x => x.SubscriptionId == subId && x.Status == "Active");
        }

        public async Task<int> GetNumberOfbatteryInSub(string subId)
        {
            var count = await _context.Subscriptions
                .Where(sub => sub.SubscriptionId == subId)
                .Include(plan => plan.Plan)
                .Select(sub => sub.Plan.NumberOfBattery)
                .FirstOrDefaultAsync();
            return count ?? 0;
        }

        //Bin: TÍnh tổng số lượng swap đã sử dụng của driver 
        public async Task<int> GetTotalSwapsUsedByDriverIdAsync(string DriverId)
        {
            int totalSwaps = 0;
            var getListsub = await _context.Subscriptions
                .Where(sub => sub.UserDriverId == DriverId && sub.Status == "Active")
                .ToListAsync();
            foreach (var subId in getListsub)
            {
                totalSwaps += (int)subId.RemainingSwap;

            }

            return totalSwaps;
        }

        //Bin : lấy số lượng pin theo subscription id
        public async Task<int> GetBatteryCountBySubscriptionIdAsync(string subscriptionId)
        {
            var batteryCount = await _context.Subscriptions
                .Include(p => p.Plan)
                .Where(sub => sub.SubscriptionId == subscriptionId)
                .Select(sub => sub.Plan.NumberOfBattery)
                .FirstOrDefaultAsync();
            return (int)batteryCount;
        }


        //Bin: Tính tổng số lượng swap đã sử dụng trong tháng 
        public async Task<int> GetTotalSwapsUsedInMonthAsync(int month, int year)
        {
            var totalSwapsUsed = await _context.Subscriptions
                .Where(swap => swap.StartDate.Month == month && swap.StartDate.Year == year)
                .SumAsync(sub => sub.RemainingSwap);
            return (int)totalSwapsUsed;
        }


    }


}
