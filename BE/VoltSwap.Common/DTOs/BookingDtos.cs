using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class CreateBookingRequest
    {
        public string StationId { get; set; }
        public string DriverId { get; set; }
        public string Note { get; set; }
        public string SubscriptionId { get; set; }
        public DateOnly DateBooking { get; set; }
        public TimeOnly TimeBooking { get; set; }


    }
    public class BookingResponse
    {
        public string AppointmentId { get; set; }
        public string BatterySwapStationId { get; set; }
        public string SubscriptionId { get; set; }
        public DateOnly DateBooking { get; set; }
        public TimeOnly TimeBooking { get; set; }
        public string Status { get; set; }
        public DateTime CreateBookingAt { get; set; }
    }
}
