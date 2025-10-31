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
    public class StationService : BaseService, IStationService
    {
        private readonly IGenericRepositories<BatterySwapStation> _stationRepo;
        private readonly IGenericRepositories<Battery> _batteryRepo;
        private readonly IGenericRepositories<StationStaff> _staRepo;
        private readonly IBatteryService _batService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public StationService(
            IServiceProvider serviceProvider,
            IGenericRepositories<BatterySwapStation> stationRepo,
            IGenericRepositories<Battery> batteryRepo,
            IGenericRepositories<StationStaff> staRepo,
            IBatteryService batService,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _stationRepo = stationRepo;
            _batteryRepo = batteryRepo;
            _batService = batService;
            _staRepo = staRepo;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }

        public async Task<ServiceResult> GetStationList()
        {
            var stationList = await _unitOfWork.Stations.GetAllAsync(station => station.Status == "Active");
            var availableBatteries = await _unitOfWork.Stations.GetBatteriesByStationAsync();
            var stationAvailableList = stationList
            .Select(station =>
            {
                var batteryCount = availableBatteries.Count(b => b.BatterySwapPillar.BatterySwapStationId == station.BatterySwapStationId);
                var percent = ((double)batteryCount / (double)(station.NumberOfPillar * 20)) * 100;

                return new StationListResponse
                {
                    StationId = station.BatterySwapStationId,
                    StationName = station.BatterySwapStationName,
                    StationAddress = station.Address,
                    LocationLat = station.LocationLat,
                    LocationLon = station.LocationLng,
                    BatteryAvailable = batteryCount,
                    AvailablePercent = percent,
                    TotalBattery = station.NumberOfPillar * 20,
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

        //Hàm để lấy danh sách các trạm đang hoạt động cho admin để đổi pin 
        public async Task<ServiceResult> GetActiveStation()
        {
            // B1: Lấy danh sách trạm active
            var stationList = await _unitOfWork.Stations
                .GetAllAsync(station => station.Status == "Active");

            // B2: Tạo danh sách kết quả
            var activeStationList = new List<StationActiveListReponse>();

            // B3: Duyệt từng trạm, await từng cái một → an toàn với DbContext
            foreach (var station in stationList)
            {
                var batteryList = await GetBatteryInventoryByStationIdForAdmin(station.BatterySwapStationId);

                activeStationList.Add(new StationActiveListReponse
                {
                    StationId = station.BatterySwapStationId,
                    StationName = station.BatterySwapStationName,
                    BatteryList = batteryList
                });
            }

            // B4: Gán cho cả 2 bên (trái/phải)
            var getList = new ListStationForTransferResponse
            {
                ActiveStationsLeft = activeStationList,
                ActiveStationsRight = activeStationList
            };

            // B5: Trả về thành công
            return new ServiceResult
            {
                Status = 200,
                Message = "Get list success",
                Data = getList
            };
        }

        public async Task<ServiceResult> GetBatteryInStation(string stationId)
        {
            var result = await _unitOfWork.Stations.GetBatteriesByStationIdAsync(stationId);
            var batteryInStationList = result.Select(bat => new BatResponse
            {
                BatteryId = bat.BatteryId,
                Soc = bat.Soc,
                Soh = bat.Soh,
                Status = bat.BatteryStatus,
                StationId = bat.BatterySwapStationId,
                Capacity = bat.Capacity,

            });
            return new ServiceResult
            {
                Status = 200,
                Message = "Successful",
                Data = batteryInStationList,
            };
        }

        public async Task<ServiceResult> GetStationActive()
        {
            var stationList = await _unitOfWork.Stations.GetStationActive();
            var newList = stationList.Select(station => new StationActiveReponse
            {
                StationId = station.BatterySwapStationId,
                StationName = station.BatterySwapStationName,
            }).ToList();
            return new ServiceResult
            {
                Status = 200,
                Message = "Successful",
                Data = newList
            };
        }

        //Bin: Lấy số lượng batttery inventory của trạm
        public async Task<IServiceResult> GetBatteryInventoryByStationId(StaffRequest staffRequest)
        {
            var checkExist = await _unitOfWork.Users.AnyAsync(ss => ss.UserId == staffRequest.StaffId && ss.Status == "Active");
            if (!checkExist)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Staff not found or Inactive Staff",
                };
            }
            var getstaion = await _unitOfWork.StationStaffs.GetStationWithStaffIdAsync(staffRequest.StaffId);
            var batteryInventory = await _unitOfWork.Batteries.GetBatteriesInventoryByStationId(getstaion.BatterySwapStationId);
            var station = await _stationRepo.GetByIdAsync(getstaion.BatterySwapStationId);
            var batteryInventoryDto = batteryInventory.Select(bat => new BatResponse
            {
                BatteryId = bat.BatteryId,
                StationId = bat.BatterySwapStationId,
                StationName = station.BatterySwapStationName,
                Soc = bat.Soc,
                Soh = bat.Soh,
                Capacity = bat.Capacity,
                Status = bat.BatteryStatus
            }).ToList();

            return new ServiceResult
            {
                Status = 200,
                Message = "Get battery inventory successfully",
                Data = batteryInventoryDto
            };
        }

        //Nemo: Lấy số lượng batttery inventory của trạm
        public async Task<List<BatResponse>> GetBatteryInventoryByStationIdForAdmin(string stationId)
        {
            var batteryInventory = await _unitOfWork.Batteries.GetBatteriesInventoryByStationId(stationId);
            var batteryInventoryDto = batteryInventory.Select(bat => new BatResponse
            {
                BatteryId = bat.BatteryId,
                StationId = bat.BatterySwapStationId,
                Soc = bat.Soc,
                Soh = bat.Soh,
                Capacity = bat.Capacity,
                Status = bat.BatteryStatus
            }).ToList();

            return batteryInventoryDto;
        }

        //Bin: Search Battery in Station by StaffId
        public async Task<IServiceResult> SearchBatteryInStationByStaffId(StaffRequest staffRequest, string batteryId)
        {
            var checkExist = await _unitOfWork.Users.AnyAsync(ss => ss.UserId == staffRequest.StaffId && ss.Status == "Active");
            if (!checkExist)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Staff not found or Inactive Staff",
                };
            }
            var getstaion = await _unitOfWork.StationStaffs.GetStationWithStaffIdAsync(staffRequest.StaffId);
            var battery = await _unitOfWork.Batteries.FindingBatteryById(batteryId);
            if (battery == null || battery.BatterySwapStationId != getstaion.BatterySwapStationId || battery.BatteryStatus != "Warehouse")
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Battery not found in your station warehouse",
                };
            }
            var batteryDto = new BatResponse
            {
                BatteryId = battery.BatteryId,
                StationId = battery.BatterySwapStationId,
                Soc = battery.Soc,
                Soh = battery.Soh,
                Capacity = battery.Capacity,
                Status = battery.BatteryStatus
            };
            return new ServiceResult
            {
                Status = 200,
                Message = "Search battery successfully",
                Data = batteryDto
            };
        }

        public async Task<BatteryStatusResponse> GetNumberOfBatteryStatusAsync(string staffId)
        {
            var updateBatSoc = await _batService.UpdateBatterySocAsync();
            var getBatResponse = await GetBatteryByStaffId(staffId);
            if (getBatResponse == null)
            {
                return new BatteryStatusResponse();
            }
            var getNumberOfBatStatus = new BatteryStatusResponse();
            foreach (var item in getBatResponse)
            {
                if (item.Status.Equals("Available"))
                {
                    getNumberOfBatStatus.NumberOfBatteryFully += 1;
                }
                else if (item.Status.Equals("Maintenance"))
                {
                    getNumberOfBatStatus.NumberOfBatteryMaintenance += 1;
                }
                else if (item.Status.Equals("Charging"))
                {
                    getNumberOfBatStatus.NumberOfBatteryCharging += 1;
                }
                else if (item.Status.Equals("Warehouse"))
                {
                    getNumberOfBatStatus.NumberOfBatteryInWarehouse += 1;
                }
            }

            return getNumberOfBatStatus;
        }

        public async Task<List<BatResponse>> GetBatteryByStaffId(string staffId)
        {
            var getStation = await _unitOfWork.StationStaffs.GetStationWithStaffIdAsync(staffId);
            if (getStation == null)
            {
                return new List<BatResponse>();
            }
            var getBattery = await _unitOfWork.Stations.GetBatteriesByStationIdAsync(getStation.BatterySwapStationId);
            Console.WriteLine($"DB returned: {getBattery.Count} batteries");
            return getBattery.Select(x => new BatResponse
            {
                BatteryId = x.BatteryId,
                Status = x.BatteryStatus,
                Soc = x.Soc,
                Soh = x.Soh,
                Capacity = x.Capacity,
                StationId = x.BatterySwapStationId,
            }).ToList();
        }

        public async Task<StationOverviewResponse> GetStationOverviewAsync()
        {
            var getStaiton = await _unitOfWork.Stations.GetAllAsync();
            var activeStation = await _stationRepo.GetAllQueryable()
                                .Where(st => st.Status == "Active")
                                .CountAsync();
            var totalStation = getStaiton.Count();

            if (totalStation == 0)
            {
                return new StationOverviewResponse();
            }

            return new StationOverviewResponse
            {
                ActiveStation = activeStation,
                TotalStation = totalStation,
            };
        }


        //Bin: lấy list Battery Swap trong ngày của trạm
        //public async Task<IServiceResult> BatterySwapListAsync(StaffRequest request)
        //{
        //    var checkExist = await _unitOfWork.Users.AnyAsync(ss => ss.UserId == request.StaffId && ss.Status == "Active");
        //    if (!checkExist)
        //    {
        //        return new ServiceResult
        //        {
        //            Status = 404,
        //            Message = "Staff not found or Inactive Staff",
        //        };
        //    }
        //    var getstaion = await _unitOfWork.StationStaffs.GetStationWithStaffIdAsync(request.StaffId);
        //    var getbatteryswap = _unitOfWork.BatterySwap.GetByIdAsync(getstaion.BatterySwapStationId);
        //    var result = new 


        //}

    }
}
