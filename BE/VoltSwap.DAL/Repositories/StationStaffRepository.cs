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
    public class StationStaffRepository : GenericRepositories<StationStaff>, IStationStaffRepository
    {
        private readonly VoltSwapDbContext _context;

        public StationStaffRepository(VoltSwapDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<StationStaff> GetStationWithStaffIdAsync(string staffId)
        {

            return await _context.StationStaffs.FirstOrDefaultAsync(ss => ss.UserStaffId == staffId );
        }
    }
}
