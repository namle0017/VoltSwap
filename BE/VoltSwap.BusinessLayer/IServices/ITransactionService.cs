using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Models;
namespace VoltSwap.BusinessLayer.IServices
{
    public interface ITransactionService
    {
        Task<ServiceResult> CreateTransactionAsync(TransactionRequest request);
        Task<List<TransactionListReponse>> GetUserTransactionHistoryAsync(string driverId);

        Task<int> CreateTransactionBooking(BookingTransactionRequest requestDto);
        Task<ServiceResult> GetTransactionDetailAsync(string transactionId);
        Task<IServiceResult> ConfirmPaymentAsync(string transactionId);
    }
}
