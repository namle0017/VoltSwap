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

    public class ChangePlanCheckRequest
    {
        public string SubscriptionId { get; set; }
    }
    public class ChangePlanCheckResponse
    {
        public DateOnly EndDate { get; set; }
    }
    public class ChangePlanRequest
    {
        public string UserDriverId { get; set; }
        public string SubscriptionId { get; set; }
        public string NewPlanId { get; set; }
    }

    public class ChangePlanResponse
    {
        public string SubscriptionId { get; set; }
        public string PlanId { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public string Status { get; set; }
    }
}
