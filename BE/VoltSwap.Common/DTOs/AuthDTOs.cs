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
}
