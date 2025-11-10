using Azure.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.BusinessLayer.Services;
using static VoltSwap.Common.DTOs.RatingDtos;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RatingController : ControllerBase
    {
        private readonly RatingService _ratingService;
        public RatingController(RatingService ratingService)
        {
            _ratingService = ratingService;
        }

        [HttpPost("create-rating")]
        public async Task<IActionResult> CreateRating( [FromBody]RatingRequest request)
        {            
            var results = await _ratingService.RatingStation(request);

            if (results == null)
            {
                return StatusCode(404, new { message = "Not Found" });
            }

            return StatusCode(200, new { message = results.Message, data = results.Data });

        }

        [HttpGet("view-rating")]
        public async Task<IActionResult> ViewRating()
        {
            var results = await _ratingService.ViewRating();

            if (results == null)
            {
                return StatusCode(404, new { message = "Not Found" });
            }

            return StatusCode(200, new { message = results.Message, data = results.Data });

        }





    }
}
