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

    public class  PlaceBattteryInPillarRequest
    {
        public string StaffId { get; set; }
        public int  PillarSlotId { get; set; }
        public string BatteryWareHouseId { get; set; }
    }
    public class TakeBattteryInPillarRequest
    {
        public string StaffId { get; set; }
        public int PillarSlotId { get; set; }
        public string BatteryId { get; set; }
    }
    public class  PlaceBattteryInPillarRespone
    {
        public string StaffId { get; set; }
        public string StationId { get; set; }
        public string PillarId { get; set; }
        public int  PillarSlotId { get; set; }
        public string BatteryWareHouseId { get; set; }

    }
    public class  TakeBattteryInPillarRespone
    {
        public string StaffId { get; set; }
        public string StationId { get; set; }
        public string PillarId { get; set; }
        public int  PillarSlotId { get; set; }
        public string BatteryId { get; set; }

    }

    public class StaffPillarSlotDto
    {
        public string PillarSlotId { get; set; }
        public int SlotId { get; set; }
        public int NumberOfSlotEmpty { get; set; }
        /// <summary>
        /// red: <=20%
        /// </summary>
        public int NumberOfSlotRed { get; set; }
        //green: >=90%
        public int NumberOfSlotGreen { get; set; }
        //yellow : 21<=x<=90
        public int NumberOfSlotYellow { get; set; }
    }
}
