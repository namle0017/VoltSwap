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
            return await _context.Users.FirstOrDefaultAsync(x => x.UserEmail == email);
        }

        public async Task<User?> GetAdminAsync()
        {

            return await _context.Users.FirstOrDefaultAsync(x => x.UserRole == "Admin");
        }

        public async Task<User> CheckUserActive(string userEmail)
        {
            return await _context.Users.FirstOrDefaultAsync(x => x.UserEmail == userEmail && x.Status == "Active");
        }

        public async Task<User?> GetUserAsync(string email, string password_hash)
        {
            return await _context.Users.FirstOrDefaultAsync(x => x.UserEmail == email && x.UserPasswordHash == password_hash);
        }
    }
}
