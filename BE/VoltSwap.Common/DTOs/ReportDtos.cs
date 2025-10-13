using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class UserReportRequest
    {
        public string StaffId { get; set; }
        public String DriverId { get; set; }
        public string ReportType { get; set; }
        public string ReportNote { get; set; }
        public DateTime CreateAt { get; set; }
    }

    public class  StaffAssignedRequest
    {
        public int ReportId { get; set; }
        public string StaffId { get; set; }
    }
}
