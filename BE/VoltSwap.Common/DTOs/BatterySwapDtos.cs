using System;
using System.Collections.Generic;
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
    public class BatterySwapListRequest
    {
        public List<BatteryDto> BatteryDtos { get; set; }
        public string SubscriptionId { get; set; }
        public AccessRequest accessRequest { get; set; }
        public string pillarId { get; set; }
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
        public String StationId { get; set; }
        public string StaffId { get; set; }
        public String? BatteryOutId { get; set; }
        public String? BatteryInId { get; set; }
        public  string SubId { get; set; }

    }
}
