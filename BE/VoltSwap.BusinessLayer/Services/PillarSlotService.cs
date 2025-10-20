using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.DAL.UnitOfWork;

namespace VoltSwap.BusinessLayer.Services
{
    public  class PillarSlotService : BaseService , IPillarSlotService
    {
        private readonly IUnitOfWork _uow;

        public PillarSlotService(IServiceProvider sp, IUnitOfWork uow) : base(sp)
        {
            _uow = uow;
        }
    }
}
