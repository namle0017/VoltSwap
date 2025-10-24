using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.Common.DTOs;
using VoltSwap.BusinessLayer.IServices;

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
        [HttpPost("expire-check")]
        public async Task<IActionResult> ExpireCheck([FromBody] CancelBookingRequest request)
        {
            var result = await _bookingService.CancelBookingAsync(request);
            return StatusCode(result.Status, result.Message);
        }

        //Bin: Staff xem danh sách booking của trạm
        [HttpGet("station-booking-list")]
        public async Task<IActionResult> GetBookingListByStationId([FromQuery] ViewBookingRequest request)
        {
            var getBookingList = await _bookingService.GetBookingsByStationAndMonthAsync(request.StationId, request.Month, request.Year);
            return StatusCode(getBookingList.Status,
                            new
                            {
                                message = getBookingList.Message,
                                data = getBookingList.Data
                            });
        }
    }
}
