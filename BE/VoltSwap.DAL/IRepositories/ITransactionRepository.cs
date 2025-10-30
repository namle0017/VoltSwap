using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;

namespace VoltSwap.DAL.IRepositories
{
    public interface ITransactionRepository : IGenericRepositories<Transaction>
    {
        Task<List<(string PlanId, string PlanName, double TotalRevenue, int TotalSubscribers)>> GetRevenueByPlanAsync(int year, int month);

        Task<double> GetRevenueByAsync(int year, int month);
        Task<List<Transaction>> TransactionListNotpayBySubId(string subId);
    }
}
