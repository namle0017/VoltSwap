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
    public  class PillarSlotRepository : GenericRepositories<PillarSlot>, IPillarSlotRepository
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
          && ps.PillarStatus == "Use")
                .OrderByDescending(ps => ps.BatterySwapPillarId)
                .ThenByDescending(ps => ps.SlotNumber)
                .Take(requiredBatteries.Value)
                .ToListAsync();

            foreach (var slot in slotsToLock)
            {
                slot.PillarStatus = "Lock";
                
                _context.PillarSlots.Update(slot);
            }
             
            
            return await _context.SaveChangesAsync(); ;


        }

    }
}

