using VoltSwap.DAL.Base;
using VoltSwap.DAL.Data;
using VoltSwap.DAL.IRepositories;
using VoltSwap.DAL.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.DAL.Repositories
{
    public class UsersRepositories(VoltSwapDbContext context) : GenericRepositories<User>(context)
    {
         
    }
}
