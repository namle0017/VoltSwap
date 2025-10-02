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
        IUsersRepositories UsersRepository { get; }
    }
}
