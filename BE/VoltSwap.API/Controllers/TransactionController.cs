using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.Common.DTOs;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TransactionController : ControllerBase
    {
        private readonly TransactionService _transService;
        public TransactionController(TransactionService transService)
        {
            _transService = transService;
        }

        [HttpGet("transaction")]
        public async Task<IActionResult> TransactionApiClient(TransactionRequest requestDto)
        {
            var transactionMethod = await _transService.CreateTransactionAsync(requestDto);
            return Ok(transactionMethod);
        }
    }
}
