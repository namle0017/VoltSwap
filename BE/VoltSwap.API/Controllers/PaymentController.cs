using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.IServices;
using static VoltSwap.Common.DTOs.VnPayDtos;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IVnPayService _vnPayService;
        public PaymentController(IVnPayService vnPayService)
        {

            _vnPayService = vnPayService;
        }

        [HttpPost("create")]
        public IActionResult CreatePaymentUrlVnpay(PaymentInformationModel model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var url = _vnPayService.CreatePaymentUrl(model, HttpContext);
            return Ok(new { paymentUrl = url });
        }

        [HttpGet("cPaymentCallbackVnpay")]
        public IActionResult CallbackVnpay()
        {
            // Log toàn bộ query để kiểm tra
            var query = HttpContext.Request.Query.ToDictionary(k => k.Key, v => v.Value.ToString());

            // (Tùy bạn) Verify SecureHash ở đây rồi trả kết quả
            return Ok(new
            {
                message = "VNPAY return received",
                query
            });
        }

  
        [HttpGet("cPaymentIpnVnpay")]
        public IActionResult IpnVnpay()
        {
            // Xử lý server-to-server (IPN)
            return Ok("OK");
        }



    }
}
