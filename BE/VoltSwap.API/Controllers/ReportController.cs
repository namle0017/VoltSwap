using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.Services;

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

        [HttpGet("get-staff")]
        public async Task<IActionResult> GetStaffList()
        {
            var result = await _reportService.GetAllReport();
            return StatusCode(200, new { message = "Done", data = result });
        }
    }
}
