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
        private readonly IBatteryService _batService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ISubscriptionService _subService;
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
            IBatteryService batService,
            ISubscriptionService subService,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _batSwapRepo = batSwapRepo;
            _stationRepo = stationRepo;
            _subRepo = subRepo;
            _pillarRepo = pillarRepo;
            _batSessionRepo = batSessionRepo;
            _batRepo = batRepo;
            _subService = subService;
            _batService = batService;
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
                Data = new BatterySwapInListResponse
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
        public async Task<ServiceResult> CheckBatteryAvailable(BatterySwapListRequest requestBatteryList)
        {
            var getBatteryAvailable = await GetBatteryInUsingAvailable(requestBatteryList.accessRequest.SubscriptionId);
            List<BatteryDto> getUnavailableBattery = await GetUnvailableBattery(requestBatteryList.accessRequest.SubscriptionId, requestBatteryList.BatteryDtos);
            if (getUnavailableBattery != null && getUnavailableBattery.Any())
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "You’re trying to return a different battery",
                    Data = getUnavailableBattery,
                };
            }
            //Cái này tìm subId để có thể update được currentMilleageBase và update được số lần swap
            var getSub = await _subRepo.GetByIdAsync(requestBatteryList.accessRequest.SubscriptionId);

            //Update cho những cục pin được đưa vào
            var getPillarSlot = await GetPillarSlot(requestBatteryList.accessRequest.StationId);

            //Lúc này là bắt đầu update cục pin đc đưa vào
            foreach (var item in requestBatteryList.BatteryDtos)
            {
                //Chỗ này là truyền về pillarSlot để biết cục pin được đưa vào đâu
                var getSlot = await _unitOfWork.BatterySwap.GetPillarSlot(item.SlotId);
                //Cái này là để tìm cục pin trong hệ thống
                var updateBat = await _unitOfWork.Batteries.FindingBatteryById(item.BatteryId);
                if (getSlot != null && updateBat != null)
                {
                    //khúc này là để cho nó tìm trong bat coi cục pin này đang là in using để từ đó đổi status lại
                    var updateBatSwapInHis = await _batSwapRepo.GetByIdAsync(bat => bat.BatteryOutId == item.BatteryId && bat.SubscriptionId == requestBatteryList.accessRequest.SubscriptionId && bat.Status == "in using");
                    //Cái này là để tạo ra 1 bản ghi mới trong lịch sử swap
                    var updateBatSwapIn = new BatterySwap
                    {
                        SwapHistoryId = await GenerateBatterySwapId(),
                        SubscriptionId = requestBatteryList.accessRequest.SubscriptionId,
                        BatterySwapStationId = requestBatteryList.accessRequest.StationId,
                        BatteryOutId = "Null",
                        BatteryInId = item.BatteryId,
                        SwapDate = DateOnly.FromDateTime(DateTime.Today),
                        Note = "",
                        Status = "Returned",
                        CreateAt = DateTime.UtcNow.ToLocalTime(),
                    };
                    //Sau khi tạo ra 1 bảng là returned thì sẽ update lại cục pin 
                    getSlot.BatteryId = item.BatteryId;
                    getSlot.PillarStatus = "Use";
                    updateBat.BatteryStatus = "Charging";
                    updateBat.BatterySwapStationId = requestBatteryList.accessRequest.StationId;
                    //Update lại cái pin được trả vô
                    updateBatSwapInHis.SwapDate = DateOnly.FromDateTime(DateTime.Today);
                    updateBatSwapInHis.Status = "Returned";
                    await _batSwapRepo.CreateAsync(updateBatSwapIn);
                    await _pillarRepo.UpdateAsync(getSlot);
                    await _batRepo.UpdateAsync(updateBat);
                    await _batSwapRepo.UpdateAsync(updateBatSwapInHis);
                }
            }
            var getSessionList = await GenerateBatterySession(requestBatteryList.accessRequest.SubscriptionId);
            var getMilleageBase = await CalMilleageBase(getSessionList);

            getSub.CurrentMileage += getMilleageBase;
            getSub.RemainingSwap += 1;
            await _batSessionRepo.BulkCreateAsync(getSessionList);
            await _subRepo.UpdateAsync(getSub);

            await _unitOfWork.SaveChangesAsync();

            //ĐÂY LÀ CÁI CHỖ ĐỂ LẤY RA ĐƯỢC LÀ CẦN MỞ BAO NHIÊU SLOT PINNNNNNNNNN
            int topNumber = await _unitOfWork.Subscriptions.GetNumberOfbatteryInSub(requestBatteryList.accessRequest.SubscriptionId);
            //Chỗ này để đưa cho FE để FE hiển thị các slot pin available để user để pin vào
            var getPillarSlotList = await _unitOfWork.Stations.GetBatteriesAvailableByPillarIdAsync(requestBatteryList.pillarId, topNumber);
            //lúc này là trả về các slot pin để FE hiển thị (bao gồm id pin và slotId)
            var dtoList = getPillarSlotList.Select(slot => new BatteryDto
            {
                SlotId = slot.SlotId,
                BatteryId = slot.BatteryId,
            }).ToList();
            return new ServiceResult
            {
                Status = 200,
                Message = "Successfull",
                Data = new BatteryRequest
                {
                    BatteryDtos = dtoList,
                    SubscriptionId = requestBatteryList.accessRequest.SubscriptionId,
                }
            };

        }

        public async Task<List<BatteryDto>> GetUnvailableBattery(string subId, List<BatteryDto> batteryDtos)
        {
            var getBatteryAvailable = await GetBatteryInUsingAvailable(subId);

            // So sánh dựa theo BatteryId thay vì reference
            var unavailable = batteryDtos
                .Where(x => !getBatteryAvailable.Any(y => y.BatteryId == x.BatteryId))
                .ToList();

            return unavailable;
        }



        //Hàm này để đưa ra các slot để hiển thị cho giả lập
        public async Task<List<PillarSlotDto>> GetPillarSlot(string stationId)
        {
            var pillarSlots = await _unitOfWork.Stations.GetBatteriesInPillarByStationIdAsync(stationId);
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
        public async Task<List<BatterySession>> GenerateBatterySession(string subId)
        {
            // Lấy danh sách tất cả pin trong Subscription đó
            var batteriesInSub = await _unitOfWork.BatterySwap
                .GetBatteriesBySubscriptionId(subId); // viết thêm hàm này trong repo nếu chưa có

            List<BatterySession> allSessions = new();

            foreach (var battery in batteriesInSub)
            {
                var sessions = await GenerateBatterySessionForBattery(battery.BatteryId);
                allSessions.AddRange(sessions);
            }

            return allSessions;
        }

        // Hàm tạo session riêng cho từng pin
        private async Task<List<BatterySession>> GenerateBatterySessionForBattery(string batId)
        {
            List<BatterySession> getBatterSessionList = new();
            for (int i = 0; i <= 10; i++)
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
                    socDelta = (decimal)(-(_random.NextDouble() * 0.5 + 0.1));
                    energyDelta = socDelta * 100m;
                }
                else  // charge_end
                {
                    socDelta = (decimal)(_random.NextDouble() * 0.5 + 0.1);
                    energyDelta = socDelta * 100m;
                }

                var startDate = new DateTime(2024, 1, 1);
                var range = (DateTime.Now - startDate).TotalSeconds;
                var randomSeconds = _random.NextDouble() * range;
                var timestamp = startDate.AddSeconds(randomSeconds);

                var getList = new BatterySession
                {
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
        public async Task<decimal?> CalMilleageBase(List<BatterySession> batSession)
        {
            decimal? milleageBase = 0;
            foreach (var item in batSession)
            {
                if (item.EventType == "use_end")
                {
                    milleageBase = milleageBase + ((-item.EnergyDeltaWh) / 60);
                }
            }
            return milleageBase;
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


        //Hàm này để trả về bill sau khi swap out
        public async Task<ServiceResult> SwapOutBattery(BatterySwapListRequest requestDto)
        {
            if (requestDto?.BatteryDtos == null || !requestDto.BatteryDtos.Any())
            {
                return new ServiceResult { Status = 400, Message = "No batteries to swap out" };
            }

            var subId = requestDto.accessRequest?.SubscriptionId ?? string.Empty;
            var stationId = requestDto.accessRequest?.StationId ?? string.Empty;
            if (string.IsNullOrEmpty(subId) || string.IsNullOrEmpty(stationId))
            {
                return new ServiceResult { Status = 400, Message = "Invalid subscription or station" };
            }

            var updatedSlots = new List<PillarSlot>();
            var swappedBatteries = new List<string>();

            foreach (var batteryDto in requestDto.BatteryDtos)
            {
                var pillarEntity = await _pillarRepo.GetByIdAsync(x => x.SlotId == batteryDto.SlotId);  // string SlotId khớp
                var batteryEntity = await _batRepo.GetByIdAsync(b => b.BatteryId == batteryDto.BatteryId);

                if (pillarEntity != null && batteryEntity != null)
                {
                    // Update battery
                    batteryEntity.BatterySwapStationId = null;
                    batteryEntity.BatteryStatus = "In Use";

                    // Update pillar
                    pillarEntity.BatteryId = null;
                    pillarEntity.PillarStatus = "Not use";
                    pillarEntity.UpdateAt = DateTime.UtcNow;

                    // Tạo history
                    var swapOut = new BatterySwap
                    {
                        SwapHistoryId = await GenerateBatterySwapId(),
                        SubscriptionId = subId,
                        BatterySwapStationId = stationId,
                        BatteryOutId = batteryDto.BatteryId,
                        BatteryInId = null,
                        SwapDate = DateOnly.FromDateTime(DateTime.Today),
                        Note = "",
                        Status = "Swapped Out",
                        CreateAt = DateTime.UtcNow.ToLocalTime(),
                    };
                    await _batSwapRepo.CreateAsync(swapOut);

                    await _batRepo.UpdateAsync(batteryEntity);
                    await _pillarRepo.UpdateAsync(pillarEntity);

                    swappedBatteries.Add(batteryDto.BatteryId);
                }
            }

            await _unitOfWork.SaveChangesAsync();

            // Tính bill (merge)
            var sub = await _subRepo.GetByIdAsync(subId);
            if (sub == null)
            {
                return new ServiceResult { Status = 404, Message = "Subscription not found" };
            }

            var mileageRate = decimal.TryParse(_configuration["MileageRate:PerKm"], out var rate) ? rate : 0.1m;
            var totalFee = sub.CurrentMileage * mileageRate;
            var swappedCount = swappedBatteries.Count;

            // Update remaining swap (ví dụ +1 per battery)
            sub.RemainingSwap += swappedCount;
            await _subRepo.UpdateAsync(sub);
            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = $"Battery swapped out successfully. Swapped {swappedCount} batteries.",
                Data = new BillAfterSwapOutResponse  // Khớp DTO mới
                {
                    SubId = subId,
                    DateSwap = DateOnly.FromDateTime(DateTime.Today),
                    TimeSwap = TimeOnly.FromDateTime(DateTime.Now),
                }
            };
        }




        //Đây sẽ là bắt đầu cho phần transfer pin giữa các trạm hay giả lập cho staff, cái này có thể là khi user trả pin nhưng bị lỗi gì đó về trạm thì staff sẽ đi lấy pin đó từ User rồi đổi pin mới cho User và khi đó staff sẽ nhập batteryOutId, batteryInId cho batterySwap của user và nếu user đã trả pin rồi mà không lấy được pin ra thì staff cũng sẽ mang pin để đưa cho user nhưng khi này staff sẽ truyền vào mỗi batteryOutId thôi
        public async Task<ServiceResult> StaffTransferBattery(StaffBatteryRequest requestDto)
        {
            if (string.IsNullOrEmpty(requestDto.StationId) || string.IsNullOrEmpty(requestDto.StaffId))
            {
                return new ServiceResult { Status = 400, Message = "Invalid station or staff ID" };
            }
            // Xử lý Battery Out
            if (!string.IsNullOrEmpty(requestDto.BatteryOutId))
            {
                var batteryOut = new Battery
                {
                    BatteryId = requestDto.BatteryOutId,
                    BatterySwapStationId = null,
                    BatteryStatus = "In Use",
                    Capacity = 100,
                    Soc = 100.0m,
                    Soh = 100.0m,
                };
                if (batteryOut != null)
                {
                    batteryOut.BatterySwapStationId = null;
                    batteryOut.BatteryStatus = "In Use";
                    await _batRepo.UpdateAsync(batteryOut);
                    var swapOut = new BatterySwap
                    {
                        SwapHistoryId = await GenerateBatterySwapId(),
                        SubscriptionId = requestDto.SubId,
                        BatterySwapStationId = requestDto.StationId,
                        BatteryOutId = requestDto.BatteryOutId,
                        BatteryInId = null,
                        SwapDate = DateOnly.FromDateTime(DateTime.Today),
                        Note = $"Staff {requestDto.StaffId} transferred out",
                        Status = "in using",
                        CreateAt = DateTime.UtcNow.ToLocalTime(),
                    };
                    await _batSwapRepo.CreateAsync(swapOut);
                }
                else
                {
                    return new ServiceResult { Status = 404, Message = "Battery to transfer out not found" };
                }
            }

            // Xử lý Battery In
            if (!string.IsNullOrEmpty(requestDto.BatteryInId))
            {
                var batteryIn = await _batRepo.GetByIdAsync(b => b.BatteryId == requestDto.BatteryInId);
                if (batteryIn != null)
                {
                    batteryIn.BatterySwapStationId = requestDto.StationId;
                    batteryIn.BatteryStatus = "Maintenance";
                    await _batRepo.UpdateAsync(batteryIn);
                    var swapIn = new BatterySwap
                    {
                        SwapHistoryId = await GenerateBatterySwapId(),
                        SubscriptionId = requestDto.SubId,
                        BatterySwapStationId = requestDto.StationId,
                        BatteryOutId = null,
                        BatteryInId = requestDto.BatteryInId,
                        SwapDate = DateOnly.FromDateTime(DateTime.Today),
                        Note = $"Staff {requestDto.StaffId} transferred out",
                        Status = "Returned",
                        CreateAt = DateTime.UtcNow.ToLocalTime(),
                    };
                    await _batSwapRepo.UpdateAsync(swapIn);
                }
                else
                {
                    return new ServiceResult { Status = 404, Message = "Battery to transfer out not found" };
                }
            }

            return new ServiceResult
            {
                Status = 200,
                Message = "Battery transfer processed successfully"
            };
        }


        //Hàm này để staff check pin trong trạm đồng thời là thêm pin hay thay đổi pin trong trụ
        public async Task<ServiceResult> StaffCheckStation(string stationId)
        {
            var getPillarSlotList = await GetPillarSlot(stationId);
            return new ServiceResult
            {
                Status = 200,
                Message = "Successfull",
                Data = getPillarSlotList,
            };
        }


        //Hàm này để staff có thể đổi pin mà pin này chưa có trong hệ thống nên khi đưa vào thì sẽ là pin mới
        public async Task<ServiceResult> StaffAddNewBattery(StaffNewBatteryInRequest requestDto)
        {
            var newBattery = new Battery
            {
                BatteryId = requestDto.BatteryInId,
                BatterySwapStationId = requestDto.StataionId,
                BatteryStatus = "Available",
                Capacity = 100,
                Soc = 100.0m,
                Soh = 100.0m,
            };

            await _batRepo.CreateAsync(newBattery);
            var newPillarSlot = await _unitOfWork.Stations.GetPillarSlotAsync(requestDto.SlotId);
            newPillarSlot.BatteryId = requestDto.BatteryInId;
            newPillarSlot.PillarStatus = "Use";
            newPillarSlot.UpdateAt = DateTime.UtcNow.ToLocalTime();
            await _pillarRepo.UpdateAsync(newPillarSlot);

            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = "Successfull",
                Data = new BillAfterStaffSwapOutResponse
                {
                    BatterInId = requestDto.BatteryInId,
                    SlotId = requestDto.SlotId,
                    CreateAt = DateTime.UtcNow.ToLocalTime(),
                }
            };
        }


        //Hàm này để 
        //public async Task<> ChangeSubIdAsync(ChangeBatteryRequest requestDto)
        //{
        //    var getBatteryList = await _unitOfWork.BatterySwap.GetBatteryInUsingAsync(requestDto.PreSubscriptionId);
        //    foreach (var item in getBatteryList)
        //    {
        //        item.SubscriptionId = requestDto.NewSubscriptionId;
        //        await _batSwapRepo.UpdateAsync(item);
        //    }
        //    await _unitOfWork.SaveChangesAsync();
        //}

        //public async Task<ServiceResult> StaffRemoveBattery(StaffNewBatteryInRequest requestDto)
        //{
        //    var battery = await _batRepo.GetByIdAsync(b => b.BatteryId == requestDto.BatteryInId);
        //    if (battery == null)
        //    {
        //        return new ServiceResult { Status = 404, Message = "Battery not found" };
        //    }
        //    var pillarSlot = await _unitOfWork.Stations.GetPillarSlotAsync(requestDto.SlotId);
        //    if (pillarSlot == null || pillarSlot.BatteryId != requestDto.BatteryInId)
        //    {
        //        return new ServiceResult { Status = 404, Message = "Battery not found in the specified slot" };
        //    }
        //    // Remove battery from pillar slot
        //    pillarSlot.BatteryId = null;
        //    pillarSlot.PillarStatus = "Not use";
        //    pillarSlot.UpdateAt = DateTime.UtcNow.ToLocalTime();
        //    await _pillarRepo.UpdateAsync(pillarSlot);
        //    // Update battery status
        //    battery.BatterySwapStationId = null;
        //    battery.BatteryStatus = "In Use";
        //    await _batRepo.UpdateAsync(battery);
        //    await _unitOfWork.SaveChangesAsync();
        //    return new ServiceResult
        //    {
        //        Status = 200,
        //        Message = "Battery removed successfully",
        //        Data = new
        //        {
        //            BatteryId = requestDto.BatteryInId,
        //            SlotId = requestDto.SlotId,
        //            RemovedAt = DateTime.UtcNow.ToLocalTime(),
        //        }
        //    };
        //}
    }

    //Nemo: cái này để tính ra được số lượt đổi pin theo tháng

}
