using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.Common.DTOs;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportController : ControllerBase
    {
        private readonly ReportService _reportService;
        public ReportController(ReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("get-report")]
        public async Task<IActionResult> GetStaffList()
        {
            var result = await _reportService.GetAllReport();
            if (result == null)
            {
                return StatusCode(404, new { message = "Not Found" });
            }
            return StatusCode(200, new { message = "Done", data = result });
        }

        [HttpGet("get-contact")]
        public async Task<IActionResult> GetContact(String driverId)
        {
            var results = await _reportService.GetDriverContact(driverId);
            return Ok(results);
        }

        

        [HttpPost("assign-staff")]
        public async Task<IActionResult> AssignStaff([FromBody] StaffAssignedRequest requestDto)
        {
            var result = await _reportService.AdminAsignStaff(requestDto);
            if (result.Status == 404)
            {
                return StatusCode(404, new { message = "Assign staff failed" });
            }
            return StatusCode(200, new { message = "Assign staff successfully" });
        }

        [HttpGet("get_staff-list")]
        public async Task<IActionResult> GetStaffListÁync()
        {
            var result = await _reportService.GetStaffList();
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }
    }
}
