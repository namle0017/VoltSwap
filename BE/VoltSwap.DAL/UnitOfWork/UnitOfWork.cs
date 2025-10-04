using VoltSwap.DAL.Data;
using VoltSwap.DAL.IRepositories;
using VoltSwap.DAL.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.DAL.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly VoltSwapDbContext _context;
        private IUsersRepositories? userRepository;

        public UnitOfWork(VoltSwapDbContext context)
        {
            _context = context;
        }

        public void Dispose()
        {
            _context.Dispose();
            GC.SuppressFinalize(this);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public IUsersRepositories Users
        {
            get
            {
                if (userRepository == null)
                {
                    userRepository = (IUsersRepositories)new UsersRepositories(_context);
                }
                return userRepository;
            }
        }
    }
}
