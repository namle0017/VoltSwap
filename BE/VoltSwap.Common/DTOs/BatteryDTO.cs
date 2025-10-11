using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class BatteryDTO
    {
        public string? BatteryId { get; set; } 
        public string? BatterySwapStationId { get; set; } 
        public double Capacity { get; set; }
        public double Soc { get; set; }
        public double Soh { get; set; }
        public string? Status { get; set; } 
    }
}
