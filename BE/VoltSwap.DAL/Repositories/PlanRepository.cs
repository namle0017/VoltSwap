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

        public async Task<Plan?> GetPlanAsync(String planId)
        {
            return await _context.Plans.FirstOrDefaultAsync(plan => plan.PlanId == planId);
        }

        public async Task<List<Fee>> GetAllFeeAsync(string planId)
        {
            return await _context.Fees.Where(fee => fee.PlanId == planId && fee.Status == "Active").ToListAsync();
        }
    }
}
