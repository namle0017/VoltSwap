using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class PillarSlotDto
    {
        public int SlotId { get; set; }
        public String? BatteryId { get; set; }
        public int SlotNumber { get; set; }
        public String StationId { get; set; }
        public string PillarId { get; set; }
        public String PillarStatus { get; set; }
        public String BatteryStatus { get; set; }
        public decimal BatterySoc { get; set; }
        public decimal BatterySoh { get; set; }
    }
}
