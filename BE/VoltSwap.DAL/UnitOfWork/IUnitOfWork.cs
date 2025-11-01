using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Data;
using VoltSwap.DAL.IRepositories;
using VoltSwap.DAL.Repositories;

namespace VoltSwap.DAL.UnitOfWork
{
    public interface IUnitOfWork : IDisposable // quan ly bo nho
    {
        Task<int> SaveChangesAsync();
        IUsersRepositories Users { get; }
        ISubscriptionRepository Subscriptions { get; }
        IBatterySwapRepository BatterySwap { get; }
        IStationRepository Stations { get; }
        IPlanRepository Plans { get; }
        ITransactionRepository Trans { get; }
        IBatteryRepository Batteries { get; }
        IReportRepository Reports { get; }
        IBookingRepository Bookings { get; }
        IVehicleRepository Vehicles { get; }
        IStationStaffRepository StationStaffs { get; }
        IPillarSlotRepository PillarSlots { get; }
        IPillarRepository Pillars { get; }
        IFeeRepository Fees { get; }
        IBatterySessionRepository BatSession { get; }
        IReportTypeRepository ReportType { get; }


    }
}
