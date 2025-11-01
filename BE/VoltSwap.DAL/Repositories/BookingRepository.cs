
using System;
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

    public class BookingRepository : GenericRepositories<Appointment>, IBookingRepository
    {
        private VoltSwapDbContext _context;

        public BookingRepository(VoltSwapDbContext context)
        {
            _context = context;
        }
        public async Task<Appointment?> GetNotDoneriptionIdAsync(string subscriptionId)
        {
            return await _context.Appointments
                .Where(a => a.SubscriptionId == subscriptionId && a.Status == "Processing")
                .FirstOrDefaultAsync();
        }


        public async Task<Appointment> CreateAsync(Appointment appointment)
        {

            if (string.IsNullOrWhiteSpace(appointment.AppointmentId))
                appointment.AppointmentId = NewAppointmentId();

            if (string.IsNullOrWhiteSpace(appointment.Status))
                appointment.Status = "Processing";

            appointment.CreateBookingAt = DateTime.UtcNow;

            await _context.Appointments.AddAsync(appointment);
            await _context.SaveChangesAsync();
            return appointment;
        }
        private static string NewAppointmentId()
        {
            // AP- + 7 số, ví dụ: AP-7577315  (10 ký tự)
            return "AP-" + Random.Shared.Next(0, 10_000_000).ToString("0000000");
        }

        public async Task<Appointment> GetBookingCancelBySubId(string subId)
        {
            return await _context.Appointments
                .Where(s => s.SubscriptionId == subId && s.Note == "Cancel Plan")
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

        public async Task<Appointment> GetBookingBySubId(string subId)
        {
            return await _context.Appointments
                                .Where(a => a.SubscriptionId == subId
                                 && a.Note == "Swap Battery")
                                .FirstOrDefaultAsync();
        }
    }
}
