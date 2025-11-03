using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;

namespace VoltSwap.DAL.IRepositories
{
    public interface IBatterySwapRepository : IGenericRepositories<BatterySwap>
    {
        Task<List<BatterySwap>> GetBatteryInUsingAsync(String subId);
        Task<PillarSlot> GetPillarSlot(int batSlotId);
        Task<List<BatterySwap>> GetBatteriesBySubscriptionId(string subId);
        Task<Battery> GetBatteryInventoryInStaiion(string stationId, string batteryId);
        Task<List<BatterySwap>> GetListBatterySwap(string stationId);
    }
}
