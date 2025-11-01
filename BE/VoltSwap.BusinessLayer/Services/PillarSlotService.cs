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
    public class PillarSlotService : BaseService, IPillarSlotService
    {
        private readonly IGenericRepositories<User> _userRepo;
        private readonly IGenericRepositories<PillarSlot> _slotRepo;
        private readonly IGenericRepositories<StationStaff> _stationStaffRepo;
        private readonly IGenericRepositories<Battery> _batRepo;
        private readonly IGenericRepositories<BatterySwapStation> _stationRepo;
        private readonly IGenericRepositories<Subscription> _subRepo;
        private readonly IBatteryService _batService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public PillarSlotService(
            IServiceProvider serviceProvider,
            IGenericRepositories<User> userRepo,
            IGenericRepositories<PillarSlot> slotRepo,
            IGenericRepositories<StationStaff> stationStaffRepo,
            IGenericRepositories<Subscription> subRepo,
            IGenericRepositories<Battery> batRepo,
            IGenericRepositories<BatterySwapStation> stationRepo,
            IBatteryService batService,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _userRepo = userRepo;
            _slotRepo = slotRepo;
            _batRepo = batRepo;
            _stationRepo = stationRepo;
            _batService = batService;
            _subRepo = subRepo;
            _stationStaffRepo = stationStaffRepo;
            _stationRepo = stationRepo;
            _batService = batService;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }


        //Hàm này để đưa ra các slot để hiển thị cho giả lập
        public async Task<ServiceResult> GetPillarSlotByStaffId(UserRequest requestDto)
        {
            var pillarSlots = await _stationStaffRepo.GetAllQueryable()
                                .Where(st => st.UserStaffId == requestDto.UserId)
                                .Include(st => st.BatterySwapStation).FirstOrDefaultAsync();
            var getPillarSlots = await _unitOfWork.Stations.GetBatteriesInPillarByStationIdAsync(pillarSlots.BatterySwapStationId);
            var updateBatterySoc = await _batService.UpdateBatterySocAsync();

            var dtoList = pillarSlots.BatterySwapStation.BatterySwapPillars
                        .Select(pillar => new StaffPillarSlotDto
                        {
                            PillarSlotId = pillar.BatterySwapPillarId, // Giả sử pillar.Id là string
                            SlotId = pillar.PillarSlots.Count, // Tổng số slot trong pillar
                            NumberOfSlotEmpty = pillar.PillarSlots.Count(ps => ps.Battery == null),
                            NumberOfSlotRed = pillar.PillarSlots.Count(ps => ps.Battery != null && ps.Battery.Soc <= 20),
                            NumberOfSlotYellow = pillar.PillarSlots.Count(ps => ps.Battery != null && ps.Battery.Soc > 20 && ps.Battery.Soc < 90),
                            NumberOfSlotGreen = pillar.PillarSlots.Count(ps => ps.Battery != null && ps.Battery.Soc >= 90)
                        })
                        .ToList();

            return new ServiceResult
            {
                Status = 200,
                Message = "Successfull",
                Data = dtoList,
            };
        }


        // Nemo: Này là để hiển thị theo pillarSlotId
        public async Task<ServiceResult> GetBatteryInPillar(string pillarId)
        {
            var updateBatterySoc = await _batService.UpdateBatterySocAsync();
            var pillarSlots = await GetBatteriesInPillarByPillarIdAsync(pillarId);
            var getStationId = await _unitOfWork.Stations.GetStationByPillarId(pillarId);
            var dtoList = pillarSlots.Select(slot => new PillarSlotDto
            {
                SlotId = slot.SlotId,
                BatteryId = slot.BatteryId,
                SlotNumber = slot.SlotNumber,
                StationId = getStationId.BatterySwapStationId,
                PillarStatus = slot.PillarStatus,
                BatteryStatus = slot.BatteryId != null ? slot.Battery.BatteryStatus : "Available",
                BatterySoc = slot.BatteryId != null ? slot.Battery.Soc : 0,
                BatterySoh = slot.BatteryId != null ? slot.Battery.Soh : 0,
            }).ToList();

            return new ServiceResult
            {
                Status = 200,
                Message = "Get battery in pillar successfull",
                Data = dtoList
            };

        }


        public async Task<List<PillarSlot>> GetBatteriesInPillarByPillarIdAsync(String pillarId)
        {
            var pillarSlots = await _slotRepo.GetAllQueryable()
                .Where(slot => slot.BatterySwapPillarId == pillarId)
                .Include(slot => slot.Battery)
                .ToListAsync();
            return pillarSlots;
        }

        //Bin: lay pin tu tru ra 
        public async Task<ServiceResult> TakeOutBatteryInPillar(TakeBattteryInPillarRequest request)
        {
            var stationstaff = await _unitOfWork.StationStaffs.GetStationWithStaffIdAsync(request.StaffId);
            if (stationstaff == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Station staff not found",
                };
            }
            var slotwithbattery = await _unitOfWork.PillarSlots.GetSlotWithBattery(request.PillarSlotId, request.BatteryId);
            if (slotwithbattery == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Pillar slot not found or no battery in slot",
                };
            }
            slotwithbattery.BatteryId = null;
            slotwithbattery.PillarStatus = "Available";
            slotwithbattery.UpdateAt = DateTime.UtcNow.ToLocalTime();
            await _unitOfWork.PillarSlots.UpdateAsync(slotwithbattery);
            await _unitOfWork.SaveChangesAsync();

            var battery = await _unitOfWork.Batteries.FindingBatteryById(request.BatteryId);
            battery.BatteryStatus = "Warehouse";
            battery.UpdateAt = DateTime.UtcNow.ToLocalTime();
            await _unitOfWork.Batteries.UpdateAsync(battery);
            await _unitOfWork.SaveChangesAsync();
            var slotdtos = new TakeBattteryInPillarRespone
            {
                StaffId = stationstaff.UserStaffId,
                StationId = stationstaff.BatterySwapStationId,
                PillarId = slotwithbattery.BatterySwapPillarId,
                PillarSlotId = slotwithbattery.SlotId,
                BatteryId = battery.BatteryId
            };

            var result = new ServiceResult
            {
                Status = 200,
                Message = "Take out battery in pillar successfull",
                Data = slotdtos
            };
            return result;
        }


        //Bin: hàm này để đưa pin trong kho vào trụ
        public async Task<ServiceResult> PlaceBatteryInPillarAsync(PlaceBattteryInPillarRequest requestDto)
        {
            var stationstaff = await _unitOfWork.StationStaffs.GetStationWithStaffIdAsync(requestDto.StaffId);
            if (stationstaff == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Station staff not found",
                };
            }
            var slotempty = await _unitOfWork.PillarSlots.GetEmptySlot(requestDto.PillarSlotId);
            if (slotempty == null || slotempty.BatteryId != null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Pillar slot not found or not empty",
                };
            }

            var battery = await _unitOfWork.Batteries.FindingBatteryInventoryById(requestDto.BatteryWareHouseId, stationstaff.BatterySwapStationId);
            if (battery == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Battery not found in inventory",
                };
            }

            slotempty.BatteryId = battery.BatteryId;
            slotempty.PillarStatus = "Unavailable";

            slotempty.UpdateAt = DateTime.UtcNow.ToLocalTime();
            if (battery.Soc == 100)
            {
                battery.BatteryStatus = "Available";
                battery.UpdateAt = DateTime.UtcNow.ToLocalTime();
            }
            else
            {
                battery.BatteryStatus = "Charging";
                battery.UpdateAt = DateTime.UtcNow.ToLocalTime();
            }
            await _unitOfWork.PillarSlots.UpdateAsync(slotempty);
            await _unitOfWork.Batteries.UpdateAsync(battery);
            await _unitOfWork.SaveChangesAsync();

            var slotdtos = new PlaceBattteryInPillarRespone
            {
                StaffId = stationstaff.UserStaffId,
                StationId = stationstaff.BatterySwapStationId,
                PillarId = slotempty.BatterySwapPillarId,
                PillarSlotId = slotempty.SlotId,
                BatteryWareHouseId = battery.BatteryId
            };


            var result = new ServiceResult
            {
                Status = 200,
                Message = "Place battery in pillar successfull",
                Data = slotdtos
            };
            return result;

        }
        //Bin: xem các slot đã có booking và khóa 
        public async Task<ServiceResult> GetLockedPillarSlotByStaffId(UserRequest requestDto)
        {
            var stationStaff = await _stationStaffRepo.GetAllQueryable()
                                .Where(st => st.UserStaffId == requestDto.UserId)
                                .Include(st => st.BatterySwapStation).FirstOrDefaultAsync();
            var lockedSlots = await _slotRepo.GetAllQueryable()
                                .Include(ps => ps.BatterySwapPillar)
                                .Where(ps => ps.BatterySwapPillar.BatterySwapStationId == stationStaff.BatterySwapStationId
                                   && ps.AppointmentId != null)
                                .ToListAsync();
            var dtoList = lockedSlots.Select(slot => new LockedPillarSlotDto
            {
                SlotId = slot.SlotId,
                StaitonId = slot.BatterySwapPillar.BatterySwapStationId,
                PillarId = slot.BatterySwapPillarId,
                AppointmentId = slot.AppointmentId,
                SlotNumber = slot.SlotNumber,
            }).ToList();
            return new ServiceResult
            {
                Status = 200,
                Message = "Successfull",
                Data = dtoList,
            };
        }

        //Bin: hàm để Lock pin khi booking xog
        public async Task<List<PillarSlotDto>> LockSlotsAsync(string stationId, string subscriptionId, string bookingId)
        {
            var result = new List<PillarSlotDto>();
            //1. Tìm subId có đúng không
            var subscription = await _subRepo.GetByIdAsync(subscriptionId);
            if (subscription == null)
                return result;
            //2. Lấy số pin có trong subId đó
            var requiredBatteries = await _unitOfWork.Subscriptions.GetBatteryCountBySubscriptionIdAsync(subscriptionId);
            if (requiredBatteries <= 0)
                return result;
            //3. Lấy các pillar có trong trạm
            var pillars = await _unitOfWork.Pillars.GetAllAsync(p => p.BatterySwapStationId == stationId);

            foreach (var pillar in pillars)
            {
                //4. Lấy các slot phù hợp có trong trụ
                var availableSlots = await _unitOfWork.PillarSlots.GetAvailableSlotsByPillarAsync(pillar.BatterySwapPillarId);


                if (availableSlots.Count >= requiredBatteries)
                {
                    var slotsToLock = availableSlots
                                      .Take(requiredBatteries)
                                      .ToList();

                    foreach (var slot in slotsToLock)
                    {
                        slot.PillarStatus = "Lock";
                        slot.AppointmentId = bookingId;
                        await _unitOfWork.PillarSlots.UpdateAsync(slot);
                        await _unitOfWork.SaveChangesAsync();
                        result.Add(new PillarSlotDto
                        {
                            SlotId = slot.SlotId,
                            BatteryId = slot.BatteryId,
                            SlotNumber = slot.SlotNumber,
                            StationId = stationId,
                            PillarId = slot.BatterySwapPillarId,
                            PillarStatus = slot.PillarStatus,
                            BatteryStatus = slot.Battery.BatteryStatus,
                            BatterySoc = slot.Battery.Soc,
                            BatterySoh = slot.Battery.Soh
                        });
                    }
                    break;
                }
            }

            return result;
        }
    }
}
