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

        //Bin: Lấy danh sách pin trong kho của trạm theo StaffId
        public async Task<List<Battery>> GetBatteriesInventoryByStationId(string StationId)
        {
            var getStation = await _context.StationStaffs.FirstOrDefaultAsync(station => station.BatterySwapStationId == StationId);
            var result = await _context.Batteries
                .Where(bat => bat.BatterySwapStationId == getStation.BatterySwapStationId && (bat.BatteryStatus == "Warehouse" || bat.BatteryStatus == "Maintenance"))
                .ToListAsync();
            return result;
        }

        public async Task<List<Battery>> GetNumberOfBatteries()
        {
            var result = await _context.Batteries
                .Include(bat => bat.BatterySwapStation)
                .Where(bat => bat.BatteryStatus == "Available" && bat.BatterySwapStation.Status == "Active")
                .ToListAsync();
            return result;
        }

        public async Task<Battery> FindingBatteryById(String batId)
        {
            return await _context.Batteries.FirstOrDefaultAsync(bat => bat.BatteryId == batId);
        }
        public async Task<Battery> FindingBatteryInventoryById(String batId, string stationId)
        {
            return await _context.Batteries
                .Include(bat => bat.BatterySwapStation)
                .Where(bat => bat.BatterySwapStationId == stationId
                && bat.BatteryStatus == "Warehouse"
                && bat.BatteryId == batId).FirstOrDefaultAsync();
        }
    }
}
