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
    public class PillarSlotRepository : GenericRepositories<PillarSlot>, IPillarSlotRepository
    {
        private readonly VoltSwapDbContext _context;

        public PillarSlotRepository(VoltSwapDbContext context) : base(context) => _context = context;



        public async Task<List<PillarSlot>> GetLockedSlotsByStationAsync(string stationId)
        {
            return await _context.PillarSlots
                .Include(ps => ps.BatterySwapPillar)
                .Include(ps => ps.Battery)
                .Where(ps => ps.AppointmentId != null &&                      
                             ps.BatterySwapPillar.BatterySwapStationId == stationId &&  
                             ps.PillarStatus == "Lock")                       
                            .ToListAsync();
        }

        public async Task<List<PillarSlot>> GetAvailableSlotsByPillarAsync(string pillarId)
        {
            return await _context.PillarSlots
                                .Include(ps => ps.Battery)
                                .Where(ps =>
                                    ps.BatterySwapPillarId == pillarId &&
                                    ps.PillarStatus == "Unavailable" &&
                                    ps.Battery != null &&
                                    ps.Battery.BatteryStatus == "Available")
                                .ToListAsync();
        }

        public async Task<List<PillarSlot>> UnlockSlotsByAppointmentIdAsync(string appointmentId)
        {
            return await _context.PillarSlots
                                .Include(ps => ps.Battery)
                                .Include(ps => ps.BatterySwapPillar)
                                .Where(ps => ps.AppointmentId == appointmentId && ps.PillarStatus == "Lock")
                                .ToListAsync();
        }

        public async Task<List<PillarSlot>> GetUnavailableSlotsAtStationAsync(string stationId, int take)
        {
            return await _context.PillarSlots
                .Include(ps => ps.BatterySwapPillar)
                .Where(ps => ps.BatterySwapPillar.BatterySwapStationId == stationId
                             && ps.PillarStatus == "Unavailable")
                .OrderByDescending(ps => ps.BatterySwapPillarId)
                .ThenByDescending(ps => ps.SlotNumber)
                .Take(take)
                .ToListAsync();
        }

        public async Task<PillarSlot> GetEmptySlot(int pillarslotId)
        {
            return await _context.PillarSlots
                .Where(ps => ps.SlotId == pillarslotId
                    && ps.BatteryId == null
                    && ps.PillarStatus == "Available")
                .FirstOrDefaultAsync();
        }
        public async Task<PillarSlot> GetSlotWithBattery(int PilarSlotId, string batteryId)
        {
            return await _context.PillarSlots
                .Where(ps => ps.SlotId == PilarSlotId
                    && ps.BatteryId == batteryId)
                .FirstOrDefaultAsync();
        }
        public async Task<PillarSlot> GetSlotsByPillarSlotIdAsync(int pillarSlotId)
        {
            return await _context.PillarSlots
                .Where(ps => ps.SlotId == pillarSlotId)
                .FirstOrDefaultAsync();
        }

    }
}

