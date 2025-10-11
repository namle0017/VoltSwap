using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.DTO;
using VoltSwap.DAL.Models;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IPlanService
    {
        Task<PagedResult<Plan>> Get(QueryOptions<Plan> queryOptions);
    }
}
