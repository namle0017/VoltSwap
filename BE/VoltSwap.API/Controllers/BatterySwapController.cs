using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.Common.DTOs;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BatterySwapController : ControllerBase
    {
        private readonly BatterySwapService _batSwapService;
        private readonly StationService _stationService;
        public BatterySwapController(BatterySwapService batSwapService, StationService stationService)
        {
            _batSwapService = batSwapService;
            _stationService = stationService;
        }

        //Tài
        [HttpGet("validate-subscription")]
        public async Task<IActionResult> ValidateSubscriptionSlots([FromQuery] AccessRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _batSwapService.CheckSubId(request);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        //tài
        [HttpPost("swap-in-battery")]
        public async Task<IActionResult> SwapInBattery([FromBody] BatterySwapListRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _batSwapService.CheckBatteryAvailable(request);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        //Tài
        [HttpPost("swap-out-battery")]
        public async Task<IActionResult> SwapOutBattery([FromBody] BatterySwapOutListRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _batSwapService.SwapOutBattery(request);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        //Tài
        [HttpGet("get-station-list")]
        public async Task<IActionResult> GetStationList()
        {
            var result = await _stationService.GetStationActive();
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        //Kiệt
        //Hàm này để lấy ra danh sách pin trong trạm
        [HttpPost("get-battery-in-station")]
        public async Task<IActionResult> GetBatteryInStation([FromBody] GetBatteryInStationRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _stationService.GetBatteryInStation(request.StationId);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        //Kiệt
        //Hàm này để staff hỗ trợ khách hàng đổi pin
        [HttpPost("staff-help-customer")]
        public async Task<IActionResult> StaffHelpAsync([FromBody] StaffBatteryRequest requestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _batSwapService.StaffTransferBattery(requestDto);

            return StatusCode(result.Status, new { message = result.Message });
        }

        //Kiệt
        //Hàm này để staff check trạm có bao nhiêu cột, mỗi cột có bao nhiêu slot
        [HttpGet("pillar-slot-in-station")]
        public async Task<IActionResult> GetPillarSlotInStation([FromQuery] string stationId)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _batSwapService.StaffCheckStation(stationId);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        [HttpGet("staff-add-new-battery")]
        //Hàm này để staff thêm pin mới vào trạm
        public async Task<IActionResult> StaffAddNewBattery([FromQuery] StaffNewBatteryInRequest requestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _batSwapService.StaffAddNewBattery(requestDto);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        // Cái API này sẽ trả về 2 danh sách trạm ở 2 cột khác nhau sử dụng ListStationForTransferResponse
        [HttpGet("get-station-for-transfer")]
        public async Task<IActionResult> GetStationForTransfer()
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _stationService.GetActiveStation();
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }


        [HttpPost("transfer-battery")]
        public async Task<IActionResult> TransferBattery(BatteryTranferRequest requestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _batSwapService.TranferBatBetweenStation(requestDto);
            return StatusCode(result.Status, new { message = result.Message });
        }


        [HttpPost("create-cancel-plan")]
        public async Task<IActionResult> CreateCancelPlan(CheckCancelPlanRequest requestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _batSwapService.CancelPlanAsync(requestDto);
            return StatusCode(result.Status, new
            {
                message = result.Message,
                data = result.Data
            });


        }

        //Bin: staff xem lich su swap cua tram
        [HttpGet("staff-view-battery-swap")]
        public async Task<IActionResult> ViewBatterySwap([FromQuery] UserRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _batSwapService.BatterySwapList(request);
            return StatusCode(result.Status, new
            {
                message = result.Message,
                data = result.Data
            });
        }
    }
}
