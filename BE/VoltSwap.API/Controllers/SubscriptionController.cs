using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.Common.DTOs;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubscriptionController : ControllerBase
    {
        private readonly SubscriptionService _subService;
        private readonly OverviewService _overviewService;
        public SubscriptionController(SubscriptionService subService, OverviewService overviewService)
        {
            _subService = subService;
            _overviewService = overviewService;
        }

        [Authorize(Roles = "Driver")]
        [HttpGet("subscription-user-list")]
        public async Task<IActionResult> GetSubscriptionUserList([FromQuery] CheckSubRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.DriverId))
                return BadRequest(new { message = "userId is required" });

            var result = await _overviewService.GetUserSubscriptionsAsync(req);
            return StatusCode(result.Status, result);
        }
        //[HttpPost("create")]
        //public async Task<IActionResult> CreatePlan([FromBody] RegisterPlanRequest req)
        //{
        //    var result = await _subService.RegisterSubcriptionAsync(req.UserDriverId, req.PlanId);
        //    return StatusCode(result.Status, new 
        //    { 
        //        result.Message,
        //        result.Data
        //    });
        //}
        [AllowAnonymous]
        [HttpPost("renew")]
        public async Task<IActionResult> RenewPlan([FromBody] SubRequest req)
        {
            var result = await _subService.RenewSubcriptionAsync(req.DriverId, req.SubId);
            return StatusCode(result.Status, new
            {
                result.Message,
                result.Data
            });
        }
        [AllowAnonymous]
        [HttpPost("change")]
        public async Task<IActionResult> CanChange([FromBody] ChangePlanRequest req)
        {
            var result = await _subService.ChangeSubcriptionAsync(req.UserDriverId, req.SubscriptionId, req.NewPlanId);
            return StatusCode(result.Status, new
            {
                result.Message,
                result.Data
            });
        }

        //Bin: lấy sub của driver
        [Authorize(Roles = "Staff")]
        [HttpGet("staff-get-battery")]
        public async Task<IActionResult> GetBatteryUser([FromQuery] GetBatteryUserRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _subService.GetBatteryBySubcription(request);
            return StatusCode(result.Status, new
            {
                message = result.Message,
                data = result.Data
            });
        }

    }
}
