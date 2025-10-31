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
        public double DistanceTravel { get; set; }
        public double ChargeTravel { get; set; }
    }

    public class StaffOverviewResponse
    {
        public BatteryStatusResponse NumberOfBat { get; set; }
        public int SwapInDat { get; set; }
        public List<StaffReportResponse> RepostList { get; set; }
    }


    public class AdminOverviewResponse
    {
        public int NumberOfDriver { get; set; }
        public MonthlyRevenueResponse MonthlyRevenue { get; set; }
        public BatterySwapInDayResponse NumberOfSwapDailyForAdmin { get; set; }
        public StationOverviewResponse StationOverview { get; set; }
        public PlanSummary PlanSummary { get; set; }
        public BatterySwapMonthlyResponse BatterySwapMonthly { get; set; }
    }
}
