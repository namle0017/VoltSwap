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
    public class RatingRepository : GenericRepositories<Rating>, IRatingRepository
    {
        private VoltSwapDbContext _context;
        public RatingRepository(VoltSwapDbContext context)
        {
            _context = context;
        }

        public async Task<List<Rating>> GetAllRating()
        {
            return await _context.Ratings.Include(u => u.UserDriver).Include(sta => sta.BatterySwapStation).Where(r => r.RatingScore == 5).ToListAsync();
        }
    }
}
