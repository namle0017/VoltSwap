using Microsoft.AspNetCore.Authorization;
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
    public class ReportController : ControllerBase
    {
        private readonly ReportService _reportService;
        public ReportController(ReportService reportService)
        {
            _reportService = reportService;
        }

        [Authorize(Roles = "Admin")]
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

        [Authorize(Roles = "Admin")]
        [HttpGet("get-contact")]
        public async Task<IActionResult> GetContact(String driverId)
        {
            var results = await _reportService.GetDriverContact(driverId);
            return StatusCode(200, new { message = results.Message, data = results.Data });
        }


        [Authorize(Roles = "Admin")]
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

        [Authorize(Roles = "Admin")]
        [HttpGet("get_staff-list")]
        public async Task<IActionResult> GetStaffListAsync()
        {
            var result = await _reportService.GetStaffList();
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        [Authorize(Roles = "Staff")]
        [HttpGet("customer-reports")]
        public async Task<IActionResult> CustomerReportList([FromQuery] UserRequest request)
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

            var result = await _reportService.GetCustomerReportForStaff(request);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        [Authorize(Roles = "Driver")]
        [HttpPost("Driver-create-report")]
        public async Task<IActionResult> CreateReport([FromBody] UserReportRequest request)
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

            var result = await _reportService.DriverCreateReport(request);
            return StatusCode(result.Status, new
            {
                message = result.Message,
                data = result.Data
            });
        }

        [Authorize(Roles = "Staff")]
        [HttpPost("staff-create-report")]
        public async Task<IActionResult> CreateReport([FromBody] StaffReportRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _reportService.StaffCreateReport(request);
            return StatusCode(result.Status, new
            {
                message = result.Message,
                data = result.Data
            });

        }

        [Authorize(Roles = "Driver,Admin")]
        [HttpGet("get-driver-report-list")]
        public async Task<IActionResult> GetReportType()
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _reportService.ReportTypeListForDriver();
            return StatusCode(result.Status, new
            {
                message = result.Message,
                data = result.Data
            });

        }

        [Authorize(Roles = "Admin,Staff")]
        [HttpGet("get-staff-report-list")]
        public async Task<IActionResult> GetStaffReportType()
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _reportService.ReportTypeListForStaff();
            return StatusCode(result.Status, new
            {
                message = result.Message,
                data = result.Data
            });

        }
        [Authorize(Roles = "Admin,Staff")]
        [HttpPatch("mark-resolve")]
        public async Task<IActionResult> MarkResolve(MarkResolveDto requestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _reportService.MarkResolveInSystem(requestDto);
            return StatusCode(result.Status, new
            {
                message = result.Message,
            });

        }

        [HttpGet("view-question")]
        public async Task<IActionResult> ViewQuestion()
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _reportService.ViewQuestion();
            return StatusCode(result.Status, new
            {
                message = result.Message,
                data = result.Data
            });
        }

        [HttpPost("create-question")]
        public async Task<IActionResult> CreateQuestion([FromBody]QuestionRequest question)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _reportService.CreateQuestion(question);
            return StatusCode(result.Status, new
            {
                message = result.Message,
                data = result.Data
            });
        }



    }
}
