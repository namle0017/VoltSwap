using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Globalization;
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
        private readonly IGenericRepositories<Fee> _feeRepo;
        private readonly IPillarSlotRepository _slotRepo;
        private readonly ITransactionService _transService;
        private readonly IGenericRepositories<StationStaff> _stationstaffRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;

        public BookingService(
            IServiceProvider serviceProvider,
            IGenericRepositories<Appointment> bookingRepo,
            IGenericRepositories<User> driverRepo,
            IGenericRepositories<Subscription> subRepo,
            IGenericRepositories<Fee> feeRepo,
            IGenericRepositories<StationStaff> stationstaffRepo,
            IPillarSlotRepository slotRepo,
            ITransactionService transService,
            IUnitOfWork unitOfWork,
            IConfiguration configuration
        ) : base(serviceProvider)
        {
            _bookingRepo = bookingRepo;
            _driverRepo = driverRepo;
            _subRepo = subRepo;
            _stationstaffRepo = stationstaffRepo;
            _feeRepo = feeRepo;
            _slotRepo = slotRepo;
            _transService = transService;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }



        public async Task<ServiceResult> CancelBookingAsync(CancelBookingRequest request)
        {
            var appointment = await _bookingRepo.GetByIdAsync(a => a.AppointmentId == request.BookingId);
            if (appointment == null)
                return new ServiceResult { Status = 404, Message = "Booking not found" };

            //if (!string.Equals(appointment.Status, "Pending", StringComparison.OrdinalIgnoreCase))
            //    return new ServiceResult { Status = 409, Message = "Only Not Done bookings can be cancelled" };


            appointment.Status = "Canceled";
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

            var getFee = await _unitOfWork.Fees.GetByIdAsync(f => f.PlanId == subscription.PlanId && f.TypeOfFee =="Booking");

            //tạo transaction cho booking
            var newTransId = await GenerateTransactionId();
            string transactionContext = $"{subscription.UserDriverId}-BOOKING-{newTransId.Substring(6)}";
            var newTransaction = new Transaction
            {
                TransactionId = newTransId,
                SubscriptionId = subscription.SubscriptionId,
                UserDriverId = subscription.UserDriverId,
                TransactionType = "Booking",
                Amount = 0,
                Currency = "VND",
                TransactionDate = DateTime.UtcNow.ToLocalTime(),
                PaymentMethod = "Bank transfer",
                Status = "Pending",
                Fee = getFee.Amount,
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
                Data =  appointment 
            };
        }
        public async Task<ServiceResult> CreateBookingAsync_HC(CreateBookingRequest request)
        {
            var subscription = await GetSubscriptionById(request.SubscriptionId);
            if (subscription == null)
            {
                return new ServiceResult { Status = 404, Message = "Subscription not found" };
            }

            var getFee = await _unitOfWork.Fees.GetByIdAsync(f => f.PlanId == subscription.PlanId && f.TypeOfFee =="Booking");

            //tạo transaction cho booking
            var newTransId = await GenerateTransactionId();
            string transactionContext = $"{subscription.UserDriverId}-BOOKING-{newTransId.Substring(6)}";
            var newTransaction = new Transaction
            {
                TransactionId = newTransId,
                SubscriptionId = subscription.SubscriptionId,
                UserDriverId = subscription.UserDriverId,
                TransactionType = "Booking",
                Amount = 0,
                Currency = "VND",
                TransactionDate = DateTime.UtcNow.ToLocalTime(),
                PaymentMethod = "Bank transfer",
                Status = "Processing ",
                Fee = getFee.Amount,
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
                Status = "Success",
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
                Data =  appointment 
            };
        }

        //Bin: Staff xem danh sách booking của trạm mình
        public async Task<ServiceResult> GetBookingsByStationAndMonthAsync(ViewBookingRequest request)
        {
            var today = DateTime.UtcNow.ToLocalTime();
            var stationId = await _unitOfWork.StationStaffs.GetStationWithStaffIdAsync(request.StaffId);
            var bookingList = await _bookingRepo.GetAllQueryable()
                .Where(b => b.BatterySwapStationId == stationId.BatterySwapStationId 
                //&& b.CreateBookingAt == today
                )

                .ToListAsync();
            var bookingResponses = new List<ViewBookingResponse>();
            foreach (var booking in bookingList)
            {
                var driver = await _driverRepo.GetByIdAsync(d => d.UserId == booking.UserDriverId);

                var requiredBatteries = await _unitOfWork.Subscriptions.GetBatteryCountBySubscriptionIdAsync(booking.SubscriptionId);

                bookingResponses.Add(new ViewBookingResponse
                {
                    Date = booking.DateBooking,
                    DriverName = driver.UserName,
                    NumberBattery = requiredBatteries,
                    Note = booking.Note,
                    DriverTele = driver.UserTele,
                    TimeBooking = booking.TimeBooking,
                    Status = booking.Status,
                });

            }

            return new ServiceResult
            {
                Status = 200,
                Message = "Bookings retrieved successfully",
                Data = bookingResponses
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


        // Nemo: Chỗ này được chia thành 3 tầng để tính ra được fee cho booking
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
                .FirstOrDefaultAsync(fee => fee.TypeOfFee == "Booking" && fee.PlanId == getSub.PlanId);
            var getSwapFee = await _feeRepo
                .GetAllQueryable()
                .FirstOrDefaultAsync(fee => fee.TypeOfFee == "Battery Swap" && fee.PlanId == getSub.PlanId);
            var bookingAmount = getBookingFee?.Amount ?? 0m;
            var swapAmount = getSwapFee?.Amount ?? 0m;

            decimal totalFee = getNumberOfBattery * swapAmount + bookingAmount;
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

        //Nemo: Dùng để check coi là cái sub đó có booking được hoàn thiện chưa
        private async Task<bool> CheckBookingExist(string subId)
        {
            return await _bookingRepo.GetAllQueryable().AnyAsync(book => book.Status == "Processing" && book.Status == "Pending" && book.SubscriptionId == subId);
            //processing là đợi người dùng tới lấy
            //pending là đợi người dùng trả
        }

        //Nemo: Hàm này để cho 
        public async Task<ServiceResult> GetSubscriptionBookingAsync(String driverId)
        {
            var checkUpdateBooking = await UpdateStatusBookingAsync(driverId);
            var getBooking = await _bookingRepo.GetAllQueryable().Where(book => book.Status == "Processing" && book.UserDriverId == driverId)
                .OrderBy(book => book.DateBooking)
                .ThenBy(book => book.TimeBooking)
                .FirstOrDefaultAsync();
            var getStation = await _unitOfWork.Stations.GetByIdAsync(station => station.BatterySwapStationId == getBooking.BatterySwapStationId);
            if (getBooking == null)
            {
                return new ServiceResult
                {
                    Status = 200,
                    Message = "You don't have any booking",
                };
            }

            return new ServiceResult
            {
                Status = 200,
                Message = "You have a appointment",
                Data = new SubBookingResponse
                {
                    AppointmentId = getBooking.AppointmentId,
                    BatterySwapStation = new StationSubResponse
                    {
                        StationId = getStation.BatterySwapStationId,
                        StationName = getStation.BatterySwapStationName,
                        StationAddress = getStation.Address,
                    },
                    SubscriptionId = getBooking.SubscriptionId,
                    DateBooking = getBooking.DateBooking,
                    TimeBooking = getBooking.TimeBooking,
                }
            };
        }

        private async Task<int> UpdateStatusBookingAsync(String driverId)
        {
            var getBookingList = await _bookingRepo.GetAllQueryable().Where(book => book.Status == "Processing" && book.UserDriverId == driverId)
                .OrderBy(book => book.DateBooking)
                .ThenBy(book => book.TimeBooking)
                .ToListAsync();
            var getDateNow = DateOnly.FromDateTime(DateTime.UtcNow.ToLocalTime());
            var getTimeNow = TimeOnly.FromDateTime(DateTime.UtcNow.ToLocalTime());
            foreach (var item in getBookingList)
            {
                // Nếu ngày booking nhỏ hơn hôm nay → đã quá hạn => cancel
                if (item.DateBooking < getDateNow)
                {
                    item.Status = "Canceled";
                }
                // Nếu cùng ngày nhưng giờ đã trễ hơn (hoặc bằng)
                else if (item.DateBooking == getDateNow && item.TimeBooking <= getTimeNow)
                {
                    item.Status = "Canceled";
                }

                await _bookingRepo.UpdateAsync(item);
            }

            return await _unitOfWork.SaveChangesAsync();
        }


    }
}
