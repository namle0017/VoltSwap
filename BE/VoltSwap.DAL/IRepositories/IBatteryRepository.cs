using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;

namespace VoltSwap.DAL.IRepositories
{
    public interface IBatteryRepository : IGenericRepositories<Battery>
    {
        Task<List<Battery>> GetNumberOfBatteries();
        Task<Battery> FindingBatteryById(String batId);
        Task<List<Battery>> GetBatteriesInventoryByStationId(string StaffId);
        Task<Battery> FindingBatteryInventoryById(String batId, string stationId);
    }
}
