using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class PlanDtos
    {
        public string PlanId { get; set; }
        public string PlanName { get; set; }
        public int? NumberBattery { get; set; }
        public int? DurationDays { get; set; }
        public decimal? MilleageBaseUsed { get; set; }
        public int? SwapLimit { get; set; }
        public decimal? Price { get; set; }
    }
    public class PlanRespone
    {
        public string PlanId { get; set; }
        public string PlanName { get; set; }
        public int? NumberBattery { get; set; }
        public int? DurationDays { get; set; }
        public decimal? MilleageBaseUsed { get; set; }
        public int? SwapLimit { get; set; }
        public decimal? Price { get; set; }
        public DateOnly CreatedAt { get; set; }
    }
    public class PlanSuggestRequest
    {
        public string PlanName { get; set; }
    }
    public class PlanSuggestRespone
    {
        public string PlanId { get; set; }
        public string PlanName { get; set; }
        public int? NumberBattery { get; set; }
        public int? DurationDays { get; set; }
        public decimal? MilleageBaseUsed { get; set; }
        public int? SwapLimit { get; set; }
        public decimal? Price { get; set; }
        public bool isSuggest { get; set; }
    }

    public class PlanDetailResponse
    {
        public PlanDtos Plans { get; set; }

        public List<PlanFeeResponse> PlanFees { get; set; }
    }

    public class PlanWithDetailResponse
    {
        public PlanRespone Plans { get; set; }
        public int TotalUsers { get; set; }

    }


    public class PlanFeeResponse
    {
        public string TypeOfFee { get; set; }
        public decimal? AmountFee { get; set; }
        public string Unit { get; set; }
        public decimal MinValue { get; set; }
        public decimal MaxValue { get; set; }
        public String CalculationMethod { get; set; }
        public string Description { get; set; }
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
        public string TransactionId { get; set; }
        public string SubscriptionId { get; set; }
        public string PreviousSubcriptionId { get; set; }
        public string PlanId { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public string Status { get; set; }
    }
    public class RegisterPlanRequest
    {
        public string UserDriverId { get; set; }
        public string PlanId { get; set; }

    }
    public class RegisterPlanResponse
    {
        public string SubscriptionId { get; set; }
        public string PlanId { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public string Status { get; set; }
    }

    public class PlanListResponse
    {
        public string PlanName { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalUsers { get; set; }
    }

    public class PlanSummary
    {
        public List<PlanListResponse> PlanMonthSummary { get; set; }
        public ReportSummaryResponse ReportSummary { get; set; }
    }
    public class ReportSummaryResponse
    {
        public decimal TotalMonthlyRevenue { get; set; }
        public int SwapTimes { get; set; }
        public int ActiveCustomer { get; set; }
    }

    public class FindPlanBySubId
    {
        public string PlanId { get; set; }
        public string PlanName { get; set; }
    }


    //Nemo: DTO để lấy fee vượt
    public class GetPlanFeeResponse
    {
        public string PlanId { get; set; }
        public int PlanFeeId { get; set; }
        public decimal MinValue { get; set; }
        public decimal MaxValue { get; set; }
        public decimal Amount { get; set; }
        public string TypeOfFee { get; set; }
    }


    public class MilleageBaseMonthly
    {
        public DateTime Year { get; set; }
        public DateTime Month { get; set; }
        public decimal? MilleageBase { get; set; }
    }



    public class PlanGroupFeeDetail
    {
        public PlanRespone Plans { get; set; }
        public int TotalUsers { get; set; }

    }
    public class PlanGroupDetail
    {
        public string GroupKey { get; set; } = "";
        public FeeSummary FeeSummary { get; set; } = new();
    }

    public class FeeSummary
    {
        public List<ExcessMileageTier> ExcessMileage { get; set; } = new();
        public SimpleFee? BatteryDeposit { get; set; }
        public SimpleFee? Booking { get; set; }
        public SimpleFee? BatterySwap { get; set; } // chỉ có khi GroupKey == "TP"
    }

    public class ExcessMileageTier
    {
        public decimal? MinValue { get; set; }
        public decimal? MaxValue { get; set; }
        public decimal Amount { get; set; }
        public string Unit { get; set; }
    }

    public class SimpleFee
    {
        public decimal Amount { get; set; }
        public string Unit { get; set; }
        public string TypeOfFee { get; set; }
    }

}
