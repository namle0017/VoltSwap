using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.Common.DTOs;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VehicleController : ControllerBase
    {
        private readonly VehicleService _vehicleService;
        public VehicleController(VehicleService vehicleService)
        {
            _vehicleService = vehicleService;
        }
        [HttpPut("assign-vehicle")]
        public async Task<IActionResult> AssignVehicle([FromBody] CheckDriverVehicleRequest request)
        {
            var result = await _vehicleService.AssignVehicleToUserAsync(request.VIN, request.UserDriverId);
            return StatusCode(result.Status, new
            {
                result.Message
              
            });
        }

        [HttpGet("vehicle-list")]
        public async Task<IActionResult> GetVehicleUserList([FromQuery] CheckDriverRequest request)
        {
            var result = await _vehicleService.GetUserVehiclesAsync(new CheckDriverRequest { UserDriverId = request.UserDriverId });
            return StatusCode(result.Status, new
            {
                result.Message,
                result.Data
            });
        }

        [HttpDelete("delete-vehicle")]
        public async Task<IActionResult> DeleteVehicle([FromQuery] CheckDriverVehicleRequest request)
        {
            var result = await _vehicleService.DeleteDriverVehicleAsync(new CheckDriverVehicleRequest
            {
                UserDriverId = request.UserDriverId,
                VIN = request.VIN
            });
            return StatusCode(result.Status, new
            {
                result.Message

            });
        }
    }
}
