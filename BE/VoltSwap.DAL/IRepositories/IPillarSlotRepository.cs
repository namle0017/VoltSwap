using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;

namespace VoltSwap.DAL.IRepositories
{
    public interface IPillarSlotRepository : IGenericRepositories<PillarSlot>
    {
        Task<int> LockSlotsAsync(string stationId, string subscriptionId, string bookingId);
        Task<int> UnlockSlotsByAppointmentIdAsync(string appointmentId);
        Task<List<PillarSlot>> GetUnavailableSlotsAtStationAsync(string stationId, int take);
        Task<PillarSlot> GetEmptySlot(int pillarslotId);


    }
}

