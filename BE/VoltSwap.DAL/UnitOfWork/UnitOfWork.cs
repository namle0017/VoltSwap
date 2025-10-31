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
        private IBatteryRepository? batRepository;
        private IReportRepository? reportRepository;
        private IBookingRepository? bookingRepository;
        private IVehicleRepository? vehicleRepository;
        private IStationStaffRepository? staitonStaffRepository;
        private IPillarSlotRepository? pillarSlotRepository;
        private IPillarRepository? pillarRepository;
        private IFeeRepository? feeRepository;
        private IBatterySessionRepository? batsessionRepository;
        private IReportTypeRepository? reportTypeRepository;


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
        public IBatteryRepository Batteries
        {
            get
            {
                if (batRepository == null)
                {
                    batRepository = (IBatteryRepository)new BatteryRepository(_context);
                }
                return batRepository;
            }
        }
        public IReportRepository Reports
        {
            get
            {
                if (reportRepository == null)
                {
                    reportRepository = (IReportRepository)new ReportRepository(_context);
                }
                return reportRepository;
            }
        }
        public IBookingRepository Bookings
        {
            get
            {
                if (bookingRepository == null)
                {
                    bookingRepository = (IBookingRepository)new BookingRepository(_context);
                }
                return bookingRepository;
            }
        }
        public IVehicleRepository Vehicles
        {
            get
            {
                if (vehicleRepository == null)
                {
                    vehicleRepository = (IVehicleRepository)new VehicleRepository(_context);
                }
                return vehicleRepository;
            }
        }
        public IStationStaffRepository StationStaffs
        {
            get
            {
                if (staitonStaffRepository == null)
                {
                    staitonStaffRepository = (IStationStaffRepository)new StationStaffRepository(_context);
                }
                return staitonStaffRepository;
            }
        }
        public IPillarSlotRepository PillarSlots
        {
            get
            {
                if (pillarSlotRepository == null)
                {
                    pillarSlotRepository = (IPillarSlotRepository)new PillarSlotRepository(_context);
                }
                return pillarSlotRepository;
            }
        }
        public IPillarRepository Pillars
        {
            get
            {
                if (pillarRepository == null)
                {
                    pillarRepository = (IPillarRepository)new PillarRepository(_context);
                }
                return pillarRepository;
            }
        }
        public IFeeRepository Fees
        {
            get
            {
                if (feeRepository == null)
                {
                    feeRepository = (IFeeRepository)new FeeRepository(_context);
                }
                return feeRepository;
            }
        }
        public IBatterySessionRepository BatSession
        {
            get
            {
                if (batsessionRepository == null)
                {
                    batsessionRepository = (IBatterySessionRepository)new BatterySessionRepository(_context);
                }
                return batsessionRepository;
            }
        }
        public IReportTypeRepository ReportType
        {
            get
            {
                if (reportTypeRepository == null)
                {
                    reportTypeRepository = (IReportTypeRepository)new ReportTypeRepository(_context);
                }
                return reportTypeRepository;
            }
        }


    }
}
