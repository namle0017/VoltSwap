using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IVehicleService 
    {
        Task<ServiceResult> CreateDriverVehicleAsync(CreateDriverVehicleRequest request);
        Task<ServiceResult> DeleteDriverVehicleAsync(CheckDriverVehicleRequest request);
        Task<ServiceResult> GetUserVehiclesAsync(CheckDriverRequest request);

    }
}
