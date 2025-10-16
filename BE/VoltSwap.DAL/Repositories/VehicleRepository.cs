using Microsoft.EntityFrameworkCore;
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
    public class VehicleRepository : GenericRepositories<DriverVehicle>, IVehicleRepository
    {
        private readonly VoltSwapDbContext _context;

        public VehicleRepository(VoltSwapDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<List<DriverVehicle>> GetDriverVehiclesByUserIdAsync(string userId)
        {
            var getVehicle = await _context.DriverVehicles.Where(vehicle => vehicle.UserDriverId == userId).ToListAsync();
            
            return getVehicle;

        }

    
    }
}
