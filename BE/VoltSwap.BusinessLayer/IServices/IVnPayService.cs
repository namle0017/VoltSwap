using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static VoltSwap.Common.DTOs.VnPayDtos;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IVnPayService
    {
        string CreatePaymentUrl(PaymentInformationModel model, HttpContext context);
        PaymentResponseModel PaymentExecute(IQueryCollection collections);

    }
}
