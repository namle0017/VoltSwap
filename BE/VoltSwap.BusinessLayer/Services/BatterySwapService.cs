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
                Data = new BatterySwapListRequest
                {
                    PillarSlotDtos = getPillarSlotList,
                }
            };

        }

        //Hàm này để check coi là cục pin đó có đúng theo gói không, chỗ hàm này sẽ là nơi để trả cho fe để cho fe giả lập lấy pin ra
        // Ở hàm này làm khá nhiều việc:
        // 1. Random thông số Session để tính các thứ như milleage base. Done
        // 2. Tính milleage base + RemainingSwap.  Done
        // 3. Cập nhật lại pillarSlot.Status là returned và cục pin out ra sẽ là in using
        // 4. Cập nhật lại battery.Status là in using và đồng thời là gán cái Battery.StationId là null nếu là in using và sẽ là có id nếu là charging và cập nhật thêm là soc và soh
        public async Task<ServiceResult> CheckBatteryAvailable(BatterySwapInListResponse requestBatteryList)
        {
            var getBatteryAvailable = await GetBatteryInUsingAvailable(requestBatteryList.accessRequest.SubscriptionId);
            List<BatteryDto> getUnavailableBattery = requestBatteryList.BatteryDtos.Except(getBatteryAvailable).ToList();
            if(getUnavailableBattery != null)
            {
                return new ServiceResult
                {
                    Message = "You’re trying to return a different battery",
                    Data = getUnavailableBattery,
                };
            }
            //Cái này tìm subId để có thể update được currentMilleageBase và update được số lần swap
            var getSub = await _subRepo.GetByIdAsync(requestBatteryList.accessRequest.SubscriptionId);
            //Update cho những cục pin được đưa vào
            var getPillarSlot = await GetPillarSlot(requestBatteryList.accessRequest.StationId);
            
            foreach (var item in requestBatteryList.BatteryDtos)
            {
                var getSlot = await _unitOfWork.BatterySwap.GetPillarSlot(item.SlotId);
                var updateBat = await _unitOfWork.Batteries.FindingBatteryById(item.BatteryId);
                if (getSlot != null || updateBat!=null)
                {
                    var updateBatSwapInHis = await _batSwapRepo.GetByIdAsync(bat => bat.BatteryOutId == item.BatteryId && bat.SubscriptionId == requestBatteryList.accessRequest.SubscriptionId && bat.Status=="In using");
                    var updateBatSwapIn = new BatterySwap
                    {
                        SwapHistoryId = await GenerateBatterySwapId(),
                        SubscriptionId = requestBatteryList.accessRequest.SubscriptionId,
                        BatterySwapStationId = requestBatteryList.accessRequest.StationId,
                        BatteryOutId = null,
                        BatteryInId = item.BatteryId,
                        SwapDate = DateOnly.FromDateTime(DateTime.Today),
                        Note = "",
                        Status = "Returned",
                        CreateAt = DateTime.UtcNow.ToLocalTime(),
                    };

                    getSlot.BatteryId = item.BatteryId;
                    getSlot.PillarStatus = "Use";
                    updateBat.BatteryStatus = "Charging";
                    updateBat.BatterySwapStationId = requestBatteryList.accessRequest.StationId;
                    updateBatSwapInHis.SwapDate = DateOnly.FromDateTime(DateTime.Today);
                    updateBatSwapInHis.Status = "Returned";
                    await _batSwapRepo.CreateAsync(updateBatSwapIn);
                    await _pillarRepo.UpdateAsync(getSlot);
                    await _batRepo.UpdateAsync(updateBat);
                }
            }            
            var getSessionList = await GenerateBatterySession(requestBatteryList.accessRequest.SubscriptionId);
            var getMilleageBase = await CalMilleageBase(getSessionList);
            
            getSub.CurrentMileage += getMilleageBase;
            getSub.RemainingSwap += 1;
            await _batSessionRepo.BulkCreateAsync(getSessionList);
            await _subRepo.UpdateAsync(getSub);

            await _unitOfWork.SaveChangesAsync();
            int topNumber = await _unitOfWork.Subscriptions.GetNumberOfbatteryInSub(requestBatteryList.accessRequest.SubscriptionId);
            var getPillarSlotList = await _unitOfWork.Stations.GetBatteriesAvailableByPillarAsync(requestBatteryList.accessRequest.StationId);
            return new ServiceResult
            {
                Status = 200,
                Message = "Successfull",
                Data = new BatteryRequest
                {
                    
                }
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
                BatteryStatus = slot.BatteryId != null ? slot.Battery.BatteryStatus : "Available",
                BatterySoc = slot.BatteryId != null ? slot.Battery.Soc : 0,
                BatterySoh = slot.BatteryId != null ? slot.Battery.Soh : 0,
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

        //Đây là hàm tính milleage base
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


        public async Task<ServiceResult> SwapOutBattery(BatterySwapInListResponse requestDto)
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

        //hàm này để generate ra BatterySwapId với format là BTHS-XX-XX-XXXXXX với 2 cái đầu là ngày 2 cái sau là tháng còn 6 cái cuối là random không trùng lặp
        public async Task<string> GenerateBatterySwapId()
        {
            string batterySwapId;
            bool isDuplicated;
            do
            {
                var random = new Random();
                var datePart = DateTime.UtcNow.ToString("ddMM");
                var randomPart = string.Concat(Enumerable.Range(0, 6).Select(_ => random.Next(0, 10).ToString()));
                batterySwapId = $"BTHS-{datePart}-{randomPart}";
                isDuplicated = await _batSwapRepo.AnyAsync(bat => bat.SwapHistoryId == batterySwapId);
            } while (isDuplicated);
            return batterySwapId;
        }
    }
}
