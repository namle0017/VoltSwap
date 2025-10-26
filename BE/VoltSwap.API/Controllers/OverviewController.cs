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
    public class OverviewController : ControllerBase
    {
        private readonly OverviewService _overviewService;
        public OverviewController(OverviewService overviewService)
        {
            _overviewService = overviewService;
        }

        [HttpGet("staff-overview")]
        public async Task<IActionResult> StaffOverview([FromQuery] UserRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _overviewService.StaffOverviewAsync(request);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        //Nemo: Admin-overview
        [HttpGet("admin-overview")]
        public async Task<IActionResult> AdminOverview()
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _overviewService.AdminOverviewAsync();
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }
    }
}
