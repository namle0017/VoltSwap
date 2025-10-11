using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.DTO;
using VoltSwap.DAL.Models;

namespace VoltSwap.BusinessLayer.Services
{
    public class PlanService : IPlanService
    {
        private readonly IGenericRepositories<Plan> _planRepo;

        public PlanService(IGenericRepositories<Plan> planRepo)
        {
            _planRepo = planRepo;
        }

        public async Task<PagedResult<Plan>> Get(QueryOptions<Plan> queryOptions)
        {
            return await _planRepo.GetAllDataByExpression(queryOptions);
        }
    }
}
