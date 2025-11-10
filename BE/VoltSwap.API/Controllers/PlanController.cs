using Microsoft.AspNetCore.Authorization;
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

        [Authorize(Roles = "Driver")]
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
        [Authorize(Roles = "Driver")]
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
        [Authorize(Roles = "Driver")]
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
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
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
        [AllowAnonymous]
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

        //Bin: Update Plan
        [HttpPost("update-plan")]
        public async Task<IActionResult> UpdatePlan(PlanDtos x)
        {
            var getplan = await _planService.UpdatePlanAsync(x);
            return StatusCode(getplan.Status, new
            {
                getplan.Message,
                getplan.Data
            });
        }

        //Bin: Tạo thêm plan
        [HttpPost("create-plan")]
        public async Task<IActionResult> CreatePlan([FromBody] PlanCreateRequest x)
        {
            var getplan = await _planService.CreatePlanAsync(x);
            return StatusCode(getplan.Status, new
            {
                getplan.Message,
                getplan.Data
            });
        }
        [HttpPost("delete-plan")]
        public async Task<IActionResult> DeletePlan([FromBody] PlanDeleteRequest request)
        {
            var getplan = await _planService.DeletePlanAsync(request.planId);
            return StatusCode(getplan.Status, new
            {
                getplan.Message,
                getplan.Data
            });
        }
    }
}
