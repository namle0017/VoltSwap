using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
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

        [Authorize(Roles = "Driver")]
        [HttpPost("Create-vehicle")]
        public async Task<IActionResult> CreateVehicle([FromBody] CreateDriverVehicleRequest request)
        {

            if (!ModelState.IsValid)
            {
                // ƯU TIÊN lỗi 'required' cho từng field nếu có nhiều lỗi
                foreach (var key in ModelState.Keys.ToList())
                {
                    var entry = ModelState[key];
                    if (entry?.Errors.Count > 1)
                    {
                        var requiredError = entry.Errors
                            .FirstOrDefault(e =>
                                e.ErrorMessage.Contains("required", StringComparison.OrdinalIgnoreCase));

                        if (requiredError != null)
                        {
                            // Giữ lại đúng 1 lỗi 'required'
                            entry.Errors.Clear();
                            entry.Errors.Add(requiredError);
                        }
                    }
                }

                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .Select(x => new
                    {
                        Field = x.Key,                                // field
                        Error = x.Value!.Errors.First().ErrorMessage // message đã được ưu tiên
                    })
                    .ToList();

                return BadRequest(new
                {
                    status = 400,
                    message = "Invalid data.",
                    errors
                });
            }


            var result = await _vehicleService.CreateDriverVehicleAsync(request);
            return StatusCode(result.Status, new
            {
                result.Message
              
            });
        }
        [Authorize(Roles = "Driver")]
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
        [Authorize(Roles = "Driver")]
        [HttpDelete("delete-vehicle")]
        public async Task<IActionResult> DeleteVehicle([FromQuery] CheckDriverVehicleRequest request)
        {
            var result = await _vehicleService.DeleteDriverVehicleAsync(request);
            return StatusCode(result.Status, new
            {
                result.Message

            });
        }
    }
}
