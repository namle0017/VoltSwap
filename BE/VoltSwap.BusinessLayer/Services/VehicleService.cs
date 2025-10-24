using Microsoft.EntityFrameworkCore;
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
    public  class VehicleService : BaseService , IVehicleService
    {
        private readonly IVehicleService _vehicleService;
        private readonly IGenericRepositories<DriverVehicle> _vehicleRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;

        public VehicleService(
            IServiceProvider serviceProvider,
            IGenericRepositories<DriverVehicle> vehicleRepo,
            IUnitOfWork unitOfWork,
            IConfiguration configuration ) : base(serviceProvider)
        {
           _vehicleRepo = vehicleRepo; 
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }
        public async Task<ServiceResult> CreateDriverVehicleAsync(CreateDriverVehicleRequest request)
        {
            var checkExistVehicle = await _unitOfWork.Vehicles.GetAllQueryable()
                .FirstOrDefaultAsync(vehicle => vehicle.UserDriverId == request.DriverId && vehicle.Vin == request.VIN);
            if (checkExistVehicle != null)
            {
                return new ServiceResult
                {
                    Status = 409,
                    Message = "Vehicle already exists for the Driver."
                };
            }
            var newVehicle = new DriverVehicle
            {
                UserDriverId = request.DriverId,
                Vin =  request.VIN,
                VehicleModel = request.VehicleModel,
                NumberOfBattery = request.NumberOfBat,
                CreatedAt = DateTime.UtcNow.ToLocalTime(),
            };
            await _unitOfWork.Vehicles.CreateAsync(newVehicle);
            await _unitOfWork.SaveChangesAsync();
            return new ServiceResult
            {
                Status = 201,
                Message = "Vehicle added successfully."
            };
        }

        public async Task<ServiceResult> DeleteDriverVehicleAsync(CheckDriverVehicleRequest request)
        {
            var getVehicle = await _unitOfWork.Vehicles.GetAllQueryable().FirstOrDefaultAsync(vehicle => vehicle.UserDriverId == request.UserDriverId && vehicle.Vin == request.VIN);

            if (getVehicle == null )
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "No Vehicle found for the Driver."
                };
            }
            _unitOfWork.Vehicles.RemoveAsync(getVehicle);
            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = $"{getVehicle.Vin} has been deleted"
            };

        }
        

        
        public async Task<ServiceResult> GetUserVehiclesAsync(CheckDriverRequest request)
        {
            var getDriver = await _unitOfWork.Vehicles.GetDriverVehiclesListByUserIdAsync(request.UserDriverId);
            var plans = await _unitOfWork.Plans.GetAllAsync();

            if(getDriver == null || !getDriver.Any())
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "No Vehicle found for the Driver."
                };
            }

            var vehicleDtos = getDriver.Select( vehicle =>
              { var matchPlan = plans
                                .Where(plan => plan.NumberOfBattery == vehicle.NumberOfBattery)
                                .Select(Plan => Plan.PlanName)
                                .ToList();

                  return new VehicleRespone
                  {


                      VIN = vehicle.Vin,
                      VehicleModel = vehicle.VehicleModel,
                      NumberOfBattery = vehicle.NumberOfBattery,
                      recommendPlan = matchPlan,
                      CreatedAt = vehicle.CreatedAt,
                  };
            }).ToList();



            return new ServiceResult
            {
                Status = 200,
                Message = "Vehicle List",
                Data = vehicleDtos
            };
        }
    }
}
