using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class StationListResponse
    {
        public String StationId { get; set; }
        public String StationName { get; set; }
        public string StationAddress { get; set; }
        public decimal LocationLat { get; set; }
        public decimal LocationLon { get; set; }
        public int TotalBattery { get; set; }
        public double AvailablePercent { get; set; }
        public int BatteryAvailable { get; set; }
    }

    public class StationActiveReponse
    {
        public string StationId { get; set; }
        public string StationName { get; set; }
    }
    public class StationActiveListReponse
    {
        public string StationId { get; set; }
        public string StationName { get; set; }
        public List<BatResponse> BatteryList { get; set; }
    }

    public class ListStationForTransferResponse
    {
        public List<StationActiveListReponse> ActiveStationsLeft { get; set; }
        public List<StationActiveListReponse> ActiveStationsRight { get; set; }
    }

    public class StationResponse
    {
        public string ReportId { get; set; }
        public string StationId { get; set; }
    }

    public class StaffListResponse
    {
        public string StaffId { get; set; }
        public string StaffName { get; set; }
        public string StationName { get; set; }
        public String StationId { get; set; }
        public string PhoneNumber { get; set; }
    }


    public class StationSubResponse
    {
        public string StationId { get; set; }
        public string StationName { get; set; }
        public string StationAddress { get; set; }
    }

    public class BatteryStatusResponse
    {
        public int NumberOfBatteryFully { get; set; }
        public int NumberOfBatteryCharging { get; set; }
        public int NumberOfBatteryMaintenance { get; set; }
        public int NumberOfBatteryInWarehouse { get; set; }
    }

    //Nemo: Dto cho tính số lượng trạm active và tổng số trạm
    public class StationOverviewResponse
    {
        public int ActiveStation { get; set; }
        public int TotalStation { get; set; }
    }
}
