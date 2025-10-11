using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.DAL.DTO;
using VoltSwap.DAL.Models;

namespace VoltSwap.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlansController : ControllerBase
    {
        private readonly IPlanService _service;

        public PlansController(IPlanService service)
        {
            _service = service;
        }

        /// <summary>
        /// Get all plans (Admin only)
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetAllPlans(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string keyword = "")
        {
            var queryOptions = new QueryOptions<Plan>
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                Filter = string.IsNullOrWhiteSpace(keyword)
                    ? null
                    : p => p.PlanName.Contains(keyword) || p.UserAdminId.Contains(keyword),

                // ✅ Dùng tuple cho OrderBy (theo đúng kiểu bạn đang dùng)
                OrderBy = new List<(string PropertyName, bool Ascending)>
                {
                    (nameof(Plan.PlanName), true)
                }
            };

            var plans = await _service.Get(queryOptions);

            if (plans == null || !plans.Items.Any())
                return NotFound("No plans found.");

            return Ok(plans);
        }
    }
}
