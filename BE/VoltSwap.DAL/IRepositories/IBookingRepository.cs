using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Models;

namespace VoltSwap.DAL.IRepositories
{
    public  interface IBookingRepository
    {
        Task<Appointment> CreateAsync(Appointment appointment);
    }
}
