using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class PlanDTO
    {
        public Guid? Id { get; set; }
        public string PlanId { get; set; }
        public string? PlanName { get; set; }

        public int? DurationDays { get; set; }
        public int? NumberOfBattery { get; set; }

        public double? MileageBaseUsed { get; set; }
        public int? SwapLimit { get; set; }
        public double? Price { get; set; }
        public string? Status { get; set; }
    }
}
