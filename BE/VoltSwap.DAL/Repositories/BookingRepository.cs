
﻿using System;
﻿using Microsoft.EntityFrameworkCore;
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

    public class BookingRepository: GenericRepositories<Appointment>, IBookingRepository
    {
        private VoltSwapDbContext _context;
        private const string SLOT_USE = "Use";
        private const string SLOT_LOCK = "Lock";
        public BookingRepository(VoltSwapDbContext context)
        {
            _context = context;
        }
        public async Task<Appointment?> GetNotDoneriptionIdAsync(string subscriptionId)
        {
            return await _context.Appointments
                .Where(a => a.SubscriptionId == subscriptionId && a.Status == "Not Done")
                .FirstOrDefaultAsync();
        }


        public async Task<List<PillarSlot>> GetBatteriesAvailableByStationAsync(string pillarId, int topNumber)
        {
            return await _context.PillarSlots
            .Where(ps => ps.BatterySwapPillarId == pillarId
                         && ps.Battery != null
                         && ps.Battery.BatteryStatus == "Available")
            .OrderByDescending(ps => ps.Battery.Soc)
            .Take(topNumber)
            .ToListAsync();
        }
    }
}
