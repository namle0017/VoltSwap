using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.Common.DTOs;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IPlanService
    {
        Task<ServiceResult> GetPlanAsync();
        Task<int> GetDurationDays(string planId);
    }
}
