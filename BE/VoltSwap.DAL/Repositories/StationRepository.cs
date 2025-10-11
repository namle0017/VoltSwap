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
    public class StationRepository : GenericRepositories<BatterySwapStation>, IStationRepository
    {
        private readonly VoltSwapDbContext _context;

        public StationRepository(VoltSwapDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<(int, int)> GetNumberOfStationActive()
        {
            int numberOfStationActive = await _context.BatterySwapStations.CountAsync(x => x.Status =="Active");
            int numberOfStation = await _context.BatterySwapStations.CountAsync();
            return (numberOfStationActive, numberOfStation);
        }



        public async Task<List<PillarSlot>> GetBatteriesByStationIdAsync(String stationId)
        {
            var pillarSlots = await _context.PillarSlots
                .Include(slot => slot.BatterySwapPillar)
                .ThenInclude(slot => slot.BatterySwapStation)
                .Include(slot => slot.Battery)
                .Where(slot => slot.BatterySwapPillar.BatterySwapStationId == stationId && (slot.PillarStatus == "Available" || slot.PillarStatus == "Lock"))
                .ToListAsync();
            return pillarSlots;
        }
    }
}
