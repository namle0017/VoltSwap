using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class TransactionRequest
    {
        public String DriverId { get; set; }
        public String PlanId { get; set; }
        public decimal Amount { get; set; }
        public decimal Fee { get; set; }
        public string TransactionType { get; set; }
    }

    public class TransactionReponse
    {
        public string TransactionId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentStatus { get; set; } = "Pending";
        public string BankName { get; set; }
        public string TransactionContext { get; set; }
        public string PaymentAccount {  get; set; }
    }
    public class TransactionListReponse
    {
        public string TransactionId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentStatus { get; set; }
        public string TransactionNote { get; set; }
        public DateTime PaymentDate {  get; set; }
    }

    public class  TransactionListForAdminResponse
    {
        public string TransactionId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentStatus { get; set; }
        public string TransactionContext { get; set; }
        public string TransactionNote { get; set; }
        public DateTime PaymentDate { get; set; }
    }

    public class ApproveTransactionRequest
    {
        public string RequestTransactionId { get; set; }
        public string NewStatus { get; set; }
    }
}
