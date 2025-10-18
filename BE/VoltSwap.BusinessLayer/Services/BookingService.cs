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

namespace VoltSwap.BusinessLayer.Services
{
    public class BookingService : BaseService, IBookingService
    {
        private readonly IGenericRepositories<Appointment> _bookingRepo;
        private readonly IGenericRepositories<User> _driverRepo;
        private readonly IGenericRepositories<Subscription> _subRepo;
        private readonly IGenericRepositories<Fee> _feeRepo;
        private readonly IPillarSlotRepository _slotRepo;
        private readonly ITransactionService _transService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;

        public BookingService(
            IServiceProvider serviceProvider,
            IGenericRepositories<Appointment> bookingRepo,
            IGenericRepositories<User> driverRepo,
            IGenericRepositories<Subscription> subRepo,
            IGenericRepositories<Fee> feeRepo,
            IPillarSlotRepository slotRepo,
            ITransactionRepository transService,
            IUnitOfWork unitOfWork,
            IConfiguration configuration
        ) : base(serviceProvider)
        {
            _bookingRepo = bookingRepo;
            _driverRepo = driverRepo;
            _subRepo = subRepo;
            _feeRepo = feeRepo;
            _slotRepo = slotRepo;
            _transService = (ITransactionService?)transService;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }

        public async Task<ServiceResult> CreateBookingAsync(CreateBookingRequest request)
        {
            var subscription = await GetSubscriptionById(request.SubscriptionId);
            if (subscription == null)
            {
                return new ServiceResult { Status = 404, Message = "Subscription not found" };
            }

            string bookingId = await GenerateBookingId();

            var locked = await _slotRepo.LockSlotsAsync(request.StationId, request.SubscriptionId, bookingId);



            var appointment = new Appointment
            {
                AppointmentId = bookingId,
                UserDriverId = request.DriverId,
                BatterySwapStationId = request.StationId,
                Note = request.Note,
                SubscriptionId = request.SubscriptionId,
                Status = "Not done",
                DateBooking = request.DateBooking,
                TimeBooking = request.TimeBooking,
                CreateBookingAt = DateTime.UtcNow.ToLocalTime()
            };
            var feeBooking = await CalFeeForBooking(request.SubscriptionId);
            var bookingRequest = new BookingTransactionRequest
            {
                DriverId = request.DriverId,
                SubId = request.SubscriptionId,
                TransactionType = "booking",
                Amount = 0,
                Fee = feeBooking,
                TotalAmount = feeBooking + 0,
            };

            int checkPayment = await _transService.CreateTransactionBooking(bookingRequest);

            await _bookingRepo.CreateAsync(appointment);
            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 201,
                Message = "Booking created successfully",
                Data = new { appointment }
            };
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


        // Chỗ này được chia thành 3 tầng để tính ra được fee cho booking
        // Đầu tiên phải lấy ra được số lượng bat và plan của subId đó đc mượn
        // Tiếp theo là lấy plan theo subId
        // Tiếp theo là lấy fee theo booking và planid
        // Tiếp theo là lấy fee theo battery_swap và planid
        public async Task<decimal> CalFeeForBooking(string subId)
        {
            var getNumberOfBattery = await GetNumberOfbatteryInSub(subId);
            var getSub = await _subRepo
                .GetAllQueryable()
                .FirstOrDefaultAsync(sub => sub.SubscriptionId == subId);
            var getBookingFee = await _feeRepo
                .GetAllQueryable()
                .FirstOrDefaultAsync(fee => fee.TypeOfFee == "booking" && fee.PlanId == getSub.PlanId);
            var getSwapFee = await _feeRepo
                .GetAllQueryable()
                .FirstOrDefaultAsync(fee => fee.TypeOfFee == "battery_swap" && fee.PlanId == getSub.PlanId);
            decimal totalFee = getNumberOfBattery * getSwapFee.Amount + getBookingFee.Amount;
            return totalFee;
        }


        public async Task<int> GetNumberOfbatteryInSub(string subId)
        {
            var count = await _unitOfWork.Subscriptions.GetAllQueryable()
                .Where(sub => sub.SubscriptionId == subId)
                .Select(sub => sub.Plan.NumberOfBattery)
                .FirstOrDefaultAsync();
            return count ?? 0;
        }
    }
}
