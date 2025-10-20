using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Data;
using VoltSwap.DAL.IRepositories;
using VoltSwap.DAL.Models;

namespace VoltSwap.DAL.Repositories
{
    public  class FeeRepository: GenericRepositories<Fee>, IFeeRepository  
    {
        private readonly VoltSwapDbContext _context;

        public FeeRepository(VoltSwapDbContext context) : base(context)
        {
            _context = context;
        }
    }
}
