using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.Common.DTOs;

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
        public async Task<IActionResult> GetSubscriptionUserList([FromQuery] CheckSubRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.DriverId))
                return BadRequest(new { message = "userId is required" });

            var result = await _subService.GetUserSubscriptionsAsync(new CheckSubRequest { DriverId = req.DriverId  });
            return StatusCode(result.Status, result);
        }

        [HttpPost("renew")]
        public async Task<IActionResult> RenewPlan([FromBody] RegisterPlanRequest req)
        {
            var result = await _subService.RenewPlanAsync(req.UserDriverId, req.SubscriptionId);
            return StatusCode(result.Status, new 
            { 
                result.Message,
                result.Data
            });
        }

        [HttpPost("change")]
        public async Task<IActionResult> CanChange([FromBody] ChangePlanRequest req)
        {
            var result = await _subService.ChangePlanAsync(req.UserDriverId, req.SubscriptionId, req.NewPlanId);
            return StatusCode(result.Status, new
            {
                result.Message,
                result.Data
            });
        }

    }
}
