using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.Common.DTOs;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IStationService
    {
        Task<ServiceResult> GetStationList();
        Task<ServiceResult> GetStationActive();
        Task<IServiceResult> GetBatteryInventoryByStationId(StaffRequest staffRequest);
        //Nemo: Lấy các pin đang sạc và đầy
        Task<BatteryStatusResponse> GetNumberOfBatteryStatusAsync(string staffId);
        //Nemo: Lấy các battery trong station mà staff quản lý
        Task<List<BatResponse>> GetBatteryByStaffId(string staffId);

        //Nemo: Lấy các trạm active
        Task<StationOverviewResponse> GetStationOverviewAsync();
    }
}
