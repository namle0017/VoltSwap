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

        [HttpPost("createBooking")]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
        {
            var result = await _bookingService.CreateBookingAsync(request);
            return StatusCode(result.Status, new
            {
                result.Message,
                result.Data
            });
        }
    }
}
