using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
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

            var vnp_Params = new SortedDictionary<string, string>();

            // Lấy config
            var tmnCode = _configuration["Vnpay:TmnCode"];
            var hashSecret = _configuration["Vnpay:HashSecret"];
            var baseUrl = _configuration["Vnpay:BaseUrl"];
            var returnUrl = _configuration["Vnpay:ReturnUrl"];
            var locale = _configuration["Vnpay:Locale"] ?? "vn";

            // Amount: nhân 100, không làm tròn
            long amountVnd = (long)model.Amount;
            if (amountVnd < 10000) amountVnd = 10000;
            string amountField = (amountVnd * 100).ToString();

            string txnRef = model.TransId;
            string orderInfo = string.IsNullOrWhiteSpace(model.OrderDescription)
                ? "Thanh toan don hang"
                : model.OrderDescription.Trim();

            string orderType = string.IsNullOrWhiteSpace(model.OrderType) ? "other" : model.OrderType.Trim();

            // Thêm các tham số bắt buộc
            vnp_Params.Add("vnp_Version", _configuration["Vnpay:Version"]);
            vnp_Params.Add("vnp_Command", _configuration["Vnpay:Command"]);
            vnp_Params.Add("vnp_TmnCode", tmnCode);
            vnp_Params.Add("vnp_Amount", amountField);
            vnp_Params.Add("vnp_CurrCode", _configuration["Vnpay:CurrCode"]);
            vnp_Params.Add("vnp_TxnRef", txnRef);
            vnp_Params.Add("vnp_OrderInfo", orderInfo);
            vnp_Params.Add("vnp_OrderType", orderType);
            vnp_Params.Add("vnp_Locale", locale);
            vnp_Params.Add("vnp_ReturnUrl", returnUrl);
            vnp_Params.Add("vnp_IpAddr", GetIpAddress(context));
            vnp_Params.Add("vnp_CreateDate", now.ToString("yyyyMMddHHmmss"));
            vnp_Params.Add("vnp_ExpireDate", now.AddMinutes(1).ToString("yyyyMMddHHmmss"));

            // Tạo chuỗi dữ liệu để hash (raw, chưa encode)
            var signData = string.Join("&",
                vnp_Params.Select(kvp => $"{kvp.Key}={UrlEncodeUpper(kvp.Value)}"));

            // Tạo chữ ký
            var secureHash = HmacSHA512(hashSecret, signData);
            vnp_Params.Add("vnp_SecureHash", secureHash);

            // Tạo URL cuối cùng
            var paymentUrl = baseUrl + "?" + string.Join("&",
                vnp_Params.Select(kvp => $"{kvp.Key}={UrlEncodeUpper(kvp.Value)}"));

            return paymentUrl;
        }



        public PaymentResponseModel PaymentExecute(IQueryCollection collections)
        {
            var pay = new VnPayLibrary();
            var response = pay.GetFullResponseData(collections, _configuration["Vnpay:HashSecret"]);

            return response;
        }

        private string GetIpAddress(HttpContext context)
        {
            var ip = context.Connection.RemoteIpAddress?.ToString();
            return ip == "::1" ? "127.0.0.1" : ip ?? "127.0.0.1";
        }

        private string UrlEncodeUpper(string str)
        {
            return System.Web.HttpUtility.UrlEncode(str, Encoding.UTF8)?.Replace("%2b", "+").ToUpper();
        }

        private string HmacSHA512(string key, string input)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var inputBytes = Encoding.UTF8.GetBytes(input);
            using (var hmac = new HMACSHA512(keyBytes))
            {
                var hashBytes = hmac.ComputeHash(inputBytes);
                return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
            }
        }


    }
}
