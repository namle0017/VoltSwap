using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
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

    //Nemo: Conver lat and lng
    public class LatAndLngDto
    {
        public decimal LocationLat { get; set; }
        public decimal LocationLng { get; set; }
        public string FormattedAddress { get; set; }
    }

    public class StationRequest
    {

        [Required(ErrorMessage = "Station name is required.")]
        [RegularExpression(
       @"^(?!STATION)(?!Trạm)(?!STA)[A-Za-z0-9 \-]+$",
       ErrorMessage = "Station name cannot start with 'STATION', 'Trạm' or 'STA' and can only contain letters, digits, spaces and hyphens (-).")]
        public string StationName { get; set; }

        [Required(ErrorMessage = "Address is required.")]
        [RegularExpression(
       @"^[A-Za-z0-9À-ỹ\s,./-]{5,100}$",
       ErrorMessage = "Address must be 5–100 characters and can only contain letters, numbers, spaces and , . / - characters.")]
        public string Address { get; set; }

        [Required(ErrorMessage = "Number of pillars is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Number of pillars must be a positive integer.")]
        public int NumberOfPillar { get; set; }

        [Required(ErrorMessage = "Open Time is required.")]
        public TimeOnly OpenTime { get; set; }

        [Required(ErrorMessage = "Close Time is required.")]
        public TimeOnly CloseTime { get; set; }

        [Required(ErrorMessage = "Number of pillars is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Number of pillars must be a positive integer.")]
        public int PillarCapicity { get; set; }
    }
}
