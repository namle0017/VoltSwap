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
    public class BatteryRepository : GenericRepositories<Battery>, IBatteryRepository
    {
        private readonly VoltSwapDbContext _context;

        public BatteryRepository(VoltSwapDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<List<Battery>> GetNumberOfBatteries()
        {
            var result =await  _context.Batteries
                .Include(bat => bat.BatterySwapStation)
                .Where(bat => bat.BatteryStatus == "Available" && bat.BatterySwapStation.Status=="Active")
                .ToListAsync();
            return result;
        }

        public async Task<Battery> FindingBatteryById(String batId)
        {
            return await _context.Batteries.FirstOrDefaultAsync(bat => bat.BatteryId == batId);
        }
    }
}
