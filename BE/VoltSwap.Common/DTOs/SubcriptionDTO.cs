using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class SubscriptionDTO
    {
        public string SubscriptionId { get; set; } = default!;
        public string PlanId { get; set; } = default!;
        public string UserDriverId { get; set; } = default!;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? CurrentMileage { get; set; }
        public int? RemainingSwap { get; set; }
        public string? Status { get; set; }
        public DateTime CreateAt { get; set; }
    }
}
