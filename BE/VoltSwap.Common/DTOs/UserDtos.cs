using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Models;

namespace VoltSwap.Common.DTOs
{
    public class UserRequest
    {
        public string UserId { get; set; }
    }

    public class  DriverDetailRespone
    {
        public string DriverId { get; set; }
        public string DriverEmail { get; set; }

        public string DriverTele { get; set; }
        public DateOnly Registation { get; set; }

        public List<PlanDetail> CurrentPackage { get; set; }
        public int TotalSwaps { get; set; }
        public List<VehicleListRespone> driverVehicles { get; set; }

    }


    public class DriverUpdate
    {
        public string DriverId { get; set; }


        [Required(ErrorMessage = "Driver name is required.")]
        [RegularExpression(
            @"^[\p{L} ]{5,42}$",
            ErrorMessage = "Driver name must be 5–42 characters and can only contain letters and spaces.")]
        public string DriverName { get; set; }

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        public string DriverEmail { get; set; }

        [Required(ErrorMessage = "Phone number is required.")]
        [RegularExpression(
    @"^(0|(\+84))?(3|5|7|8|9)\d{8}$",
    ErrorMessage = "Phone number must be a valid Vietnamese mobile number.")]
        public string DriverTele { get; set; }

        [Required(ErrorMessage = "Address is required.")]
        [RegularExpression(
      @"^[A-Za-z0-9À-ỹ\s,./-]{5,100}$",
      ErrorMessage = "Address must be 5–100 characters and can only contain letters, numbers, spaces and , . / - characters.")]
        public string DriverAddress { get; set; }
        public string DriverStatus { get; set; }
    }
    public class StaffRequest
    {
        public string StaffId { get; set; }
    }


    public class StaffUpdate
    {
        [Required(ErrorMessage = "StaffId is required.")]
        public string StaffId { get; set; }

        [Required(ErrorMessage = "Staff name is required.")]
        [RegularExpression(
            @"^[\p{L} ]{5,42}$",
            ErrorMessage = "Staff name must be 5–42 characters and can only contain letters and spaces.")]
        public string StaffName { get; set; }

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        public string StaffEmail { get; set; }

        [Required(ErrorMessage = "Phone number is required.")]
        [RegularExpression(
            @"^(0|(\+84))?(3|5|7|8|9)\d{8}$",
            ErrorMessage = "Phone number must be a valid Vietnamese mobile number.")]
        public string StaffTele { get; set; }

        [Required(ErrorMessage = "Address is required.")]
        [RegularExpression(
            @"^[A-Za-z0-9À-ỹ\s,./-]{5,100}$",
            ErrorMessage = "Address must be 5–100 characters and can only contain letters, numbers, spaces and , . / - characters.")]
        public string StaffAddress { get; set; }

        [Required(ErrorMessage = "Staff status is required.")]
        public string StaffStatus { get; set; }


        public StationStaffResponse StationStaff { get; set; }
    }

    public class StaffCreateRequest
    {
        [Required(ErrorMessage = "Staff name is required.")]
        [RegularExpression(
            @"^[\p{L} ]{5,42}$",
            ErrorMessage = "Staff name must be 5–42 characters and can only contain letters and spaces.")]
        public string StaffName { get; set; }

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        public string StaffEmail { get; set; }

        [Required(ErrorMessage = "Phone number is required.")]
        [RegularExpression(
            @"^(0|(\+84))?(3|5|7|8|9)\d{8}$",
            ErrorMessage = "Phone number must be a valid Vietnamese mobile number.")]
        public string StaffTele { get; set; }

        [Required(ErrorMessage = "Address is required.")]
        [RegularExpression(
            @"^[A-Za-z0-9À-ỹ\s,./-]{5,100}$",
            ErrorMessage = "Address must be 5–100 characters and can only contain letters, numbers, spaces and , . / - characters.")]
        public string StaffAddress { get; set; }

        [Required(ErrorMessage = "Staff status is required.")]
        public string StaffStatus { get; set; }
        public StationStaffResponse StationStaff { get; set; }
    }
    public class StationStaffResponse
    {
        public string StationId { get; set; }

        public TimeOnly ShiftStart { get; set; }
        public TimeOnly ShiftEnd { get; set; }
    }

    public class staffListRespone
    {
        public string StaffId { get; set; }
        public string StaffName { get; set; }
        public string StaffEmail { get; set; }
        public string StaffTele { get; set; }
        public string StaffAddress { get; set; }
        public string StaffStatus { get; set; }
        public string StationName { get; set; }
        public TimeOnly ShiftStart { get; set; }
        public TimeOnly ShiftEnd { get; set; }

    }
    public class DriverListResponse
    {
        public string DriverId { get; set; }
        public string DriverName { get; set; }
        public string DriverEmail { get; set; }
        public string DriverStatus { get; set; }
        public int NumberOfVehicle { get; set; }
        public List<string> CurrentPackage { get; set; }
        public int TotalSwaps { get; set; }
    }

    public class PlanDetail 
    {
        public string PlanName { get; set; }
        public int Swap { get; set; } = 0;
    }

    public class CreateStaffRequest
    {
        public string UserName { get; set; }

        public string UserPassword { get; set; }
        public string UserEmail { get; set; }
        public string UserTele { get; set; }
        public string UserRole { get; set; }
        public String UserAddress { get; set; }
        public String Supervisor { get; set; } = string.Empty;
    }
}
