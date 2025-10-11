using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class OverViewDtos
    {
        public String SubId { get; set; }
        public String SubName { get; set; }
        public String SubStatus { get; set; }
        public DateTime ExpiredDate { get; set; }
        public double PlanPrice { get; set; }
        public int SwapInMonth { get; set; }
        public double DistanceTravel {  get; set; }
        public double ChargeTravel { get; set; }
    }
}
