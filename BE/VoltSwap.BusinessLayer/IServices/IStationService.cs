using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.Common.DTOs;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IStationService
    {
        Task<ServiceResult> GetStationList();
        Task<ServiceResult> GetStationActive();
        Task<IServiceResult> GetBatteryInventoryByStationId(StaffRequest staffRequest);
    }
}
