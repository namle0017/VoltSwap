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
        private readonly StationService _stationService;
        public BatterySwapController(BatterySwapService batSwapService, StationService stationService)
        {
            _batSwapService = batSwapService;
            _stationService = stationService;
        }

        [HttpGet("validate-subscription")]
        public async Task<IActionResult> ValidateSubscriptionSlots([FromQuery] AccessRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _batSwapService.CheckSubId(request);
            return StatusCode(result.Status, new { message = result.Message , data = result.Data} );
        }

        [HttpPost("swap-in-battery")]
        public async Task<IActionResult> SwapInBattery([FromBody] BatterySwapListRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _batSwapService.CheckBatteryAvailable(request);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }


        [HttpPost("swap-out-battery")]
        public async Task<IActionResult> SwapOutBattery([FromBody] BatterySwapListRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _batSwapService.SwapOutBattery(request);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        [HttpGet("get-station-list")]
        public async Task<IActionResult> GetStationList()
        {
            var result = await _stationService.GetStationActive();
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        [HttpPost("get-battery-in-station")]
        public async Task<IActionResult> GetBatteryInStation([FromQuery] string stationId)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _stationService.GetBatteryInStation(stationId);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }
    }
}
