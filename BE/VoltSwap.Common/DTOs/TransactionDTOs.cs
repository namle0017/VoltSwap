using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public sealed class ConfirmPaymentRequest
    {
        public string TransactionId { get; set; } = default!;
    }
    public class TransactionRequest
    {
        public String DriverId { get; set; }
        public string SubId { get; set; }
        public String PlanId { get; set; }
        public string PaymentMethod { get; set; }
        public decimal Amount { get; set; }
        public decimal Fee { get; set; }
        public string Status { get; set; }
        public string TransactionType { get; set; }
        public string TransactionContext { get; set; }
        //Nemo: thêm transactionNote để cho lưu các fee hay note nào đó
    }
    public class TransactionListReponse
    {
        public string TransactionId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentStatus { get; set; }
        public string TransactionNote { get; set; }
        public DateTime PaymentDate { get; set; }
    }

    public class TransactionListForAdminResponse
    {
        public string TransactionId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentStatus { get; set; }
        public string TransactionContext { get; set; }
        public string TransactionNote { get; set; }
        public DateTime PaymentDate { get; set; }
    }



    public class BookingTransactionRequest
    {
        public string DriverId { get; set; }
        public string SubId { get; set; }
        public string TransactionType { get; set; }
        public decimal Amount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal Fee { get; set; }
    }


    // Nemo: Dto cho tính toán monthly revenue
    public class MonthlyRevenueResponse
    {
        public double TotalRevenue { get; set; }
        public double MonthlyPnl { get; set; }
    }


    // Nemo: Dto cho tính toán ở mỗi gói
    //public class MonthlySubscriptionResponse
    //{
    //    public string PlanId { get; set; }
    //    public string PlanName { get; set; }
    //    public double TotalAmountInMonth { get; set; }
    //    public double PercentPnlInMonth { get; set; }
    //}


    // Nemo: Dto cho tính toán số lượng khách trong hệ thộng theo plan
    public class MonthlySubscriptionResponse
    {
        public string PlanId { get; set; }
        public string PlanName { get; set; }
        public int TotalDriver { get; set; }
        public double PercentDriverByPlan { get; set; }
    }

    public class RegisterNewPlanDTO
    {
        public string PlanId { get; set; }
        public string DriverId { get; set; }

    }

    public class TransactionContextRequest
    {
        public string TransactionType { get; set; }
        public string SubscriptionId { get; set; }
        public string DriverId { get; set; }
    }


    //Nemo: cancel plan dto
    public class CancelPlanRequest
    {
        public string SubId { get; set; }
        public string DriverId { get; set; }
        public DateOnly DateBooking { get; set; }
        public TimeOnly TimeBooking { get; set; }
        public string StaffId { get; set; }
    }
    public class CheckCancelPlanRequest
    {
        public string SubId { get; set; }
        public string BookingId { get; set; }
        public string StaffId { get; set; }
    }

    //public class CancelPlanResponse
    //{
    //    public string SubId { get; set; }
    //    public string DriverId { get; set; }
    //    public decimal TotalAmount { get; set; }
    //    public DateTime PaymentDate { get; set; }
    //}


    public class UpdateTransactionRequest
    {
        public string SubId { get; set; }
        public decimal Fee { get; set; }
    }
    public class ConfirmTransactionRequest
    {
        public string TransactionId { get; set; }
    }

    public class TransactionDetailResponse
    {
        public string TransactionId { get; set; }
        public string Status { get; set; }
        public string TransactionType { get; set; }
        public string SubscriptionId { get; set; }
        public string DriverName { get; set; }
        public string DriverId { get; set; }
        public string PlanName { get; set; }
        public int NumberOfBooking { get; set; }
        public decimal? TotalFee { get; set; }
        public decimal TotalAmount { get; set; }
    }
}
