using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using static VoltSwap.Common.DTOs.FeeDtos;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IFeeService
    {
        Task<ServiceResult> UpdateFeesByGroupKeyAsync(UpdateFeeGroupRequest request);
    }
}
