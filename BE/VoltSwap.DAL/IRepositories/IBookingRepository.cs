using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;

namespace VoltSwap.DAL.IRepositories
{
    public interface IBookingRepository: IGenericRepositories<Appointment>

    {
        Task<Appointment?> GetNotDoneriptionIdAsync(string subscriptionId);

        Task<Appointment> GetBookingCancelBySubId(string subId);
        Task<Appointment> GetBookingBySubId(string subId);
    }
}
