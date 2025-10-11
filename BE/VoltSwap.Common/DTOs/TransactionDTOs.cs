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
}
