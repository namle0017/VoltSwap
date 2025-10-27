using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;

namespace VoltSwap.DAL.IRepositories
{
    public interface IStationRepository : IGenericRepositories<BatterySwapStation>
    {
        Task<List<PillarSlot>> GetBatteriesInPillarByStationIdAsync(String stationId);
        Task<List<PillarSlot>> GetBatteriesByStationAsync();
        Task<List<PillarSlot>> GetBatteriesAvailableByPillarIdAsync(string pillarId, int topNumber);
        Task<List<Battery>> GetBatteriesByStationIdAsync(String stationId);
        Task<List<BatterySwapStation>> GetStationActive();
        Task<PillarSlot> GetPillarSlotAsync(int slotId);
        Task<BatterySwapStation> GetStationByPillarId(String pillarId);
        Task<BatterySwapStation> GetStationByIdAsync(String stationId);

        Task<bool> CheckSubscriptionHasBookingAsync(string subscriptionId);
        Task<List<PillarSlot>> GetBatteriesLockByPillarIdAsync(string pillarId, string bookingId);
    }
}
