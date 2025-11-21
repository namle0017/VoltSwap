using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Models;

namespace VoltSwap.Common.DTOs
{
    public class CheckSubRequest
    {
        public String DriverId { get; set; }
    }

    public class SubRequest
    {
        public String DriverId { get; set; }
        public string SubId { get; set; }
    }

    public class ReponseSub
    {
        public String SubscriptionId { get; set; }
        public string PreviousSubcriptionId { get; set; }
        public String PlanName { get; set; }
        public String Status { get; set; }
        public double SubFee { get; set; }
        public DateTime EndDate { get; set; }
        public int RemainingSwap { get; set; }
        public double CurrentMilleage { get; set; }
        public int TotalSwap { get; set; }
    }
    public class ServiceOverviewItemDto
    {
        public string PlanName { get; set; }
        public string SubId { get; set; }
        public string PlanStatus { get; set; }
        public int? SwapLimit { get; set; }
        public int? Remaining_swap { get; set; }
        public decimal? Current_miligate { get; set; }
        public double SubFee { get; set; }
        public DateOnly EndDate { get; set; }
        public List<BatteryDto> BatteryDtos { get; set; }
    }

    public class CurrentSubscriptionResquest
    {
        public string DriverId { get; set; }
        public string CurrentSubscription { get; set; }
    }

    public class SubscriptionListReponse
    {

    }

    public class GetBatteryUserRequest
    {
        public string StaffId { get; set; }

        [Required(ErrorMessage = "Subscription id is required.")]
        [RegularExpression(
       @"^SUB-\d{8}$",
       ErrorMessage = "SubId must follow the format: SUB-12345678.")]
        public string SubscriptionId { get; set; }
    }

    //Nemo: DTO cho register gói mới
    public class RegisterNewPlanRequest
    {
        public UserRequest DriverId { get; set; }
        public string PlanId { get; set; }
    }

    public class RequestNewPlanDto
    {
        public string TransactionId { get; set; }
    }
}
