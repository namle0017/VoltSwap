using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class PlanDtos
    {
        public string PlanId {  get; set; }
        public string PlanName { get; set; }
        public int NumberBattery { get; set; }
        public int DurationDays { get; set; }
        public decimal MilleageBaseUsed { get; set; }
        public int SwapLimit { get; set; }
        public decimal? Price { get; set; }
    }
}
