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
    }
}
