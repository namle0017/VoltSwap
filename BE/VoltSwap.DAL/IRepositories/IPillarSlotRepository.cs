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
        Task<List<PillarSlot>> GetLockedSlotsByStationAsync(string stationId);
        Task<List<PillarSlot>> GetAvailableSlotsByPillarAsync(string pillarId);

        Task<List<PillarSlot>> UnlockSlotsByAppointmentIdAsync(string appointmentId);
        Task<List<PillarSlot>> GetUnavailableSlotsAtStationAsync(string stationId, int take);
        Task<PillarSlot> GetEmptySlot(int pillarslotId);
        Task<PillarSlot> GetSlotsByPillarSlotIdAsync(int pillarSlotId);
        Task<PillarSlot> GetSlotWithBattery(int PilarSlotId, string batteryId);


    }
}

