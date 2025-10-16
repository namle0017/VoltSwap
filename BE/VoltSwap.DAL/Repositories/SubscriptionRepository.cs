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

        public async Task<bool> IsPlanHoldingBatteryAsync(string subId)
        {

            //AnyAsync sẽ trả về true fasle
            return await _context.BatterySwaps.AnyAsync(x => x.SubscriptionId == subId);
        }
        
        public async Task<bool> CheckPlanAvailabel(string subId)
        {
            return await _context.Subscriptions.AnyAsync(x => x.SubscriptionId == subId);
        }

        public async Task<int> GetNumberOfbatteryInSub(string subId)
        {
            var count = await _context.Subscriptions
                .Where(sub => sub.SubscriptionId == subId)
                .Select(sub => sub.Plan.NumberOfBattery)
                .FirstOrDefaultAsync();
            return count??0;
        }
    }
}
