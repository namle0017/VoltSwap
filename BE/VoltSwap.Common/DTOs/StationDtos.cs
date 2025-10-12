using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class StationListResponse
    {
        public String StationId {  get; set; }
        public String StationName { get; set; }
        public string StationAddress { get; set; }
        public int TotalBattery { get; set; }
        public double AvailablePercent { get; set; }
        public int BatteryAvailable { get; set; }

    }
}
