using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.API.Libraries;
using VoltSwap.BusinessLayer.IServices;
using static VoltSwap.Common.DTOs.VnPayDtos;

namespace VoltSwap.BusinessLayer.Services
{
    public class VnPayService : IVnPayService
    {
        private readonly IConfiguration _configuration;

        public VnPayService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

public string CreatePaymentUrl(PaymentInformationModel model, HttpContext context)
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(_configuration["TimeZoneId"]);
        var now = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);

        var pay = new VnPayLibrary();

        // Đọc cấu hình đúng key trong section "Vnpay"
        var baseUrl = _configuration["Vnpay:BaseUrl"];
        var hashSecret = _configuration["Vnpay:HashSecret"];
        var returnUrl = _configuration["Vnpay:ReturnUrl"];      
        var locale = _configuration["Vnpay:Locale"] ?? "vn";

        // Chuẩn hóa amount: tối thiểu 10,000 VND để test, nhân 100 và dùng InvariantCulture
        long amountVnd = (long)Math.Round(model.Amount);
        if (amountVnd < 10000) amountVnd = 10000;
        string amountField = (amountVnd * 100).ToString(CultureInfo.InvariantCulture);

        // TxnRef duy nhất, gọn và hợp lệ (A–Z a–z 0–9 _ -)
        string txnRef = model.TransId;

            // OrderInfo không rỗng
            string orderInfo = string.IsNullOrWhiteSpace(model.OrderDescription)
        ? "Thanh toan don hang"
        : model.OrderDescription.Trim();


            // OrderType mặc định "other" nếu FE chưa gửi
            string orderType = string.IsNullOrWhiteSpace(model.OrderType) ? "other" : model.OrderType.Trim();

        pay.AddRequestData("vnp_Version", _configuration["Vnpay:Version"]);
        pay.AddRequestData("vnp_Command", _configuration["Vnpay:Command"]);     // "pay"
        pay.AddRequestData("vnp_TmnCode", _configuration["Vnpay:TmnCode"]);
        pay.AddRequestData("vnp_Amount", amountField);
        pay.AddRequestData("vnp_CurrCode", _configuration["Vnpay:CurrCode"]);    // "VND"
        pay.AddRequestData("vnp_TxnRef", txnRef);
        pay.AddRequestData("vnp_OrderInfo", orderInfo);
        pay.AddRequestData("vnp_OrderType", orderType);                           // "other" nếu chưa có mã ngành
        pay.AddRequestData("vnp_Locale", locale);                              // "vn" hoặc "en"
        pay.AddRequestData("vnp_ReturnUrl", returnUrl);                           // MUST: không được null
        pay.AddRequestData("vnp_IpAddr", pay.GetIpAddress(context));
        pay.AddRequestData("vnp_CreateDate", now.ToString("yyyyMMddHHmmss"));
        pay.AddRequestData("vnp_ExpireDate", now.AddMinutes(15).ToString("yyyyMMddHHmmss"));

        // VnPayLibrary.CreateRequestUrl phải: sort key asc -> build rawData (KHÔNG encode) -> HMAC SHA512 -> append vnp_SecureHash -> encode value khi ghép query
        var paymentUrl = pay.CreateRequestUrl(baseUrl, hashSecret);
        return paymentUrl;
    }



    public PaymentResponseModel PaymentExecute(IQueryCollection collections)
        {
            var pay = new VnPayLibrary();
            var response = pay.GetFullResponseData(collections, _configuration["Vnpay:HashSecret"]);

            return response;
        }


    }
}
