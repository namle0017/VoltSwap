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
    public class ReportRepository : GenericRepositories<Report>, IReportRepository
    {
        private readonly VoltSwapDbContext _context;

        public ReportRepository(VoltSwapDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<string> GetDriverContact(String driverId)
        {
            return await _context.Users.Where(rp => rp.UserId == driverId).Select(rp => rp.UserEmail).FirstOrDefaultAsync();
        }

        public async Task<List<Report>> GetReportForStaff(string staffId)
        {
            return await _context.Reports.Where(x => x.UserStaffId == staffId)
                            .Include(x => x.ReportType)
                            .OrderByDescending(x => x.CreateAt)
                            .ToListAsync();
        }
    }
}
