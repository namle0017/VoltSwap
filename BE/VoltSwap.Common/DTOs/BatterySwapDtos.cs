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
        public int? SlotId { get; set; }
        //class này dùng để trả về cho fe pin và được fe trả về để biết slotNumber của pin mới là ở đâu
    }

    public class BatterySwapList
    {
        public List<BatteryDto> BatteryDtos { get; set; }
        public List<PillarSlotDto> PillarSlotDtos { get; set; }
        public string SubscriptionId { get; set; }
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
}
