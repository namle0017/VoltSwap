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
        private readonly IBatteryService _batService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public PillarSlotService(
            IServiceProvider serviceProvider,
            IGenericRepositories<User> userRepo,
            IGenericRepositories<PillarSlot> slotRepo,
            IGenericRepositories<StationStaff> stationStaffRepo,
            IGenericRepositories<Battery> batRepo,
            IBatteryService batService,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _userRepo = userRepo;
            _slotRepo = slotRepo;
            _batRepo = batRepo;
            _stationStaffRepo = stationStaffRepo;
            _batService = batService;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }


        //Hàm này để đưa ra các slot để hiển thị cho giả lập
        public async Task<ServiceResult> GetPillarSlotByStaffId(UserRequest requestDto)
        {
            var pillarSlots = await _stationStaffRepo.GetAllQueryable()
                                .Where(st => st.UserStaffId == requestDto.UserId)
                                .Include(st => st.BatterySwapStation)
                                    .ThenInclude(st => st.BatterySwapPillars)
                                    .ThenInclude(st => st.PillarSlots)
                                    .ThenInclude(st => st.Battery)
                                .ToListAsync();
            var updateBatterySoc = await _batService.UpdateBatterySocAsync();
            var dtoList = pillarSlots.Select(slot => new PillarSlotDto
            {
                SlotId = slot.SlotId,
                BatteryId = slot.BatteryId,
                SlotNumber = slot.SlotNumber,
                StationId = stationId,
                PillarStatus = slot.PillarStatus,
                BatteryStatus = slot.BatteryId != null ? slot.Battery.BatteryStatus : "Availables",
                BatterySoc = slot.BatteryId != null ? slot.Battery.Soc : 0,
                BatterySoh = slot.BatteryId != null ? slot.Battery.Soh : 0,
            }).ToList();

            return dtoList;
        }
    }
}
