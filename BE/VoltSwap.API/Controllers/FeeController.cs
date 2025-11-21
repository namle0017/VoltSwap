using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.Services;
using static VoltSwap.Common.DTOs.FeeDtos;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FeeController : ControllerBase
    {
        private readonly FeeService _feeService;
        public FeeController(FeeService feeService) 
        {
            _feeService = feeService;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("update-fee")]
        public async Task<IActionResult> UpdateFee([FromBody]UpdateFeeGroupRequest request)
        {

          
            var result = await _feeService.UpdateFeesByGroupKeyAsync(request);
            return StatusCode(result.Status, new
            {
                result.Status,
                result.Message,
                result.Data
            });
        }
    }
}
