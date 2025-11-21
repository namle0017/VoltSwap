using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class StaffReportRequest
    {
        public string StaffId { get; set; }
        public String? DriverId { get; set; }
        public int ReportTypeId { get; set; }

        [Required(ErrorMessage = "Content must not be empty.")]
        [StringLength(500, MinimumLength = 10,
    ErrorMessage = "Content must be between 10 and 500 characters.")]
        [RegularExpression(
    @"^[A-Za-z0-9À-ỹ\s.,!?()\ -]{10,500}$",
    ErrorMessage = "Content contains invalid characters.")]
        public string ReportNote { get; set; }
    }
    public class UserReportRequest
    {

        public String DriverId { get; set; }
        public int ReportTypeId { get; set; }

        [Required(ErrorMessage = "Content must not be empty.")]
        [StringLength(500, MinimumLength = 10,
    ErrorMessage = "Content must be between 10 and 500 characters.")]
        [RegularExpression(
    @"^[A-Za-z0-9À-ỹ\s.,!?()\ -]{10,500}$",
    ErrorMessage = "Content contains invalid characters.")]
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
        public int reportId { get; set; }
        public string StaffId { get; set; }
        public String DriverId { get; set; }
        public String DriverName { get; set; }
        public int ReportType { get; set; }
        public string ReportTypeName { get; set; }
        public string ReportNote { get; set; }
        public DateTime CreateAt { get; set; }
        public string ReportStatus { get; set; }
    }

    public class ReportTypeDto
    {
        public int ReportTypeId { get; set; }
        public string ReportType { get; set; }
    }

    //nemo: Mark resolve cho Admin vaf staff
    public class MarkResolveDto
    {
        public int ReportId { get; set; }
        public string ReportStatus { get; set; }
    }

    //bin
    public class QuestionRequest
    {
        [Required(ErrorMessage = "Content must not be empty.")]
        [StringLength(500, MinimumLength = 10,
    ErrorMessage = "Content must be between 10 and 500 characters.")]
        [RegularExpression(
    @"^[A-Za-z0-9À-ỹ\s.,!?()\ -]{10,500}$",
    ErrorMessage = "Content contains invalid characters.")]
        public string Description { get; set; }
    }

}
