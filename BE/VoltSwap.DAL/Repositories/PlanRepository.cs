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
    public class PlanRepository : GenericRepositories<Plan>, IPlanRepository
    {
        private readonly VoltSwapDbContext _context;

        public PlanRepository(VoltSwapDbContext context) : base(context)
        {
            _context = context;
        }
        //Bin: lấy plan Name của user đăng ký
        public async Task<List<string>> GetCurrentSubscriptionByUserIdAsync(string userId)
        {
            var subscription = await _context.Subscriptions
                .Where(sub => sub.UserDriverId == userId && sub.Status == "Active")
                .Include(sub => sub.Plan)
                .Select(sub => sub.Plan.PlanName).ToListAsync();
            return subscription;
        }
        public async Task<List<Subscription>> GetCurrentWithSwapSubscriptionByUserIdAsync(string userId)
        {
            var getSub = await _context.Subscriptions
                .Where(sub => sub.UserDriverId == userId && (sub.Status == "Active"))
                .Include(sub => sub.Plan)
                .ToListAsync();
            return getSub;
        }

        public async Task<Plan?> GetPlanAsync(String planId)
        {
            return await _context.Plans.FirstOrDefaultAsync(plan => plan.PlanId == planId);
        }

        public async Task<List<Fee>> GetAllFeeAsync(string planId)
        {
            return await _context.Fees.Where(fee => fee.PlanId == planId && fee.Status == "Active").ToListAsync();
        }

        //Bin: Đếm tổng người dùng đang sử dụng plan đó
        public async Task<int> CountUsersByPlanIdAsync(string planId, int month, int year)
        {
            return await _context.Subscriptions.Where(sub => sub.PlanId == planId
              && sub.Status == "Active"
              && sub.StartDate.Month == month
              && sub.StartDate.Year == year).CountAsync();

        }
        public async Task<int> CountUsersCurrentMonthByPlanIdAsync(string planId)
        {
            var today = DateTime.UtcNow.ToLocalTime();
            return await _context.Subscriptions.Where(sub => sub.PlanId == planId
              && sub.Status == "Active"
              && sub.StartDate.Month == today.Month
              && sub.StartDate.Year == today.Year).CountAsync();

        }

        //Bin: Lấy doanh thu từng plan trong tháng
        public async Task<decimal> GetRevenueByPlanIdAsync(string planId, int month, int year)
        {
            var totalRevenue = await _context.Transactions
                .Where(trans => trans.Subscription.PlanId == planId
                    && trans.Status == "Success"
                    && trans.CreateAt.HasValue
                    && trans.CreateAt.Value.Month == month
                    && trans.CreateAt.Value.Year == year)
                .SumAsync(trans=> trans.TotalAmount);
            return totalRevenue;
        }
        public async Task<decimal> GetRevenueCurrentMonthByPlanIdAsync(string planId)
        {
            var today = DateTime.UtcNow.ToLocalTime();
            var totalRevenue = await _context.Transactions
                .Where(trans => trans.Subscription.PlanId == planId
                    && trans.Status == "Success"
                    && trans.CreateAt.HasValue
                    && trans.CreateAt.Value.Month == today.Month
                    && trans.CreateAt.Value.Year == today.Year)
                .SumAsync(trans=> trans.TotalAmount);
            return totalRevenue;
        }
    }
}
