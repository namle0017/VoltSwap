using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Models;

namespace VoltSwap.DAL.IRepositories
{
    public interface IReportRepository
    {
        Task<string> GetDriverContact(String driverId);

        Task<List<Report>> GetReportForStaff(string staffId);
    }
}
