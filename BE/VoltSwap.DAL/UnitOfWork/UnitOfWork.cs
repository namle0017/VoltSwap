using VoltSwap.DAL.Data;
using VoltSwap.DAL.IRepositories;
using VoltSwap.DAL.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.DAL.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly VoltSwapDbContext _context;
        private IUsersRepositories? userRepository;
        private ISubscriptionRepository? subRepository;
        private IBatterySwapRepository? batSwapRepository;
        private IStationRepository? stationRepository;
        private IPlanRepository? planRepository;
        private ITransactionRepository? transRepository;

        public UnitOfWork(VoltSwapDbContext context)
        {
            _context = context;
        }

        public void Dispose()
        {
            _context.Dispose();
            GC.SuppressFinalize(this);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public IUsersRepositories Users
        {
            get
            {
                if (userRepository == null)
                {
                    userRepository = (IUsersRepositories)new UsersRepositories(_context);
                }
                return userRepository;
            }
        }
        public ISubscriptionRepository Subscriptions
        {
            get
            {
                if (subRepository == null)
                {
                    subRepository = (ISubscriptionRepository)new SubscriptionRepository(_context);
                }
                return subRepository;
            }
        }
        public IStationRepository Stations
        {
            get
            {
                if (stationRepository == null)
                {
                    stationRepository = (IStationRepository)new StationRepository(_context);
                }
                return stationRepository;
            }
        }
        public IBatterySwapRepository BatterySwap
        {
            get
            {
                if (batSwapRepository == null)
                {
                    batSwapRepository = (IBatterySwapRepository)new BatterySwapRepository(_context);
                }
                return batSwapRepository;
            }
        }

        public IPlanRepository Plans
        {
            get
            {
                if (planRepository == null)
                {
                    planRepository = (IPlanRepository)new PlanRepository(_context);
                }
                return planRepository;
            }
        }

        public ITransactionRepository Trans
        {
            get
            {
                if (transRepository == null)
                {
                    transRepository = (ITransactionRepository)new TransactionRepository(_context);
                }
                return transRepository;
            }
        }
    }
}
