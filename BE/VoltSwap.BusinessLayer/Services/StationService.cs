using Microsoft.Extensions.Configuration;
using System;
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
    public class StationService : BaseService, IStationService
    {
        private readonly IGenericRepositories<BatterySwapStation> _stationRepo;
        private readonly IGenericRepositories<Battery> _batteryRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public StationService(
            IServiceProvider serviceProvider,
            IGenericRepositories<BatterySwapStation> stationRepo,
            IGenericRepositories<Battery> batteryRepo,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _stationRepo = stationRepo;
            _batteryRepo = batteryRepo;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }

        public async Task<ServiceResult> GetStationList()
        {
            var stationList = await _unitOfWork.Stations.GetAllAsync(station => station.Status== "Active");
            var availableBatteries = await _unitOfWork.Stations.GetBatteriesByStationAsync();
            var stationAvailableList = stationList
            .Select(station =>
            {
                var batteryCount = availableBatteries.Count(b => b.BatterySwapPillar.BatterySwapStationId == station.BatterySwapStationId);
                var percent = ((double)batteryCount / (double)(station.NumberOfPillar*20))*100;

                return new StationListResponse
                {
                    StationId = station.BatterySwapStationId,
                    StationName = station.BatterySwapStationName,
                    StationAddress = station.Address,
                    BatteryAvailable = batteryCount,
                    AvailablePercent = percent,
                    TotalBattery = station.NumberOfPillar*20,
                };
            })
            .Where(s => s.AvailablePercent > 0)
            .ToList();

            return new ServiceResult
            {
                Status = 200,
                Message = "Successful",
                Data = stationAvailableList
            };
        }
    }
}
