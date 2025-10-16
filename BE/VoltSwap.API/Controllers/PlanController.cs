using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.Services;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlanController : ControllerBase
    {
        private readonly PlanService _planService;
        public PlanController(PlanService planService)
        {
            _planService = planService;
        }


        [HttpGet("plan-list")]
        public async Task<IActionResult> GetPlanList()
        {
            var getList = await _planService.GetPlanAsync();
            return StatusCode(getList.Status, new
            {
                getList.Message,
                getList.Data
            });
        }

        [HttpGet("plan-detail/{planId}")]
        public async Task<IActionResult> GetPlanDetail(string planId)
        {
            var getDetail = await _planService.GetPlanDetailAsync(planId);
            return StatusCode(getDetail.Status, new
            {
                getDetail.Message,
                getDetail.Data
            });
        }
    }
}
