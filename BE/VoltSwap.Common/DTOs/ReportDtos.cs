using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class StaffReportRequest
    {
        public string StaffId { get; set; }
        public String DriverId { get; set; }
        public int ReportTypeId { get; set; }
        public string ReportNote { get; set; }
        public DateTime CreateAt { get; set; }
    }
    public class UserReportRequest
    {
     
        public String DriverId { get; set; }
        public int ReportTypeId { get; set; }
        public string ReportNote { get; set; }
    }
    public class UserReportRespone
    {


        public int ReportId { get; set; }
        public string UserAdminId { get; set; }

    public string UserStaffId { get; set; }

    public string UserDriverId { get; set; }

    public int ReportTypeId { get; set; }
    public string ReportTypeName { get; set; }

    public string Note { get; set; }

    public string Status { get; set; }

    public DateTime CreateAt { get; set; }

    public DateTime? ProcessesAt { get; set; }
    }

    public class StaffAssignedRequest
    {
        public int ReportId { get; set; }
        public string StaffId { get; set; }
    }

    //Nemo: Để đưa lên những report cho staff
    public class StaffReportResponse
    {
        public string StaffId { get; set; }
        public String DriverId { get; set; }
        public String DriverName { get; set; }
        public int  ReportType { get; set; }
        public string  ReportTypeName { get; set; }
        public string ReportNote { get; set; }
        public DateTime CreateAt { get; set; }
        public string ReportStatus { get; set; }
    }

    public class ReportTypeDto
    {
        public int ReportTypeId { get; set; }
        public string ReportType { get; set; }
    }
}
