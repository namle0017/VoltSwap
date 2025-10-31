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
        Task<ServiceResult> SwapOutBattery(BatterySwapOutListRequest requestDto);
        Task<ServiceResult> CheckBatteryAvailable(BatterySwapListRequest requestBatteryList);
        Task<List<MilleageBaseMonthly>> CalMilleageBase(List<BatterySession> batSession);
        Task<BatterySwapMonthlyResponse> GetBatterySwapMonthly();

        //Nemo: Count số lần swap trong ngày cho staff
        Task<int> CalNumberOfSwapDailyForStaff(string staffId);
        //Nemo: Count số lần swap trong ngày cho admin

        Task<BatterySwapInDayResponse> CalNumberOfSwapDailyForAdmin();
        Task<int> UpdatebatSwapOutAsync(string batId, string stationId, string subId);


        //Nemo: Chuyển đổi pin trong warehouse giữa các trạm
        Task<ServiceResult> TranferBatBetweenStation(BatteryTranferRequest requestDto);
        Task<List<BatterySession>> GenerateBatterySession(string subId);
    }
}
