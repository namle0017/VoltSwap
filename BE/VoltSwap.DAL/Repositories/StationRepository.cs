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
using static System.Collections.Specialized.BitVector32;

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
            int numberOfStationActive = await _context.BatterySwapStations.CountAsync(x => x.Status == "Active");
            int numberOfStation = await _context.BatterySwapStations.CountAsync();
            return (numberOfStationActive, numberOfStation);
        }



        public async Task<List<PillarSlot>> GetBatteriesInPillarByStationIdAsync(String stationId)
        {
            var pillarSlots = await _context.PillarSlots
                .Include(slot => slot.BatterySwapPillar)
                    .ThenInclude(pillar => pillar.BatterySwapStation)
                .Include(slot => slot.Battery)
                .Where(slot => slot.BatterySwapPillar.BatterySwapStationId == stationId)
                .ToListAsync();
            return pillarSlots;
        }



        public async Task<List<PillarSlot>> GetBatteriesByStationAsync()
        {
            var pillarSlots = await _context.PillarSlots
                .Include(slot => slot.BatterySwapPillar)
                .ThenInclude(pillar => pillar.BatterySwapStation)
                .Include(slot => slot.Battery)
                .Where(slot => slot.PillarStatus == "Unavailable")
                .ToListAsync();

            return pillarSlots;
        }


        //Cái repo này sẽ lấy ra các battery nào có trong pillar mà available để đưa cho FE để biết slot nào được bật ra
        public async Task<List<PillarSlot>> GetBatteriesAvailableByPillarIdAsync(string pillarId, int topNumber)
        {
            return await _context.PillarSlots
            .Where(ps => ps.BatterySwapPillarId == pillarId
                         && ps.Battery != null
                         && ps.Battery.BatteryStatus == "Available")
            .OrderByDescending(ps => ps.Battery.Soc)
            .Take(topNumber)
            .ToListAsync();
        }

        public async Task<List<Battery>> GetBatteriesByStationIdAsync(String stationId)
        {
            var bat = await _context.Batteries
                .Include(bat => bat.BatterySwapStation)
                .Where(bat => bat.BatterySwapStationId == stationId)
                .ToListAsync();
            return bat;
        }

        public async Task<List<BatterySwapStation>> GetStationActive()
        {
            return await _context.BatterySwapStations
                .Where(station => station.Status == "Active")
                .ToListAsync();
        }

        public async Task<PillarSlot> GetPillarSlotAsync(int slotId)
        {
            return await _context.PillarSlots.FirstOrDefaultAsync(slot => slot.SlotId == slotId);
        }

        public async Task<BatterySwapStation> GetStationByPillarId(String pillarId)
        {
            return await _context.BatterySwapPillars
                .Where(pillar => pillar.BatterySwapPillarId == pillarId)
                .Include(sta => sta.BatterySwapStation)
                .Select(p => p.BatterySwapStation)
                .FirstOrDefaultAsync();
        }
    }
}
