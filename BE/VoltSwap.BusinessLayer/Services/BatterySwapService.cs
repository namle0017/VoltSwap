using Azure.Core;
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
    public class BatterySwapService : BaseService, IBatterySwapService
    {
        private readonly IGenericRepositories<BatterySwap> _batSwapRepo;
        private readonly IGenericRepositories<BatterySwapStation> _stationRepo;
        private readonly IGenericRepositories<Battery> _batRepo;
        private readonly IGenericRepositories<Subscription> _subRepo;
        private readonly IGenericRepositories<PillarSlot> _pillarRepo;
        private readonly IGenericRepositories<BatterySession> _batSessionRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        private readonly Random _random;
        public BatterySwapService(
            IServiceProvider serviceProvider,
            IGenericRepositories<BatterySwap> batSwapRepo,
            IGenericRepositories<BatterySwapStation> stationRepo,
            IGenericRepositories<PillarSlot> pillarRepo,
            IGenericRepositories<Subscription> subRepo,
            IGenericRepositories<Battery> batRepo,
            IGenericRepositories<BatterySession> batSessionRepo,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _batSwapRepo = batSwapRepo;
            _stationRepo = stationRepo;
            _subRepo = subRepo;
            _pillarRepo = pillarRepo;
            _batSessionRepo = batSessionRepo;
            _batRepo = batRepo;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
            _random = new Random();
        }

        //Hàm này để khi nhập subId vô thì sẽ check ra là đây là gói mới mở hay sao hay là không phải trong hệ thống, nhập sai
        //Nếu đúng hết thì sẽ trả ra cho FE pin mà user đã mượn và data về giả lập để cho fe làm giả lập
        //Ở đây mới là happy case nên là sẽ đưa pin mà user đã mượn và fe sẽ trả đúng những mã pin đó
        public async Task<ServiceResult> CheckSubId(AccessRequest requestDto)
        {
            bool isAvailableSubId = await _unitOfWork.Subscriptions.CheckPlanAvailabel(requestDto.SubscriptionId);
            if (isAvailableSubId == false)
            {
                return new ServiceResult
                {
                    Status = 400,
                    Message = "Subscription wrong",
                };
            }
            var getPillarSlotList = await GetPillarSlot(requestDto.StationId);
            if (await _unitOfWork.Subscriptions.IsPlanHoldingBatteryAsync(requestDto.SubscriptionId) == false)
            {
                return new ServiceResult
                {
                    Status = 200,
                    Message = "Please, take batteries",
                    Data = getPillarSlotList,
                };
            }

            var getBatteryInUsingAvailable = await GetBatteryInUsingAvailable(requestDto.SubscriptionId);
            return new ServiceResult
            {
                Status = 200,
                Message = "Please put your battery",
                Data = new BatterySwapList
                {
                    BatteryDtos = getBatteryInUsingAvailable,
                    PillarSlotDtos = getPillarSlotList,
                }
            };

        }

        //Hàm này để check coi là cục pin đó có đúng theo gói không, chỗ hàm này sẽ là nơi để trả cho fe để cho fe giả lập lấy pin ra
        // Ở hàm này làm khá nhiều việc:
        // 1. Random thông số Session để tính các thứ như milleage base. Done
        // 2. Tính milleage base. Not Done
        // 3. Cập nhật lại pillarSlot.Status là returned và cục pin out ra sẽ là in using
        // 4. Cập nhật lại battery.Status là in using và đồng thời là gán cái Battery.StationId là null nếu là in using và sẽ là có id nếu là charging và cập nhật thêm là soc và soh
        public async Task<ServiceResult> CheckBatteryAvailable(BatterySwapList requestBatteryList)
        {
            var getBatteryAvailable = await GetBatteryInUsingAvailable(requestBatteryList.SubscriptionId);
            List<BatteryDto> getUnavailableBattery = requestBatteryList.BatteryDtos.Except(getBatteryAvailable).ToList();
            if(getUnavailableBattery != null)
            {
                return new ServiceResult
                {
                    Message = "You’re trying to return a different battery",
                    Data = getUnavailableBattery,
                };
            }
            //Done
            var getSessionList = await GenerateBatterySession(requestBatteryList.SubscriptionId);
            

            await _batSessionRepo.BulkCreateAsync(getSessionList);

            return new ServiceResult
            {
                Status = 200,
                Message = "Successfull",
            };

        }
        public async Task<List<PillarSlotDto>> GetPillarSlot(String stationId)
        {
            var pillarSlots = await _unitOfWork.Stations.GetBatteriesByStationIdAsync(stationId);
            var dtoList = pillarSlots.Select(slot => new PillarSlotDto
            {
                SlotId = slot.SlotId,
                BatteryId = slot.BatteryId,
                SlotNumber = slot.SlotNumber,
                StationId = stationId,
                PillarStatus = slot.PillarStatus,
                BatteryStatus = slot.Battery?.BatteryStatus,
                BatterySoc = slot.Battery.Soc,
                BatterySoh = slot.Battery.Soh,
            }).ToList();

            return dtoList;
        }

        //Hàm này để lấy được cục pin phù hợp
        public async Task<List<BatteryDto>> GetBatteryInUsingAvailable(string subId)
        {
            var batteries = await _unitOfWork.BatterySwap.GetBatteryInUsingAsync(subId);
            var dtoList = batteries.Select(bat => new BatteryDto
            {
                BatteryId = bat.BatteryOutId,
            }).ToList();
            return dtoList;
        }

        //Đây là hàm để generate ra Session
        private async Task<List<BatterySession>> GenerateBatterySession(String batId)
        {
            List<BatterySession> getBatterSessionList = new();
            for(int i =0; i<= 10; i++)
            {
                var eventTypes = new[] { "use_start", "use_end", "charge_start", "charge_end" };
                var eventType = eventTypes[_random.Next(eventTypes.Length)];
                decimal socDelta = 0;
                decimal energyDelta = 0;
                if (eventType == "use_start" || eventType == "charge_start")
                {
                    socDelta = 0m;
                    energyDelta = 0m;
                }
                else if (eventType == "use_end")
                {
                    // Discharge: SOC giảm 0.1 đến 0.6 (negative)
                    socDelta = (decimal)(-(_random.NextDouble() * 0.5 + 0.1));
                    energyDelta = socDelta * 100m;  // Giả sử 1 SOC = 100 Wh
                }
                else  // charge_end
                {
                    // Charge: SOC tăng 0.1 đến 0.6 (positive)
                    socDelta = (decimal)(_random.NextDouble() * 0.5 + 0.1);
                    energyDelta = socDelta * 100m;
                }

                var startDate = new DateTime(2024, 1, 1);
                var range = (DateTime.Now - startDate).TotalSeconds;
                var randomSeconds = _random.NextDouble() * range;
                var timestamp = startDate.AddSeconds(randomSeconds);

                var getList = new BatterySession{
                    BatteryId = batId,
                    EventType = eventType,
                    SocDelta = socDelta,
                    EnergyDeltaWh = energyDelta,
                    Timestamp = timestamp,
                };
                getBatterSessionList.Add(getList);
            }

            return getBatterSessionList;
        }

        //Đây là hàm tính milleage base, tinh phi
        public async Task<decimal> CalMilleageBase(List<BatterySession> batSession)
        {
            decimal milleageBase = 0;
            foreach (var item in batSession)
            {
                if(item.EventType == "use_end")
                {
                    milleageBase = milleageBase + ((-item.EnergyDeltaWh) / 60); 
                }
            }
            return milleageBase;
        }


        public async Task<ServiceResult> SwapInBattery(BatterySwapList request)
        {
            
            var updatedSlots = new List<PillarSlot>();
            foreach (var batteryDto in request.BatteryDtos)
            {
                
                var pillarEntity = await _pillarRepo.GetByIdAsync(x => x.SlotId == batteryDto.SlotId);
                var batteryEntities = await _batRepo.GetByIdAsync(bat => bat.BatteryId == batteryDto.BatteryId);
                batteryEntities.BatterySwapStationId = "Null";
                batteryEntities.BatteryStatus = "Charging";
                pillarEntity.BatteryId = batteryDto.BatteryId;
                pillarEntity.UpdateAt = DateTime.UtcNow; 
                updatedSlots.Add(pillarEntity);
                await _batRepo.UpdateAsync(batteryEntities);
                await _pillarRepo.UpdateAsync(pillarEntity);
            }
            var getSessionList = await GenerateBatterySession(request.SubscriptionId);
            
            await _batSessionRepo.BulkCreateAsync(getSessionList);

            await _unitOfWork.SaveChangesAsync();
            return new ServiceResult
            {
                Status = 200,
                Message= "Success"
            };
        }

        public async Task<ServiceResult> SwapOutBattery(BatterySwapList requestDto)
        {
            //Lấy danh sách các trạm
            var updatedSlots = new List<PillarSlot>();
            foreach (var batteryDto in requestDto.BatteryDtos)
            {
                //lấy danh sách các pillar và danh sách bat
                var pillarEntity = await _pillarRepo.GetByIdAsync(x => x.SlotId == batteryDto.SlotId);
                var batteryEntities = await _batRepo.GetByIdAsync(bat => bat.BatteryId == batteryDto.BatteryId);

                batteryEntities.BatterySwapStationId = null;
                batteryEntities.BatteryStatus = "Charging";
                pillarEntity.BatteryId = null;
                pillarEntity.UpdateAt = DateTime.UtcNow;
                updatedSlots.Add(pillarEntity);
                await _batRepo.UpdateAsync(batteryEntities);
                await _pillarRepo.UpdateAsync(pillarEntity);
            }

            await _unitOfWork.SaveChangesAsync();
            return new ServiceResult
            {
                Status = 200,
                Message = "Success"
            };
        }
    }
}
