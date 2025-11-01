using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.Common.DTOs;

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

        //Bin: lấy danh sách plan đề xuất
        [HttpGet("plan-suggest-list")]
        public async Task<IActionResult> GetPlanSuggestList([FromQuery] PlanSuggestRequest? request)
        {
            var planNames = string.IsNullOrEmpty(request.PlanName)
        ? new List<string>()
        : request.PlanName.Split(',').Select(x => x.Trim()).ToList();

            var getList = await _planService.GetPlanWithSuggestAsync(planNames);
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

        //Bin: Admin xem danh sách plan 
        [HttpGet("view-plan-list")]
        public async Task<IActionResult> ViewPlanList(int month , int year)
        {
            var getList = await _planService.GetPlanListSummaryAsync(month, year);
            return StatusCode(getList.Status, new
            {
                getList.Message,
                getList.Data
            });
        }

        //Bin: Admin xem chi tiết plan
        [HttpGet("view-plan-detail")]
        public async Task<IActionResult> ViewPlanDetail()
        {
            var getDetail = await _planService.GetPlanDetailListAsync();
            return StatusCode(getDetail.Status, new
            {
                getDetail.Message,
                getDetail.Data
            });
        }

        //Bin: lấy thông tin plan ngoài landscap
        [HttpGet("view-plan-landscape")]
        public async Task<IActionResult> ViewPlan()
        {
            var getplan = await _planService.GetPlanOutLandScap();
            return StatusCode(getplan.Status, new
            {
                getplan.Message,
                getplan.Data
            });
        }
    }
}
