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
    public class BatterySwapRepository : GenericRepositories<BatterySwap>, IBatterySwapRepository
    {
        private readonly VoltSwapDbContext _context;

        public BatterySwapRepository(VoltSwapDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<List<BatterySwap>> GetBatteryInUsingAsync(String subId)
        {
            return await _context.BatterySwaps.Where(batHistory => batHistory.SubscriptionId == subId && batHistory.Status == "Using")
                .ToListAsync();
        }

        //Chỗ này là truyền về pillarSlot để biết cục pin được đưa vào đâu
        public async Task<PillarSlot> GetPillarSlot(int batSlotid)
        {
            return await _context.PillarSlots.FirstOrDefaultAsync(slot => slot.SlotId == batSlotid);
        }

        public async Task<List<BatterySwap>> GetBatteriesBySubscriptionId(string subId)
        {
            return await _context.BatterySwaps
                .Where(swap => swap.SubscriptionId == subId && swap.Status == "Using")
                .ToListAsync();
        }

        public async Task<Battery> GetBatteryInventoryInStaiion (string stationId ,string batteryId)
        {
            return await _context.Batteries
                            .Where(b => b.BatteryId == batteryId
                                    && b.BatterySwapStationId == stationId 
                                    && b.BatteryStatus == "Warehouse")
                            .FirstOrDefaultAsync();
        }

        public async Task<List<BatterySwap>> GetListBatterySwap (string stationId)
        {
            return await _context.BatterySwaps
                           .Where(bw => bw.BatterySwapStationId == stationId)
                           .ToListAsync();
        }

    }
}
