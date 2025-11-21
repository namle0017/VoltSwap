using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Models;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        public AuthController(AuthService authService)
        {
            _authService = authService;
        }
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register(VoltSwap.Common.DTOs.RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Invalid input", errors = ModelState });
            }

            var result = await _authService.RegisterAsync(request);
            if (result.Status == 201)
            {
                return StatusCode(201, new
                {
                    message = result.Message,
                    data = new { }  // Data không được null
                });
            }

            return StatusCode(result.Status, new
            {
                message = result.Message
            });
        }
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> LoginAsync(Common.DTOs.LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _authService.LoginAsync(request);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        //Hàm này để refresh token JWT
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest requestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Invalid input", errors = ModelState });
            }

            var result = await _authService.RefreshTokenAsync(requestDto.RefreshToken);
            if (result.Status == 200)
            {
                return StatusCode(200, new
                {
                    message = result.Message,
                    data = result.Data  // Giả sử Data chứa accessToken mới và refreshToken mới nếu cần
                });
            }

            return StatusCode(result.Status, new
            {
                message = result.Message
            });
        }

        [AllowAnonymous]
        [HttpPost("confirm-email")]
        public async Task<IActionResult> ConfirmEmailAsync(ConfirmEmailRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _authService.ConfirmEmailAsync(request);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }


        [AllowAnonymous]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPasswordAsync(ForgotPassword request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _authService.ForgotPassword(request);
            return StatusCode(result.Status, new { message = result.Message });
        }
        [AllowAnonymous]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePasswordAsync(ChangePassword request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _authService.ChangePassword(request);
            return StatusCode(result.Status, new { message = result.Message });
        }
    }
}
