using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.Services;

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
    }
}
