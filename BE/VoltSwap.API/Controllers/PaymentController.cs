using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.BusinessLayer.Services;
using static VoltSwap.Common.DTOs.VnPayDtos;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IVnPayService _vnPayService;
        private readonly ITransactionService _transService;
        private readonly IConfiguration _configuration;
        public PaymentController(IVnPayService vnPayService, ITransactionService transService, IConfiguration configuration)
        {

            _vnPayService = vnPayService;
            _transService = transService;
            _configuration = configuration;
        }
        [Authorize(Roles = "Driver,Staff,Admin")]
        [HttpPost("create")]
        public IActionResult CreatePaymentUrlVnpay(PaymentInformationModel model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var url = _vnPayService.CreatePaymentUrl(model, HttpContext);
            return Ok(new { paymentUrl = url });
        }

        [AllowAnonymous]
        [HttpGet("vnpay/callback")]
        [HttpPost("vnpay/callback")]
        public async Task<IActionResult> VnPayReturn()
        {
            var response = await _transService.ProcessVnPayCallbackAsync(Request.Query);

            var redirectData = new Dictionary<string, string>
            {
                ["success"] = response.Success ? "true" : "false",
                ["txnRef"] = response.OrderId,
                ["transNo"] = response.TransactionId
            };

            var queryString = string.Join("&", redirectData
                .Select(kvp => $"{kvp.Key}={Uri.EscapeDataString(kvp.Value)}"));

            var frontendUrl = _configuration["Vnpay:FrontendReturnUrl"] + "?" + queryString;
            return Redirect(frontendUrl);
        }

        [AllowAnonymous]
        [HttpGet("cPaymentIpnVnpay")]
        public IActionResult IpnVnpay()
        {
            // Xử lý server-to-server (IPN)
            return Ok("OK");
        }

        [Authorize(Roles = "Driver,Staff,Admin")]
        [HttpPost("create-payment")]
        public async Task<IActionResult> CreatePaymentUrlVnPay(string transactionId)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var url = await _transService.CreatePaymentUrlAsync(transactionId, HttpContext);
            return Ok(new { paymentUrl = url });
        }

        [AllowAnonymous]
        [HttpGet("vnpay/callback1")]
        public async Task<IActionResult> VnPayCallback()
        {
            var result = await _transService.ProcessVnPayCallbackAsync(Request.Query);
            return Content($"responsecode={(result.VnPayResponseCode == "00" ? "00" : "99")}", "text/plain");
        }

        [AllowAnonymous]
        [HttpGet("test")]
        public IActionResult Test() => Ok("Route works!");
    }
}
