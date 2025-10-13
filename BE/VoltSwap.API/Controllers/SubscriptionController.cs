using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Models;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubscriptionController : ControllerBase
    {
        private readonly SubscriptionService _subService;
        public SubscriptionController(SubscriptionService subService)
        {
            _subService = subService;
        }


        [HttpGet("subscription-user-list")]
        public async Task<IActionResult> GetSubscriptionUserList([FromQuery] string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return BadRequest(new { message = "userId is required" });

            var result = await _subService.GetUserSubscriptionsAsync(new CheckSubRequest { UserId = userId });
            return StatusCode(result.Status, result);
        }


        [HttpPost("change")]
        public async Task<IActionResult> CanChange([FromBody] ChangePlanRequest req)
        {
            var result = await _subService.ChangePlanAsync(req.UserDriverId, req.SubscriptionId, req.NewPlanId);
            return StatusCode(result.Status, new { 
                result.Message, 
                result.Data
            });
        }


    }
}
