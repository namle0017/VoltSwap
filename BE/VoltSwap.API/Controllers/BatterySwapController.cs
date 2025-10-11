using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.Common.DTOs;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BatterySwapController : ControllerBase
    {
        private readonly BatterySwapService _batSwapService;
        public BatterySwapController(BatterySwapService batSwapService)
        {
            _batSwapService = batSwapService;
        }

        [HttpGet("validate-subscription-slots")]
        public async Task<IActionResult> ValidateSubscriptionSlots(AccessRequest request)
        {
            var result = await _batSwapService.CheckSubId(request);
            return Ok(result.Data);
        }

    }
}
