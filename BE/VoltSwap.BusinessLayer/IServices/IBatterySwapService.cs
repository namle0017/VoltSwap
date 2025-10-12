using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Models;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IBatterySwapService
    {
        Task<ServiceResult> CheckSubId(AccessRequest requestDto);
        Task<List<PillarSlotDto>> GetPillarSlot(String stationId);
        Task<List<BatteryDto>> GetBatteryInUsingAvailable(string subId);

        Task<decimal> CalMilleageBase(List<BatterySession> batSession);
        Task<ServiceResult> SwapOutBattery(BatterySwapInListResponse requestDto);
        Task<ServiceResult> CheckBatteryAvailable(BatterySwapInListResponse requestBatteryList);

        }
}
