using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;
using VoltSwap.DAL.UnitOfWork;

namespace VoltSwap.BusinessLayer.Services
{
    public class BatteryService : BaseService, IBatteryService
    {
        private readonly IGenericRepositories<Battery> _batRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public BatteryService(
            IServiceProvider serviceProvider,
            IGenericRepositories<Battery> batRepo,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _batRepo = batRepo;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }


        public async Task<int> UpdateBatterySocAsync()
        {
            var getDateTimeNow = DateTime.UtcNow.ToLocalTime();
            var getBatteryCharging = await _unitOfWork.Batteries.GetAllQueryable().Where(bat => bat.BatteryStatus == "Charging").ToListAsync();

            foreach (var item in getBatteryCharging)
            {
                TimeSpan duration = (TimeSpan)(getDateTimeNow - item.UpdateAt);
                double increased = duration.TotalMinutes / 10.0;
                decimal totalSoc = item.Soc + (decimal)increased;
                if (totalSoc > 100)
                {
                    totalSoc = 100;
                    item.BatteryStatus = "Available";
                }
                item.UpdateAt = getDateTimeNow;
                item.Soc = totalSoc;
                await _batRepo.UpdateAsync(item);
            }

            return await _unitOfWork.SaveChangesAsync();
        }
    }
}
