using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Runtime.CompilerServices;
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
        //Nemo: hàm này để admin create transaction vào mỗi tháng
        [HttpPost("admin-create-transaction")]
        public async Task<IActionResult> ApproveTransactionAdmin()
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var transaction = await _transService.CreateTransactionChain();
            return StatusCode(transaction.Status, new { message = transaction.Message });
        }

        //Nemo: Người dùng đăng ký mua gói
        [HttpPost("transaction-register")]
        public async Task<IActionResult> TransactionApiClient([FromBody] RegisterNewPlanRequest requestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var transactionMethod = await _transService.RegisterNewPlanAsync(requestDto);
            return Ok(transactionMethod);
        }

        //Hàm này để cho user trả transaction
        [HttpGet("transaction-detail")]
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


        [HttpGet("admin-transaction-list")]
        public async Task<IActionResult> AdminTransaction()
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _transService.GetTransactionsByAdminAsync();
            return StatusCode(result.Status, new { message = result.Message, data = result.Data });
        }

        //[HttpPost("admin-approve-transaction")]
        //public async Task<IActionResult> ApproveTransaction([FromBody] ApproveTransactionRequest requestDto)
        //{
        //    if (!ModelState.IsValid)
        //    {
        //        return BadRequest(ModelState);
        //    }
        //    var result = await _transService.UpdateTransactionStatusAsync(requestDto);
        //    return StatusCode(result.Status, new { message = result.Message });
        //}


        [HttpGet("payment-detail")]
        public async Task<IActionResult> GetPaymentDetail([FromQuery] string transactionId)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _transService.GetTransactionDetailAsync(transactionId);
            return StatusCode(result.Status, new
            {
                message = result.Message,
                Data = result,
            });
        }

        // Nemo: API cho confirm chuyển tiền
        [HttpPost("confirm-payment")]
        public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _transService.ConfirmPaymentAsync(request.TransactionId);
            return StatusCode(result.Status, new
            {
                message = result.Message,
            });
        }

        //Bin: staff confirm transaction huy goi 
        [HttpPost("staff-confirm-transaction")]
        public async Task<IActionResult> ConfirmByStaff([FromBody] ConfirmTransactionRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _transService.ConfirmCancelAsync(request);
            return StatusCode(result.Status, new
            {
                message = result.Message,
            });
        }

        [HttpPatch("recreate-transaction")]
        public async Task<IActionResult> RecreateTransactionAsync(string transactionId)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _transService.RecreateTransaction(transactionId);
            return StatusCode(result.Status, new
            {
                message = result.Message,
                Data = result,
            });
        }
    }
}
