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

        public async Task<ServiceResult> CreateBookingAsync(CreateBookingRequest request)
        {
            var subscription = await GetSubscriptionById(request.SubscriptionId);
            if (subscription == null)
            {
                return new ServiceResult { Status = 404, Message = "Subscription not found" };
            }

            string bookingId = await GenerateBookingId();

            var locked = await _slotRepo.LockSlotsAsync(request.BatterySwapStationId, request.SubscriptionId, bookingId);
      


            var appointment = new Appointment
            {
                AppointmentId = bookingId,
                UserDriverId = request.UserDriverId,
                BatterySwapStationId = request.BatterySwapStationId,
                Note = request.Note,
                SubscriptionId = request.SubscriptionId,
                Status = "Not done",
                DateBooking = request.DateBooking,
                TimeBooking = request.TimeBooking,
                CreateBookingAt = DateTime.UtcNow.ToLocalTime()
            };

            await _bookingRepo.CreateAsync(appointment);
            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 201,
                Message = "Booking created successfully",
                Data = new { appointment , locked }
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
    }
}
