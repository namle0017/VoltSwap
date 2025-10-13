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
        Task<(int, int)> GetNumberOfStationActive();
        Task<List<PillarSlot>> GetBatteriesInPillarByStationIdAsync(String stationId);
        Task<List<PillarSlot>> GetBatteriesByStationAsync();
        Task<List<PillarSlot>> GetBatteriesAvailableByPillarIdAsync(string pillarId, int topNumber);
        Task<List<Battery>> GetBatteriesByStationIdAsync(String stationId);
        Task<List<BatterySwapStation>> GetStationActive();
    }
}
