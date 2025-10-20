using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Security.Cryptography;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.IRepositories;
using VoltSwap.DAL.Models;
using VoltSwap.DAL.UnitOfWork;
using static VoltSwap.Common.DTOs.CancelBookingRequest;

namespace VoltSwap.BusinessLayer.Services
{
    public class BookingService : BaseService, IBookingService
    {
        private readonly IGenericRepositories<Appointment> _bookingRepo;
        private readonly IGenericRepositories<User> _driverRepo;
        private readonly IGenericRepositories<Subscription> _subRepo;
        private readonly IPillarSlotRepository _slotRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;

        public BookingService(
            IServiceProvider serviceProvider,
            IGenericRepositories<Appointment> bookingRepo,
            IGenericRepositories<User> driverRepo,
            IGenericRepositories<Subscription> subRepo,
            IPillarSlotRepository slotRepo,
            IUnitOfWork unitOfWork,
            IConfiguration configuration
        ) : base(serviceProvider)
        {
            _bookingRepo = bookingRepo;
            _driverRepo = driverRepo;
            _subRepo = subRepo;
            _slotRepo = slotRepo;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }



        public async Task<ServiceResult> CancelBookingAsync(CancelBookingRequest request)
        {
            var appointment = await _bookingRepo.GetByIdAsync(a => a.AppointmentId == request.BookingId);
            if (appointment == null)
                return new ServiceResult { Status = 404, Message = "Booking not found" };

            if (!string.Equals(appointment.Status, "Not Done", StringComparison.OrdinalIgnoreCase))
                return new ServiceResult { Status = 409, Message = "Only Not Done bookings can be cancelled" };


            appointment.Status = "Cancelled";
            await _slotRepo.UnlockSlotsByAppointmentIdAsync(appointment.AppointmentId);
            _bookingRepo.Update(appointment);
            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = "Booking cancelled successfully",
                Data = new { appointmentId = appointment.AppointmentId }
            };
        }


        public async Task<ServiceResult> CreateBookingAsync(CreateBookingRequest request)
        {
            var subscription = await GetSubscriptionById(request.SubscriptionId);
            if (subscription == null)
            {
                return new ServiceResult { Status = 404, Message = "Subscription not found" };
            }
            //tạo transaction cho booking
            var newTransId = await GenerateTransactionId();
            string transactionContext = $"{subscription.UserDriverId}-BOOKING-{newTransId.Substring(6)}";
            var newTransaction = new Transaction
            {
                TransactionId = newTransId,
                SubscriptionId = subscription.SubscriptionId,
                UserDriverId = subscription.UserDriverId,
                TransactionType = "Booking",
                Amount = 30000,
                Currency = "VND",
                TransactionDate = DateTime.UtcNow.ToLocalTime(),
                PaymentMethod = "Bank transfer",
                Status = "Pending",
                Fee= 0,
                TotalAmount = 30000,
                Note = $"Note for booking {subscription.SubscriptionId}",
                TransactionContext = transactionContext,
            };
            await _unitOfWork.Trans.CreateAsync(newTransaction);
            await _unitOfWork.SaveChangesAsync();
            // 1 sub chỉ có 1 booking chưa hoàn thành
            //var hasActive = await _unitOfWork.Bookings
            //                                 .GetAllQueryable()
            //                                 .AnyAsync(a => a.SubscriptionId == request.SubscriptionId &&
            //                                             ( a.Status == "Not done"));

            //if (hasActive)
            //    return new ServiceResult(409, "This subscription already has an unfinished booking.");

            string bookingId = await GenerateBookingId();

            //var locked = await _slotRepo.LockSlotsAsync(request.StationId, request.SubscriptionId, bookingId);
      


            var appointmentDB = new Appointment
            {
             
             AppointmentId = bookingId,
             UserDriverId = request.DriverId,
                BatterySwapStationId = request.StationId,
                Note = request.Note,
                SubscriptionId = request.SubscriptionId,
                Status = "Pending",
                DateBooking = request.DateBooking,
                TimeBooking = request.TimeBooking,
                CreateBookingAt = DateTime.UtcNow.ToLocalTime()


            };
            await _bookingRepo.CreateAsync(appointmentDB);
            await _unitOfWork.SaveChangesAsync();


            var appointment = new BookingResponse
            {
                TransactionId = newTransId,
                AppointmentId = appointmentDB.AppointmentId,
                DriverId = appointmentDB.UserDriverId,
                BatterySwapStationId = appointmentDB.BatterySwapStationId,
                Note = appointmentDB.Note,
                SubscriptionId = appointmentDB.SubscriptionId,
                Status = appointmentDB.Status,
                DateBooking = appointmentDB.DateBooking,
                TimeBooking = appointmentDB.TimeBooking,
                CreateBookingAt = appointmentDB.CreateBookingAt
            };

            return new ServiceResult
            {
                Status = 201,
                Message = "Booking created successfully",
                Data = new { appointment }
            };
        }
        //Tao ra transactionID
        public async Task<string> GenerateTransactionId()
        {
            string transactionId;
            bool isDuplicated;
            string dayOnly = DateTime.Today.Day.ToString("D2");
            do
            {
                // Sinh 10 chữ số ngẫu nhiên
                var random = new Random();
                transactionId = $"TRANS-{dayOnly}-{string.Concat(Enumerable.Range(0, 10).Select(_ => random.Next(0, 10).ToString()))}";

                // Kiểm tra xem có trùng không
                isDuplicated = await _unitOfWork.Trans.AnyAsync(u => u.TransactionId == transactionId);

            } while (isDuplicated);
            return transactionId;
        }

        public async Task<string> GenerateBookingId()
        {
            string bookingId; bool isDuplicated;
            do
            {
                bookingId = $"AP-{RandomNumberGenerator.GetInt32(0, 10_000_000):D7}";
                isDuplicated = await _bookingRepo.AnyAsync(b => b.AppointmentId == bookingId);
            } while (isDuplicated);
            return bookingId;
        }

        public Task<Subscription?> GetSubscriptionById(string subscriptionId)
            => _subRepo.GetByIdAsync(s => s.SubscriptionId == subscriptionId);
    }
}
