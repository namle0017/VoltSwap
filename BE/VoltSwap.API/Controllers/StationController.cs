using Azure.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.Common.DTOs;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StationController : ControllerBase
    {
        private readonly StationService _stationService;
        public StationController(StationService stationService)
        {
            _stationService = stationService;
        }

        [HttpGet("station-list")]
        public async Task<IActionResult> StationList()
        {
            var getStationList = await _stationService.GetStationList();
            return StatusCode(getStationList.Status, new
            {
                getStationList.Message,
                getStationList.Data,
            }); ;
        }

        [HttpGet("station-active")]
        public async Task<IActionResult> GetActiveStation()
        {
            var result = await _stationService.GetActiveStation();
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }


    }
}
