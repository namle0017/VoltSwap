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
        private readonly IBatteryService _batService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public PillarSlotService(
            IServiceProvider serviceProvider,
            IGenericRepositories<User> userRepo,
            IGenericRepositories<PillarSlot> slotRepo,
            IGenericRepositories<StationStaff> stationStaffRepo,
            IGenericRepositories<Battery> batRepo,
            IGenericRepositories<BatterySwapStation> stationRepo,
            IBatteryService batService,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _userRepo = userRepo;
            _slotRepo = slotRepo;
            _batRepo = batRepo;
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
                BatteryStatus = slot.BatteryId != null ? slot.Battery.BatteryStatus : "Availables",
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


        private async Task<List<PillarSlot>> GetBatteriesInPillarByPillarIdAsync(String pillarId)
        {
            var pillarSlots = await _slotRepo.GetAllQueryable()
                .Where(slot => slot.BatterySwapPillarId == pillarId)
                .Include(slot => slot.Battery)
                .ToListAsync();
            return pillarSlots;
        }
    }
}
