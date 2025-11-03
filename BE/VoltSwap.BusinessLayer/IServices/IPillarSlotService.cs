using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Models;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IPillarSlotService
    {
        Task<ServiceResult> GetPillarSlotByStaffId(UserRequest requestDto);
        Task<List<PillarSlot>> GetBatteriesInPillarByPillarIdAsync(String pillarId);
        Task<List<PillarSlotDto>> LockSlotsAsync(string stationId, string subscriptionId, string bookingId);
    }
}
