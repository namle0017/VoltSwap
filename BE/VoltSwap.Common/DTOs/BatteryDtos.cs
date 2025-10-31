using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class BatResponse
    {
        public String BatteryId { get; set; }
        public String Status { get; set; }
        public decimal Soc { get; set; }
        public decimal Soh { get; set; }
        public decimal Capacity { get; set; }
        public String StationId { get; set; }
        public String StationName { get; set; }
    }
}
