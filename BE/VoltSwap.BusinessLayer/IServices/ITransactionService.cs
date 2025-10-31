using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Models;
using static VoltSwap.Common.DTOs.VnPayDtos;
namespace VoltSwap.BusinessLayer.IServices
{
    public interface ITransactionService
    {
        Task<ServiceResult> CreateTransactionAsync(TransactionRequest request);
        Task<List<TransactionListReponse>> GetUserTransactionHistoryAsync(string driverId);

        Task<int> CreateTransactionBooking(BookingTransactionRequest requestDto);
        Task<ServiceResult> GetTransactionDetailAsync(string transactionId);
        Task<IServiceResult> ConfirmPaymentAsync(string transactionId);
        //Task<ServiceResult> RegisterNewPlan(RegisterNewPlanDTO requestDto);
        Task<String> GenerateTransactionConext(TransactionContextRequest requestDto);
        Task<MonthlyRevenueResponse> GetMonthlyRevenue();
        Task<string> GenerateSubscriptionId();

        //Nemo: Tạo Transaction hàng loạt
        Task<ServiceResult> CreateTransactionChain();

        //Nemo: Check coi sub nào có trạng thái muốn huỷ
        Task<bool> CheckSubEndDate(string subId);

        //Nemo: lấy planId qua subId
        Task<string> GetPlanIdBySubId(string subId);
        Task<ServiceResult> RegisterNewPlanAsync(RegisterNewPlanRequest requestDto);

        //Task<ServiceResult> CancelPlanAsync(CancelPlanRequest requestDto);

        Task<int> UpdateTransactionAsync(UpdateTransactionRequest requestDto);

        Task<string> CreatePaymentUrlAsync(string transId, HttpContext context);
        Task<PaymentResponseModel> ProcessVnPayCallbackAsync(IQueryCollection queryCollection);

        Task<ServiceResult> RecreateTransaction(string transactionId);

        Task<bool> CheckPaidMonthly(string subId);

    }
}
