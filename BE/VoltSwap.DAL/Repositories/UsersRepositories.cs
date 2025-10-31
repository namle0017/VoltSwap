using VoltSwap.DAL.Base;
using VoltSwap.DAL.Data;
using VoltSwap.DAL.IRepositories;
using VoltSwap.DAL.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace VoltSwap.DAL.Repositories
{
    public class UsersRepositories : GenericRepositories<User>, IUsersRepositories
    {
        private readonly VoltSwapDbContext _context;

        public UsersRepositories(VoltSwapDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(x => x.UserEmail == email && x.Status == "Active");
        }

        public async Task<User?> GetAdminAsync()
        {

            return await _context.Users.FirstOrDefaultAsync(x => x.UserRole == "Admin");
        }

        public async Task<User> CheckUserActive(string userEmail)
        {
            return await _context.Users.FirstOrDefaultAsync(x => x.UserEmail == userEmail && x.Status == "Active");
        }
        public async Task<User> CheckUserActiveById(string userId)
        {
            return await _context.Users.FirstOrDefaultAsync(x => x.UserId == userId && x.Status == "Active");
        }

        public async Task<User?> GetUserAsync(string email, string password_hash)
        {
            return await _context.Users.FirstOrDefaultAsync(x => x.UserEmail == email && x.UserPasswordHash == password_hash);
        }

        public async Task<int> GetNumberOfDriverAsync()
        {
            return await _context.Users.CountAsync(x => x.UserRole == "Driver" && x.Status == "Active");
        }

        //Đây là hàm để lấy danh sách các staff cùng với Station mà người đó đang làm thông qua bảng StaffStation
        public async Task<List<User>> GetStaffWithStationAsync()
        {
            return await _context.Users
                .Include(u => u.StationStaffs) // Include the navigation property to StationStaffs
                .ThenInclude(ss => ss.BatterySwapStation) // Then include the related BatterySwapStation
                .Where(u => u.UserRole == "Staff" && u.Status == "Active")
                .ToListAsync();
        }

        //Bin: Lấy danh sách tất cả user
        public async Task<List<User>> GetAllUsersAsync()
        {
            return await _context.Users
                                .Include(v => v.DriverVehicles)
                                .Include(sub => sub.Subscriptions)
                                .Where(u => u.UserRole == "Driver" && u.Status == "Active")
                                .ToListAsync();
        }

    }
}
