using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class AccessRequest
    {
        public string SubscriptionId { get; set; }
        public string StationId { get; set; }
    }

    public class BatteryDto
    {
        public string BatteryId { get; set; }
        public int SlotId { get; set; }
        //class này dùng để trả về cho fe pin và được fe trả về để biết slotNumber của pin mới là ở đâu
    }

    public class BatterySwapInListResponse
    {
        public List<BatteryDto> BatteryDtos { get; set; }
        public List<PillarSlotDto> PillarSlotDtos { get; set; }
        public AccessRequest accessRequest { get; set; }

        public string PillarId { get; set; }
    }
    public class BatterySwapListResponse
    {
        public List<BatteryDto> BatteryDtos { get; set; }
        public List<PillarSlotDto> PillarSlotDtos { get; set; }
        public AccessRequest accessRequest { get; set; }

        public string PillarId { get; set; }
        public List<int> SlotEmpty { get; set; }
    }

    //Nemo: cái class này thì sẽ để bên FE trả về các thông tin:
    // Swap in: Để biết pin truyền vào đã đúng chưa, thông qua batteryDtos,
    // SubId là để update cho battery Swap history, và session, subId, và battery
    //Đối với accessRequest thì sẽ là 
    public class BatterySwapListRequest
    {
        public List<BatteryDto> BatteryDtos { get; set; }
        public string SubscriptionId { get; set; }
        public AccessRequest AccessRequest { get; set; }
        public string PillarId { get; set; }
    }
    public class BatterySwapOutListRequest
    {
        public List<BatteryDto> BatteryDtos { get; set; }
        public string SubscriptionId { get; set; }
        public AccessRequest AccessRequest { get; set; }
        public string PillarId { get; set; }
    }

    public class BatteryRequest
    {
        public List<BatteryDto> BatteryDtos { get; set; }
        public string SubscriptionId { get; set; }
    }

    public class BatterySessionDtos
    {
        public string BatteryId { get; set; }
        public string EventType { get; set; }
        public decimal SocDelta { get; set; }
        public decimal EnergyDeltaWh { get; set; }
        public DateTime TimeStamp { get; set; }
    }

    public class BillAfterSwapOutResponse
    {
        public string SubId { get; set; }
        public DateOnly DateSwap { get; set; }
        public TimeOnly TimeSwap { get; set; }
    }


    //Đây sẽ là bắt đầu cho phần transfer pin giữa các trạm hay giả lập cho staff
    public class StaffBatteryRequest
    {
        public string StaffId { get; set; }
        public String? BatteryOutId { get; set; }
        public String? BatteryInId { get; set; }
        public string SubId { get; set; }
    }

    public class StaffNewBatteryInRequest
    {
        public int SlotId { get; set; }
        public string BatteryInId { get; set; }
        public String StataionId { get; set; }
        public String staffId { get; set; }
    }

    public class BillAfterStaffSwapOutResponse
    {
        public string BatterInId { get; set; }
        public int SlotId { get; set; }
        public DateTime CreateAt { get; set; }
    }
    public class GetBatteryInStationRequest
    {
        public string StationId { get; set; } = string.Empty;
    }

    public class ChangeBatteryRequest
    {
        public string NewSubscriptionId { get; set; }
        public string PreSubscriptionId { get; set; }
        public string BatteryId { get; set; }
    }

    public class BatterySwapMonthlyList
    {
        public int Month { get; set; }
        public int BatterySwapInMonth { get; set; }
    }

    //Nemo: Dto cho tính lượt đổi pin theo tháng
    public class BatterySwapMonthlyResponse
    {
        public List<BatterySwapMonthlyList> BatterySwapMonthlyLists { get; set; }
        public int AvgBatterySwap { get; set; }
    }


    public class SwapForFirstTimeRequest
    {
        public string SubId { get; set; }
    }

    //Nemo: DTO cho lấy tất cả swap thông qua batId
    public class GetBatterySwapList
    {
        public string BatteryId { get; set; }
        public DateOnly SwapDate { get; set; }
    }

    // Nemo: DTO cho request của GetSwapHistoryByBatId
    public class BatterySwapRequest
    {
        public string SubId { get; set; }
        public int MonthSwap { get; set; }
        public int YearSwap { get; set; }
    }

    //Nemo: Dto cho tính số lần swap trong ngày của admin
    public class BatterySwapInDayResponse
    {
        public int TotalSwap { get; set; }
        public double PercentSwap { get; set; }
    }

    //Nemo: Để trả về swapout
    public class BatterySwapOutResponse
    {
        public List<PillarSlotDto> PillarSlot { get; set; }
        public List<BatteryDto> BatTake { get; set; }
    }

    //Nemo: DTO request cho đổi pin giữa các trạm
    public class BatteryTranferRequest
    {
        public string StationFrom { get; set; }
        public string StationTo { get; set; }
        public List<string> BatId { get; set; }
        public String Reason { get; set; }
        public string CreateBy { get; set; }
    }
    public class LockedPillarSlotDto
    {
        public int SlotId { get; set; }
        public string StaitonId { get; set; }
        public string PillarId { get; set; }
        public string AppointmentId { get; set; }
        public int SlotNumber { get; set; }
    }
    public class StaffConfirmCancelRequest
    {
        public string AppointmentId { get; set; }
        public string StaffId { get; set; }
        public string SubcriptionId { get; set; }
    }
    public class SwapBatteryByStaffRequest
    {
        public string StaffId;
        public string SubcriptionId { get; set; }
        public AccessRequest AccessRequest { get; set; }
        public List<BatteryDto> BatteryReturnId { get; set; }
        public List<BatteryDto> BatteryOutId { get; set; }
    }

    public class BatterySwapListRespone
    {
        public string StaffId { get; set; }
        public string UserId { get; set; }

        public string UserName { get; set; }
        public string? BatteryIdIn { get; set; }
        public string? BatteryIdOut { get; set; }
        public string Status { get; set; }
        public TimeOnly Time { get; set; }
    }

    public class BatteryLockDto
    {
        public string PillarId { get; set; }
        public string BatteryId { get; set; }
        public int SlotId { get; set; }
    }
}
