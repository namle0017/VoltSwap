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
            return await _context.BatterySwaps.Where(batHistory => batHistory.SubscriptionId == subId && batHistory.Status == "In using")
                .ToListAsync();
        }

        public async Task<PillarSlot> GetPillarSlot(int batSlotid)
        {
            return await _context.PillarSlots.FirstOrDefaultAsync(slot => slot.SlotId == batSlotid);
        }
    }
}
