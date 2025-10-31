using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.Common.DTOs;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IOverviewService
    {
        Task<IServiceResult> StaffOverviewAsync(UserRequest requestDto);
        Task<IServiceResult> AdminOverviewAsync();

        Task<ServiceResult> GetUserSubscriptionsAsync(CheckSubRequest request);
    }
}
