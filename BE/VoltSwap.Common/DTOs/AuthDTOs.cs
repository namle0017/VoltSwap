using System;
using System.Collections.Generic;
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
}
