using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class CancelBookingRequest
    {
        public string BookingId { get; set; }
    }
    public class CreateBookingRequest
    {
        public string StationId { get; set; }
        public string DriverId { get; set; }
        public string Note { get; set; }
        public string SubscriptionId { get; set; }


        [Required(ErrorMessage = "Booking date is required.")]
        public DateOnly DateBooking { get; set; }

        [Required(ErrorMessage = "Booking time is required.")]
        public TimeOnly TimeBooking { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            // Ghép DateOnly + TimeOnly thành DateTime
            var bookingDateTime = DateBooking.ToDateTime(TimeBooking);

            // Nếu bạn đang dùng giờ VN thì dùng Now (local)
            var now = DateTime.Now;

            if (bookingDateTime <= now)
            {
                yield return new ValidationResult(
                    "Booking date and time must be in the future.",
                    new[] { nameof(DateBooking), nameof(TimeBooking) }
                );
            }
        }
    }
    public class BookingResponse
    {
        public string? TransactionId { get; set; }
        public string AppointmentId { get; set; }
        public string DriverId { get; set; }
        public string BatterySwapStationId { get; set; }
        public string Note { get; set; }
        public string SubscriptionId { get; set; }
        public string Status { get; set; }
        public DateOnly DateBooking { get; set; }
        public TimeOnly TimeBooking { get; set; }
        public DateTime CreateBookingAt { get; set; }
    }
    public class SubBookingResponse
    {
        public string AppointmentId { get; set; }
        public StationSubResponse BatterySwapStation { get; set; }
        public string SubscriptionId { get; set; }
        public DateOnly DateBooking { get; set; }
        public TimeOnly TimeBooking { get; set; }
    }

    public class SubBooking
    {
        public string SubId { get; set; }
    }

    public class ViewBookingRequest
    {
        public string StaffId { get; set; }

    }

    public class ViewBookingResponse
    {
        public string BookingId { get; set; }
        public string DriverId { get; set; }
        public string SubcriptionId { get; set; }
        public DateOnly Date { get; set; }
        public string DriverName { get; set; }
        public int NumberBattery { get; set; }
        public string Note { get; set; }
        public string DriverTele { get; set; }
        public TimeOnly TimeBooking { get; set; }
        public string Status { get; set; }
    }
}
