using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Models;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IAuthService
    {
        Task<ServiceResult> LoginAsync(LoginRequest requestDto);
        Task<ServiceResult> RegisterAsync(RegisterRequest request);
        Task<ServiceResult> RefreshTokenAsync(string refreshToken);
        Task<bool> RevokeTokenAsync(String refreshToken);
    }
}
