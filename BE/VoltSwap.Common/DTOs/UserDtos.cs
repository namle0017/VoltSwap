using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class UserRequest
    {
        public string UserId { get; set; }
    }


    public class DriverUpdate
    {
        public string DriverId { get; set; }
        public string DriverName { get; set; }
        public string DriverEmail { get; set; }
        public string DriverTele { get; set; }
        public string DriverAddress { get; set; }
        public string DriverStatus { get; set; }
    }


    public class StaffUpdate
    {
        public string StaffId { get; set; }
        public string StaffName { get; set; }
        public string StaffEmail { get; set; }
        public string StaffTele { get; set; }
        public string StaffAddress { get; set; }
        public string StaffStatus { get; set; }
        public StationStaffResponse StationStaff { get; set; }
    }

    public class StationStaffResponse
    {
        public string StationId { get; set; }
        public string StationName { get; set; }
        public TimeOnly ShiftStart { get; set; }
        public TimeOnly ShiftEnd { get; set; }
    }
}
