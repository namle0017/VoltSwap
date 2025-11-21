using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{

    public class LoginRequest
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        [RegularExpression(
           @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!_*?-]).{8,}$",
           ErrorMessage = "Password must be at least 8 characters and include uppercase, lowercase, number and special character.")]
        public string Password { get; set; }
    }
    public class LoginResponse
    {
        public string Token { get; set; }
        public string RefreshToken { get; set; }
        public DateTime ExpiresAt { get; set; }
        public UserInfo User { get; set; }
    }

    public class UserInfo
    {
        public String UserId { get; set; }
        public string UserEmail { get; set; }
        public string UserName { get; set; }
        public string UserTele { get; set; }
        public string UserRole { get; set; }
    }

    public class RegisterRequest
    {
        [Required(ErrorMessage = "User name is required.")]
        [RegularExpression(
       @"^[\p{L} ]{5,42}$",
       ErrorMessage = "User name must be 5–42 characters and can only contain letters and spaces.")]
        public string UserName { get; set; }


        [Required(ErrorMessage = "Password is required.")]
        [RegularExpression(
       @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!_*?-]).{8,}$",
       ErrorMessage = "Password must be at least 8 characters and include uppercase, lowercase, number and special character.")]
        public string UserPassword { get; set; }

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        public string UserEmail { get; set; }

        [Required(ErrorMessage = "Phone number is required.")]
        [RegularExpression(
    @"^(0|(\+84))?(3|5|7|8|9)\d{8}$",
    ErrorMessage = "Phone number must be a valid Vietnamese mobile number.")]
        public string UserTele { get; set; }
        public string UserRole { get; set; }


        [Required(ErrorMessage = "Address is required.")]
        [RegularExpression(
               @"^[A-Za-z0-9À-ỹ\s,./-]{5,100}$",
               ErrorMessage = "Address must be 5–100 characters and can only contain letters, numbers, spaces and , . / - characters.")]
        public string UserAddress { get; set; }
        public String Supervisor { get; set; } = string.Empty;
    }

    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; }
    }

    public class ConfirmEmailRequest
    {
        [Required]
        [RegularExpression(@"(?:[a-z0-9!#$%&'*+/=?^_{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_{|}~-]+)*|""(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*"")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)])",
        ErrorMessage = "Please fill in the correct email format")]
        public string DriverEmail { get; set; }
    }

    public class ChangePassword
    {
        [Required]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!_*?-]).{8,}$",
        ErrorMessage = "Password must contain at least 8 characters, 1 special character and 1 number")]
        public string OldPass { get; set; }
        [Required]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!_*?-]).{8,}$",
        ErrorMessage = "Password must contain at least 8 characters, 1 special character and 1 number")]
        public string NewPass { get; set; }

        public string UserId { get; set; }
    }

    public class ForgotPassword
    {
        [Required]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!_*?-]).{8,}$",
        ErrorMessage = "Password must contain at least 8 characters, 1 special character and 1 number")]
        public string UserPass { get; set; }

        public string UserId { get; set; }
    }
}
