using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Transactions;
using VoltSwap.BusinessLayer.Base;
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


        [HttpPost("transaction-user-list")]
        public async Task<IActionResult> TransactionApiClient([FromBody] TransactionRequest requestDto)
        {
            if(!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var transactionMethod = await _transService.CreateTransactionAsync(requestDto);
            return Ok(transactionMethod);
        }

        //Hàm này để cho user trả transaction
        [HttpPost("{requestTransactionId}")]
        public async Task<IActionResult> CreateTransaction(string requestTransactionId)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _transService.GetTransactionDetailAsync(requestTransactionId);
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        //Hàm này để trả về transaction histoy của user
        [HttpGet("user-transaction-history-list/{userDriverId}")]
        public async Task<IActionResult> UserTransactionHistory(string userDriverId)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _transService.GetUserTransactionHistoryAsync(userDriverId);
            return Ok(result);
        }

        //Hàm này để admin trả về status của transaction
        [HttpGet("admin-transaction-list")]
        public async Task<IActionResult> AdminTransaction()
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _transService.GetAllPendingTransactionsAsync();
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        [HttpPost("admin-approve-transaction")]
        public async Task<IActionResult> ApproveTransaction([FromBody] ApproveTransactionRequest requestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _transService.UpdateTransactionStatusAsync(requestDto);
            return StatusCode(result.Status, new { message = result.Message });
        }
    }
}
