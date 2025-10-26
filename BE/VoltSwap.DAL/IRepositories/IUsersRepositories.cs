using VoltSwap.DAL.Base;
using VoltSwap.DAL.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Models;

namespace VoltSwap.DAL.IRepositories
{
    public interface IUsersRepositories : IGenericRepositories<User>
    {
        Task<User?> GetByEmailAsync(String email);
        Task<User?> GetUserAsync(string email, string password_hash);
        Task<User?> GetAdminAsync();
        Task<User> CheckUserActive(string email);
        Task<int> GetNumberOfDriverAsync();
        Task<List<User>> GetStaffWithStationAsync();
        Task<List<User>> GetAllUsersAsync();

        Task<User> CheckUserActiveById(string userId);
    }
}
