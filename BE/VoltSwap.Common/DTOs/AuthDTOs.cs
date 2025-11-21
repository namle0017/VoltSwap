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
        public String Email { get; set; }
        public String Password { get; set; }
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
        public string UserName { get; set; }
        [Required]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!_*?-]).{8,}$",
        ErrorMessage = "Password phải gồm chữ hoa, chữ thường, số, ký tự đặc biệt và dài tối thiểu 8 ký tự.")]
        public string UserPassword { get; set; }
        public string UserEmail { get; set; }
        public string UserTele { get; set; }
        public string UserRole { get; set; }
        public String UserAddress { get; set; }
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
