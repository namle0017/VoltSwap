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
    public class TransactionRepository : GenericRepositories<Transaction>, ITransactionRepository
    {
        private readonly VoltSwapDbContext _context;

        public TransactionRepository(VoltSwapDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<List<(string PlanId, string PlanName, double TotalRevenue, int TotalSubscribers)>> GetRevenueByPlanAsync(int year, int month)
        {
            
            var revenueByPlan = await _context.Transactions.Where(trans => trans.TransactionDate.Year == year && trans.TransactionDate.Month == month && trans.Status == "Success" && trans.TransactionType== "Register")
                //Ở đây group biết nó là bảng tạm của Transaction bởi vì trước nó là _context.Transactions
                //Vậy GroupBy ở đây được hiểu như thế này: g nó biết nó là 1 tham số của transaction nhưng kết quả trả về không còn là transaction nữa mà là IGrouping<string, Transaction>
                .GroupBy(group => group.Subscription.Plan.PlanName)
                .OrderByDescending(group => group.Sum(trans => trans.Amount))
                .Take(3)
                .Select(group => new
                {
                    PlanId = group.Key,
                    PlanName = group.Key,
                    TotalAmount = (double)group.Sum(trans => trans.Amount)
                }).ToListAsync();

            var subscribersCount =await _context.Subscriptions
                .Where(sub => sub.StartDate.Month == month && sub.StartDate.Year == year)
                .GroupBy(sub => sub.PlanId)
                .Select(group => new
                {
                    Id = group.Key,
                    TotalSubscribers = (int)group.Count(sub => sub.UserDriverId != null) // đếm UserDriverId khác null
                }).ToListAsync();

            var result = revenueByPlan
                .GroupJoin(subscribersCount,
                trans => trans.PlanId,
                sub => sub.Id,
                (trans, subGroup) => new
                {
                    trans.PlanId,
                    trans.PlanName,
                    trans.TotalAmount,
                    NumberOfSubscribers = subGroup.FirstOrDefault()?.TotalSubscribers ?? 0,
                }).ToList();
            return result.Select(r => (r.PlanId, r.PlanName, r.TotalAmount, r.NumberOfSubscribers)).ToList();
        }

        public async Task<double> GetRevenueByAsync(int year, int month)
        {
            var result = await _context.Transactions.Where(x => x.TransactionDate.Year == year && x.TransactionDate.Month == month && x.Status == "Success" && x.TransactionType == "Register")
                .SumAsync(x => (double)x.Amount);
            return result;
        }

        public async Task<List<Transaction>> TransactionListNotpayBySubId (string subId)
        {
            return  await _context.Transactions
                .Where( t => t.SubscriptionId == subId
                        && (t.Status == "Waiting" || t.Status == "Processing")).ToListAsync();
        }
    }
}
