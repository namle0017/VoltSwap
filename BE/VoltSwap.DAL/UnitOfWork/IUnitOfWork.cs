using VoltSwap.DAL.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.IRepositories;

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
    }
}
