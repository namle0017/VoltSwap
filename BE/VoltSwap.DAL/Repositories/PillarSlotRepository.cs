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
        private const string SLOT_USE = "Use";
        private const string SLOT_LOCK = "Lock";

        public PillarSlotRepository(VoltSwapDbContext context) : base(context) => _context = context;

        public async Task<int> LockSlotsAsync(string stationId, string subscriptionId, string bookingId)
        {
            var requiredBatteries = await _context.Subscriptions
                .Where(s => s.SubscriptionId == subscriptionId)
                .Select(s => s.Plan.NumberOfBattery)
                .FirstOrDefaultAsync();

            var slotsToLock = await _context.PillarSlots
                .Include(ps => ps.BatterySwapPillar)
                .Where(ps => ps.BatterySwapPillar.BatterySwapStationId == stationId
          && ps.PillarStatus == "Unavailable")
                .OrderByDescending(ps => ps.BatterySwapPillarId)
                .ThenByDescending(ps => ps.SlotNumber)
                .Take(requiredBatteries.Value)
                .ToListAsync();

            foreach (var slot in slotsToLock)
            {
                slot.PillarStatus = "Lock";
                slot.AppointmentId = bookingId;
                _context.PillarSlots.Update(slot);

            }


            return await _context.SaveChangesAsync();


        }
        public async Task<int> UnlockSlotsByAppointmentIdAsync(string appointmentId)
        {
            if (string.IsNullOrWhiteSpace(appointmentId)) return 0;

            var slots = await _context.PillarSlots
                .Where(ps => ps.AppointmentId == appointmentId && ps.PillarStatus == SLOT_LOCK)
                .ToListAsync();

            if (slots.Count == 0) return 0;

            foreach (var slot in slots)
            {
                slot.PillarStatus = SLOT_USE;
                slot.AppointmentId = null;           // giải liên kết
                slot.UpdateAt = DateTime.UtcNow;
            }

            _context.PillarSlots.UpdateRange(slots);
            return await _context.SaveChangesAsync();
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

        public async Task<PillarSlot> GetEmptySlot (int  pillarslotId)
        {
            return await _context.PillarSlots
                .Where(ps => ps.SlotId == pillarslotId
                    && ps.BatteryId == null
                    && ps.PillarStatus == "Available")
                .FirstOrDefaultAsync();
        }
        public async Task<PillarSlot> GetSlotWithBattery( int PilarSlotId, string batteryId)
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

