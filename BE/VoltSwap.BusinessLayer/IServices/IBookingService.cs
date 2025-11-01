using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.Common.DTOs;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IBookingService
    {
        Task<ServiceResult> CreateBookingAsync(CreateBookingRequest request);
        Task<ServiceResult> CancelBookingAsync(CancelBookingRequest request);
        Task<ServiceResult> GetBookingsByStationAndMonthAsync(ViewBookingRequest request);
        Task<ServiceResult> BookingCancelPlanAsync(CreateBookingRequest requestDto);
        Task<bool> CheckBookingExist(string subId);
    }
}
