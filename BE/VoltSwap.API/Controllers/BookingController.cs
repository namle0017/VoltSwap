using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.Common.DTOs;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingController : ControllerBase
    {

        private readonly BookingService _bookingService;
        public BookingController(BookingService bookingService)
        {
            _bookingService = bookingService;
        }

        [Authorize(Roles = "Driver")]
        [HttpPost("create-booking")]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
        {
            var result = await _bookingService.CreateBookingAsync(request);
            return StatusCode(result.Status, new
            {
                result.Status,
                result.Message,
                result.Data
            });
        }
        [Authorize(Roles = "Driver")]
        //Nemo: Hàm để booking để huỷ gói
        [HttpPost("booking-cancel-plan")]
        public async Task<IActionResult> CreateBookingCancelPlan([FromBody] CreateBookingRequest request)
        {
            var result = await _bookingService.BookingCancelPlanAsync(request);
            return StatusCode(result.Status, new
            {
                result.Status,
                result.Message,
                result.Data
            });
        }

        [Authorize(Roles = "Admin,Driver,Staff")]
        [HttpPost("expire-check")]
        public async Task<IActionResult> ExpireCheck([FromBody] CancelBookingRequest request)
        {
            var result = await _bookingService.CancelBookingAsync(request);
            return StatusCode(result.Status, result.Message);
        }
        [Authorize(Roles = "Driver,Staff")]
        //Bin:hủy booking bởi người dùng
        [HttpPost("cancel-booking-by-user")]
        public async Task<IActionResult> CancelBooking([FromBody] CancelBookingRequest request)
        {
            var result = await _bookingService.CancelBookingByUserAsync(request);
            return StatusCode(result.Status, new
            {
                result.Status,
                result.Message,
                result.Data
            });
        }

        //Bin: Staff xem danh sách booking của trạm
        [Authorize(Roles = "Staff")]
        [HttpGet("station-booking-list")]
        public async Task<IActionResult> GetBookingListByStationId([FromQuery] ViewBookingRequest request)
        {
            var getBookingList = await _bookingService.GetBookingsByStationAndMonthAsync(request);
            return StatusCode(getBookingList.Status,
                            new
                            {
                                message = getBookingList.Message,
                                data = getBookingList.Data
                            });
        }
    }
}
