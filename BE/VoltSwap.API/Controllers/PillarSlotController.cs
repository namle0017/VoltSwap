using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.Common.DTOs;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PillarSlotController : ControllerBase
    {
        private readonly PillarSlotService _slotService;
        public PillarSlotController(PillarSlotService slotService)
        {
            _slotService = slotService;
        }

        //Nemo: api để cho ra các trụ trong trạm mà staff quản lý
        [HttpGet("staff-pillar-slot")]
        public async Task<IActionResult> GetStaffPillarSlot([FromQuery] UserRequest requestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _slotService.GetPillarSlotByStaffId(requestDto);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }


        //Nemo: api để cho ra các pin mà trụ đó giữ
        [HttpGet("battery-in-pillar")]
        public async Task<IActionResult> GetBatteryInPillar([FromQuery] string pillarId)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _slotService.GetBatteryInPillar(pillarId);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        //Bin: api để cho pin trong kho vào các slot trống trong trụ
        [HttpPost("store-battery-inventory-to-pillar-slot")]
        public async Task<IActionResult> StoreBatteryInventoryToPillarSlot([FromBody] PlaceBattteryInPillarRequest requestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _slotService.PlaceBatteryInPillarAsync(requestDto);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        //Bin: api để lấy pin từ các slot LOCK trong trụ
        [HttpGet("Lock-slot")]
        public async Task<IActionResult> GetBatteryInLockSlot([FromQuery] UserRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _slotService.GetLockedPillarSlotByStaffId(request);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        //Bin: api để lấy pin từ các slot USE trong trụ
        [HttpPost("take-out-slot")]
        public async Task<IActionResult> TakeOutBatteryFromPillarSlot([FromBody] TakeBattteryInPillarRequest requestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _slotService.TakeOutBatteryInPillar(requestDto);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }
    }
}
