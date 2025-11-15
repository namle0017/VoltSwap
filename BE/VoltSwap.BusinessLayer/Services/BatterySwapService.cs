using Azure.Core;
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
using static System.Runtime.InteropServices.JavaScript.JSType;
using Microsoft.EntityFrameworkCore;

namespace VoltSwap.BusinessLayer.Services
{
    public class BatterySwapService : BaseService, IBatterySwapService
    {
        private readonly IGenericRepositories<Appointment> _appoinmentRepo;
        private readonly IGenericRepositories<Transaction> _transRepo;
        private readonly IGenericRepositories<BatterySwap> _batSwapRepo;
        private readonly IGenericRepositories<BatterySwapStation> _stationRepo;
        private readonly IGenericRepositories<Battery> _batRepo;
        private readonly IGenericRepositories<Subscription> _subRepo;
        private readonly IGenericRepositories<PillarSlot> _slotRepo;
        private readonly IGenericRepositories<BatterySession> _batSessionRepo;
        private readonly IGenericRepositories<BatterySwapPillar> _pillarRepo;
        private readonly IGenericRepositories<Fee> _feeRepo;
        private readonly IBatteryService _batService;
        private readonly IUserService _userService;
        private readonly ITransactionService _transService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ISubscriptionService _subService;
        private readonly IBookingService _bookService;
        private static readonly Random random = new Random();
        private readonly IPillarSlotService _slotService;
        private readonly IConfiguration _configuration;
        private readonly Random _random;
        public BatterySwapService(
            IServiceProvider serviceProvider,
            IGenericRepositories<BatterySwap> batSwapRepo,
            IGenericRepositories<BatterySwapStation> stationRepo,
            IGenericRepositories<Appointment> appointmentRepo,
            IGenericRepositories<Transaction> transRepo,
            IGenericRepositories<PillarSlot> slotRepo,
            IGenericRepositories<Subscription> subRepo,
            IGenericRepositories<Battery> batRepo,
            IGenericRepositories<BatterySession> batSessionRepo,
            IGenericRepositories<BatterySwapPillar> pillarRepo,
            IGenericRepositories<Appointment> apppointmentRepo,
            IBookingService bookService,
            IGenericRepositories<Fee> feeRepo,
            IPillarSlotService slotService,
            ITransactionService transService,
            IUserService userService,
            IBatteryService batService,
            ISubscriptionService subService,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _appoinmentRepo = appointmentRepo;
            _transRepo = transRepo;
            _batSwapRepo = batSwapRepo;
            _stationRepo = stationRepo;
            _subRepo = subRepo;
            _slotRepo = slotRepo;
            _batSessionRepo = batSessionRepo;
            _pillarRepo = pillarRepo;
            _batRepo = batRepo;
            _subService = subService;
            _userService = userService;
            _batService = batService;
            _transService = transService;
            _feeRepo = feeRepo;
            _bookService = bookService;
            _slotService = slotService;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
            _random = new Random();
        }

        //Hàm này để khi nhập subId vô thì sẽ check ra là đây là gói mới mở hay sao hay là không phải trong hệ thống, nhập sai
        //Nếu đúng hết thì sẽ trả ra cho FE pin mà user đã mượn và data về giả lập để cho fe làm giả lập
        //Ở đây mới là happy case nên là sẽ đưa pin mà user đã mượn và fe sẽ trả đúng những mã pin đó
        public async Task<ServiceResult> CheckSubId(AccessRequest requestDto)
        {
            //1. Check coi sub đó đã input đầu vào đúng chưa
            bool isAvailableSubId = await _unitOfWork.Subscriptions.CheckPlanAvailabel(requestDto.SubscriptionId);
            if (isAvailableSubId == false)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Can't find this subscriptionId",
                };
            }


            //2. Check sub đó đã trả tiền chưa
            var getTrans = await _transService.CheckPaidMonthly(requestDto.SubscriptionId);
            if (getTrans == true)
            {
                return new ServiceResult
                {
                    Status = 400,
                    Message = "Please pay to continue using the service.",
                };
            }


            //3. Check coi sub đó đã được booking chưa
            bool checkBooking = await _bookService.CheckBookingExist(requestDto.SubscriptionId);
            List<BatteryLockDto> getBatLockList = null; // Giả sử BatteryLockDto có BatteryId, SlotId
            if (checkBooking == true)
            {
                getBatLockList = await GetBatLock(requestDto.SubscriptionId);
                var checkStationBooking = await _unitOfWork.Bookings.GetAllQueryable()
                                                        .Where(x => x.SubscriptionId == requestDto.SubscriptionId
                                                                && x.Status == "Processing")
                                                        .FirstOrDefaultAsync();
                if (checkStationBooking.BatterySwapStationId.Equals(requestDto.StationId) == false)
                {
                    var getStationName = await _unitOfWork.Stations.GetAllQueryable()
                                                .Where(sta => sta.BatterySwapStationId == checkStationBooking.BatterySwapStationId)
                                                .Select(sta => sta.BatterySwapStationName)
                                                .FirstOrDefaultAsync();
                    return new ServiceResult
                    {
                        Status = 400,
                        Message = $"This is not the station you booked. Go to {getStationName} to change battery.",
                    };
                }
            }



            //4. Lấy các pinId và sub đó hiện đang giữ (dựa vào plan)
            int topNumber = await _unitOfWork.Subscriptions.GetNumberOfbatteryInSub(requestDto.SubscriptionId);

            //5. Tìm pillar mà đang trống, phù hợp
            string getPillarId = await GetPillarSlotAvailable(requestDto);

            //6. Lấy các slot trống trong pillarId đã tìm thấy
            var getBatteriesAvailableList = await _unitOfWork.Stations.GetBatteriesAvailableByPillarIdAsync(getPillarId, topNumber);

            //7. Lấy ra toàn bộ pin trong trạm và pillar của nó
            var getPillarSlotList = await GetPillarSlot(requestDto.StationId);
            var dtoList = getBatteriesAvailableList.Select(slot => new BatteryDto
            {
                SlotId = slot.SlotId,
                BatteryId = slot.BatteryId,
            }).ToList();
            if (getBatLockList != null)
            {
                dtoList = getBatLockList.Select(slot => new BatteryDto
                {
                    SlotId = slot.SlotId,
                    BatteryId = slot.BatteryId,
                }).ToList();
            }

            //8. Check người đó có đang giữ cục pin nào không, để cho người dùng mới
            if (await _unitOfWork.Subscriptions.IsPlanHoldingBatteryAsync(requestDto.SubscriptionId) == false)
            {
                return new ServiceResult
                {
                    Status = 200,
                    Message = "Please, take batteries",
                    Data = new
                    {
                        PillarSlot = getPillarSlotList,
                        BatTake = dtoList,
                    },
                };
            }

            //9. Lấy các pin mà subId đang giữ
            var getPillarSlotSwapIn = await GetPillarSlotSwapIn(requestDto);

            //9. Dựa vào sub mà lấy ra được pillar và slot nào phù hợp
            var swapInList = await GetSlotSwapIn(requestDto);

            if (getBatLockList != null)
            {
                swapInList = await GetSlotLockSwapIn(getBatLockList.First().PillarId, requestDto.SubscriptionId);
            }

            //10. Lấy số pin mà sub đó đang giữ.
            var getBatteryInUsingAvailable = await GetBatteryInUsingAvailable(requestDto.SubscriptionId);
            return new ServiceResult
            {
                Status = 200,
                Message = "Please put your battery",
                Data = new BatterySwapListResponse
                {
                    PillarSlotDtos = getPillarSlotList,
                    SlotEmpty = swapInList,
                    BatteryDtos = getBatteryInUsingAvailable,
                }
            };

        }
        public async Task<string> GenerateTransactionId()
        {
            string transactionId;
            bool isDuplicated;
            string dayOnly = DateTime.Today.Day.ToString("D2");
            do
            {
                // Sinh 10 chữ số ngẫu nhiên
                var random = new Random();
                transactionId = $"TRANS-{dayOnly}-{string.Concat(Enumerable.Range(0, 10).Select(_ => random.Next(0, 10).ToString()))}";

                // Kiểm tra xem có trùng không
                isDuplicated = await _transRepo.AnyAsync(u => u.TransactionId == transactionId);

            } while (isDuplicated);
            return transactionId;
        }
        public async Task<string> GetPlanIdBySubId(string subId)
        {
            return await _unitOfWork.Subscriptions.GetAllQueryable()
                            .Where(sub => sub.SubscriptionId == subId)
                            .Select(sub => sub.PlanId)
                            .FirstOrDefaultAsync();
        }
        //Nemo: Cho staff tạo cancelPlan
        public async Task<ServiceResult> CancelPlanAsync(CheckCancelPlanRequest requestDto)
        {
            var getstation = await _unitOfWork.StationStaffs.GetStationWithStaffIdAsync(requestDto.StaffId);
            var generateTransId = await GenerateTransactionId();
            var getPlanId = await GetPlanIdBySubId(requestDto.SubId);
            var getFee = await _feeRepo.GetAllQueryable()
                                    .FirstOrDefaultAsync(fee => fee.PlanId == getPlanId &&
                                    fee.TypeOfFee == "Battery Deposit");
            var booking = await _unitOfWork.Bookings.GetBookingCancelBySubId(requestDto.SubId);


            //tìm các transaction của user chưa trả để tính vào 
            var gettransactionNotPay = await _unitOfWork.Trans.TransactionListNotpayBySubId(requestDto.SubId);
            decimal t = 0;
            foreach (var transaction in gettransactionNotPay)
            {
                t += transaction.TotalAmount;
                transaction.Status = "Success";
                transaction.Note = $"{requestDto.SubId}-CANCEL-PLAN";
                await _transRepo.CreateAsync(transaction);
                await _unitOfWork.SaveChangesAsync();

            }

            var getSessionList = await GenerateBatterySession(requestDto.SubId);
            var getBatRequest = new BatterySwapRequest
            {
                SubId = requestDto.SubId,
                MonthSwap = DateTime.UtcNow.ToLocalTime().Month,
                YearSwap = DateTime.UtcNow.ToLocalTime().Year,
            };
            var calMilleageFee = await CalMilleageFee(getBatRequest, getSessionList);
            string transactionContext = $"{requestDto.SubId}-CANCEL-PLAN";
            var total = (-(getFee.Amount) + t + calMilleageFee);
            var createRefund = new Transaction
            {
                TransactionId = generateTransId,
                SubscriptionId = requestDto.SubId,
                UserDriverId = booking.UserDriverId,
                Amount = -(getFee.Amount),
                Currency = "VND",
                TransactionDate = DateTime.UtcNow.ToLocalTime(),
                PaymentMethod = "Bank",
                Status = "Pending",
                Note = $"{requestDto.SubId}-CANCEL-PLAN",
                Fee = t + calMilleageFee,
                TotalAmount = total,
                TransactionContext = transactionContext,
                CreatedBy = requestDto.StaffId,
            };
            if (total > 0)
            {
                createRefund.TransactionType = "Penalty Fee";
            }
            else
            {
                createRefund.TransactionType = "Refund";
                createRefund.PaymentMethod = "Cash";
            }

            await _transRepo.CreateAsync(createRefund);
            await _unitOfWork.SaveChangesAsync();

            if (booking != null)
            {
                booking.TransactionId = generateTransId;
                booking.Status = "Done";
                await _appoinmentRepo.UpdateAsync(booking);
                await _unitOfWork.SaveChangesAsync();
            }

            var result = await _unitOfWork.SaveChangesAsync();
            if (result < 0)
            {
                return new ServiceResult
                {
                    Status = 400,
                    Message = "Something wrong, please contact to admin or waiting...",
                };
            }
            var batteriesInSub = await _unitOfWork.BatterySwap
            .GetBatteriesBySubscriptionId(requestDto.SubId);
            foreach (var bat in batteriesInSub)
            {
                bat.Status = "Returned";
                await _unitOfWork.BatterySwap.UpdateAsync(bat);
                await _unitOfWork.SaveChangesAsync();

            }

            return new ServiceResult
            {
                Status = 200,
                Message = "Check confirm and refund for customer",
                Data = createRefund

            };
        }
        //Bin: staff bỏ pin của sub khách hủy vào kho
        public async Task<ServiceResult> StaffTakeBattrey(StaffTakeBatteriesRequest request)
        {
            // Lấy danh sách pin thuộc subscription
            var batteriesInSub = await _unitOfWork.BatterySwap
                .GetBatteriesBySubscriptionId(request.Access.SubscriptionId);
            var allowSet = batteriesInSub.Select(x => x.BatteryOutId)
                                         .Where(id => !string.IsNullOrWhiteSpace(id))
                                         .ToHashSet();


            var requestIds = (request.BatteriesId ?? new List<string>())
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id.Trim())
                .Distinct()
                .ToList();


            var idsToProcess = requestIds.Where(id => allowSet.Contains(id)).ToList();
            if (idsToProcess.Count == 0)
                return new ServiceResult { Status = 404, Message = "Không có pin hợp lệ để nhập kho." };

            var batteries = await _unitOfWork.Batteries.GetAllQueryable()
                .Where(b => idsToProcess.Contains(b.BatteryId))
                .ToListAsync();

            var batList = new List<BatListRespone>();
            foreach (var b in batteries)
            {
                b.BatterySwapStationId = request.Access.StationId;
                b.BatteryStatus = "Warehouse";
                b.Soc = Random.Shared.Next(65, 86);
                batList.Add(new BatListRespone { BatteryId = b.BatteryId });
            }

            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = "Success!.",
                Data = batList
            };
        }

        //Bin:  hàm để bên staff xem lịch sử BW của trạm
        public async Task<ServiceResult> BatterySwapList(UserRequest request)
        {
            var getstation = await _unitOfWork.StationStaffs.GetStationWithStaffIdAsync(request.UserId);
            var BatterySwapList = await _unitOfWork.BatterySwap.GetListBatterySwap(getstation.BatterySwapStationId);
            var result = new List<BatterySwapListRespone>();
            foreach (var batterySwap in BatterySwapList)
            {
                var getuser = await _unitOfWork.Subscriptions.GetUserBySubscriptionIdAsync(batterySwap.SubscriptionId);

                result.Add(new BatterySwapListRespone
                {
                    StaffId = batterySwap.SubscriptionId,
                    UserId = getuser.UserId,
                    UserName = getuser.UserName,
                    BatteryIdIn = string.IsNullOrWhiteSpace(batterySwap.BatteryInId) ? "null" : batterySwap.BatteryInId,
                    BatteryIdOut = string.IsNullOrWhiteSpace(batterySwap.BatteryOutId) ? "null" : batterySwap.BatteryOutId,

                    Status = batterySwap.Status,
                    Time = TimeOnly.FromDateTime(batterySwap.CreateAt)
                });
            }
            return new ServiceResult
            {
                Status = 200,
                Message = "Success",
                Data = result

            };
        }



        //Hàm này để check coi là cục pin đó có đúng theo gói không, chỗ hàm này sẽ là nơi để trả cho fe để cho fe giả lập lấy pin ra
        // Ở hàm này làm khá nhiều việc:
        // 1.0. Check Bat có đúng với gói không
        // 1. Random thông số Session để tính các thứ như milleage base. Done
        // 2. Tính milleage base + RemainingSwap.  Done
        // 3. Cập nhật lại pillarSlot.Status là returned và cục pin out ra sẽ là Using
        // 4. Cập nhật lại battery.Status là Using và đồng thời là gán cái Battery.StationId là null nếu là in using và sẽ là có id nếu là charging và cập nhật thêm là soc và soh
        public async Task<ServiceResult> CheckBatteryAvailable(BatterySwapListRequest requestBatteryList)
        {
            //Nemo:Chỗ này là check coi cái battery vào đã đúng chưa, nếu chưa thì sẽ nhảy ra lỗi là đưa vào different battery
            var getBatteryAvailable = await GetBatteryInUsingAvailable(requestBatteryList.AccessRequest.SubscriptionId);


            List<BatteryDto> getUnavailableBattery = await GetUnvailableBattery(requestBatteryList.AccessRequest.SubscriptionId, requestBatteryList.BatteryDtos);
            if (getUnavailableBattery != null && getUnavailableBattery.Any())
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "You’re trying to return a different battery",
                    Data = getUnavailableBattery,
                };
            }

            //Nemo: Cái này tìm subId để có thể update được currentMilleageBase và update được số lần swap
            var getSub = await _subRepo.GetByIdAsync(requestBatteryList.AccessRequest.SubscriptionId);

            //Chỗ này lấy ra các pillarSlot mà có trong cái StationId đó
            var getPillarSlot = await GetPillarSlot(requestBatteryList.AccessRequest.StationId);
            var batteryIds = requestBatteryList.BatteryDtos.Select(x => x.BatteryId).ToList();

            // BƯỚC 1: TẢI TẤT CẢ BẢN GHI "Using" TRƯỚC (tracked, để update sau)
            var swapOutHistories = await _batSwapRepo.GetAllAsync(
                predicate: b =>
                    batteryIds.Contains(b.BatteryOutId) &&
                    b.SubscriptionId == requestBatteryList.AccessRequest.SubscriptionId &&
                    b.Status == "Using",
                asNoTracking: false
            );
            var getTransaction = await _unitOfWork.Trans.GetAllQueryable().FirstOrDefaultAsync(x => x.SubscriptionId == requestBatteryList.SubscriptionId
                && x.Status == "Waiting");
            var getSessionList = await GenerateBatterySession(requestBatteryList.SubscriptionId);
            var getBatRequest = new BatterySwapRequest
            {
                SubId = requestBatteryList.SubscriptionId,
                MonthSwap = DateTime.UtcNow.ToLocalTime().Month,
                YearSwap = DateTime.UtcNow.ToLocalTime().Year,
            };
            var calMilleageFee = await CalMilleageFee(getBatRequest, getSessionList);
            getTransaction.Fee += calMilleageFee;
            await _unitOfWork.Trans.UpdateAsync(getTransaction);
            await _unitOfWork.SaveChangesAsync();
            // Tạo dictionary để tra cứu nhanh
            var swapHistoryDict = swapOutHistories.ToDictionary(x => x.BatteryOutId, x => x);

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
                    if (!swapHistoryDict.TryGetValue(item.BatteryId, out var swapOutHistory))
                    {
                        // Không có bản ghi "Using" → bỏ qua hoặc báo lỗi
                        continue;
                    }

                    // CẬP NHẬT TRỰC TIẾP
                    swapOutHistory.Status = "Returned";

                    //Cái này là để tạo ra 1 bản ghi mới trong lịch sử swap
                    var updateBatSwapIn = new BatterySwap
                    {
                        SwapHistoryId = await GenerateBatterySwapId(),
                        SubscriptionId = requestBatteryList.AccessRequest.SubscriptionId,
                        BatterySwapStationId = requestBatteryList.AccessRequest.StationId,
                        BatteryOutId = null,
                        BatteryInId = item.BatteryId,
                        SwapDate = DateOnly.FromDateTime(DateTime.Today),
                        Note = "",
                        Status = "Returned",
                        CreateAt = DateTime.UtcNow.ToLocalTime(),
                    };

                    //Sau khi tạo ra 1 bảng là returned thì sẽ update lại cục pin 
                    getSlot.BatteryId = item.BatteryId;
                    getSlot.AppointmentId = null;
                    getSlot.PillarStatus = "Unavailable";
                    updateBat.BatteryStatus = "Charging";
                    updateBat.Soc = Random.Shared.Next(1, 31);
                    updateBat.UpdateAt = DateTime.UtcNow.ToLocalTime();
                    updateBat.BatterySwapStationId = requestBatteryList.AccessRequest.StationId;
                    //Update lại cái pin được trả vô
                    await _batSwapRepo.CreateAsync(updateBatSwapIn);

                    await _slotRepo.UpdateAsync(getSlot);
                    await _batRepo.UpdateAsync(updateBat);
                }

            }

            // chỗ này đang sai, nó không tính theo batId hay là theo tháng
            // 1. Tạo session
            var getMilleageBase = await CalMilleageBase(getSessionList);

            // 2. Lưu session NGAY
            await _unitOfWork.BatSession.BulkCreateAsync(getSessionList);

            getSub.CurrentMileage += getMilleageBase.Sum(x => x.MilleageBase);
            getSub.RemainingSwap += await _unitOfWork.Subscriptions.GetNumberOfbatteryInSub(requestBatteryList.SubscriptionId);

            await _subRepo.UpdateAsync(getSub);

            await _unitOfWork.SaveChangesAsync();

            bool checkBooking = await _bookService.CheckBookingExist(requestBatteryList.SubscriptionId);
            List<BatteryLockDto> getBatLockList = null; // Giả sử BatteryLockDto có BatteryId, SlotId
            if (checkBooking)
            {
                getBatLockList = await GetBatLock(requestBatteryList.SubscriptionId);
            }

            //ĐÂY LÀ CÁI CHỖ ĐỂ LẤY RA ĐƯỢC LÀ CẦN MỞ BAO NHIÊU SLOT PINNNNNNNNNN
            int topNumber = await _unitOfWork.Subscriptions.GetNumberOfbatteryInSub(requestBatteryList.AccessRequest.SubscriptionId);



            //Chỗ này để đưa cho FE để FE hiển thị các slot pin available để user để lấy pin ra

            var getPillarSlotList = await _unitOfWork.Stations.GetBatteriesAvailableByPillarIdAsync(requestBatteryList.PillarId, topNumber);

            //lúc này là trả về các slot pin để FE hiển thị (bao gồm id pin và slotId)
            var dtoList = getPillarSlotList.Select(slot => new BatteryDto
            {
                SlotId = slot.SlotId,
                BatteryId = slot.BatteryId,
            }).ToList();
            if (getBatLockList != null)
            {
                dtoList = getBatLockList.Select(slot => new BatteryDto
                {
                    SlotId = slot.SlotId,
                    BatteryId = slot.BatteryId,
                }).ToList();
            }
            return new ServiceResult
            {
                Status = 200,
                Message = "Successfull",
                Data = new BatteryRequest
                {
                    BatteryDtos = dtoList,
                    SubscriptionId = requestBatteryList.AccessRequest.SubscriptionId,
                }
            };
        }


        public async Task<int> UpdatebatSwapOutAsync(string batId, string stationId, string subId)
        {
            var updateBatSwapOutHis = await _batSwapRepo.GetByIdAsync(bat =>
                    bat.BatteryOutId == batId &&
                    bat.SubscriptionId == subId &&
                    bat.Status == "Using");

            if (updateBatSwapOutHis == null)
                return 0;

            // CHỈ SỬA THUỘC TÍNH → KHÔNG GỌI UpdateAsync
            updateBatSwapOutHis.SwapDate = DateOnly.FromDateTime(DateTime.Today);
            updateBatSwapOutHis.Status = "Returned";
            await _batSwapRepo.UpdateAsync(updateBatSwapOutHis);

            // GỌI SaveChangesAsync DUY NHẤT MỘT LẦN
            return await _unitOfWork.SaveChangesAsync();
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
                PillarId = slot.BatterySwapPillarId,
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


        //Hàm này để lấy được cục pin phù hợp, lấy pin 
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
            var currDate = DateOnly.FromDateTime(DateTime.UtcNow.ToLocalTime());
            TimeSpan diff;
            // Lấy danh sách tất cả pin trong Subscription đó
            var batteriesInSub = await _unitOfWork.BatterySwap
                .GetBatteriesBySubscriptionId(subId);

            List<BatterySession> allSessions = new();

            foreach (var battery in batteriesInSub)
            {
                diff = currDate.ToDateTime(TimeOnly.MinValue) - battery.SwapDate.ToDateTime(TimeOnly.MinValue);
                var sessions = await GenerateBatterySessionForBattery(battery.BatteryOutId, diff);
                allSessions.AddRange(sessions);
            }


            return allSessions;
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
        //Công việc của hàm này:
        // 1. đầu tiên fe cần trả vô là những battery nào được lấy ra, 
        public async Task<ServiceResult> SwapOutBattery(BatterySwapOutListRequest requestDto)
        {
            //1. Check coi là có cục pin nào được trả ra không
            if (requestDto?.BatteryDtos == null || !requestDto.BatteryDtos.Any())
                return new ServiceResult { Status = 400, Message = "No batteries to swap out" };

            //2. Check SubId đã đúng chưa
            var subId = requestDto.AccessRequest?.SubscriptionId ?? string.Empty;
            var stationId = requestDto.AccessRequest?.StationId ?? string.Empty;
            if (string.IsNullOrEmpty(subId) || string.IsNullOrEmpty(stationId))
                return new ServiceResult { Status = 400, Message = "Invalid subscription or station" };

            // danh sách slotId FE gửi
            var requestedSlotIds = requestDto.BatteryDtos.Select(x => x.SlotId).Distinct().ToList();

            //3. Kiểm tra booking (nếu có)
            bool checkBooking = await _bookService.CheckBookingExist(requestDto.SubscriptionId);

            var swappedBatteries = new List<string>();
            //4. Nếu booking là có thì sẽ bắt đầu đổi status của appointment
            if (checkBooking == true)
            {
                var booking = await _unitOfWork.Bookings.GetAllQueryable()
                                        .Where(x => x.Status == "Processing" && x.SubscriptionId == requestDto.SubscriptionId).FirstOrDefaultAsync();
                booking.Status = "Done";
                // Chỉ lấy các slot đang Lock đúng booking và đúng station
                await _appoinmentRepo.UpdateAsync(booking);
                await _unitOfWork.SaveChangesAsync();

            }
            // Không có booking → luồng cũ (Available)
            foreach (var batteryDto in requestDto.BatteryDtos)
            {
                var pillarEntity = await _slotRepo.GetByIdAsync(x => x.SlotId == batteryDto.SlotId);
                var batteryEntity = await _batRepo.GetByIdAsync(b => b.BatteryId == batteryDto.BatteryId);

                if (pillarEntity != null && batteryEntity != null && (pillarEntity.PillarStatus == "Unavailable" || pillarEntity.PillarStatus == "Lock"))
                {
                    batteryEntity.BatterySwapStationId = null;
                    batteryEntity.BatteryStatus = "Using";
                    pillarEntity.BatteryId = null;
                    pillarEntity.PillarStatus = "Available";
                    pillarEntity.UpdateAt = DateTime.UtcNow;

                    var swapOut = new BatterySwap
                    {
                        SwapHistoryId = await GenerateBatterySwapId(),
                        SubscriptionId = subId,
                        BatterySwapStationId = stationId,
                        BatteryOutId = batteryDto.BatteryId,
                        BatteryInId = null,
                        SwapDate = DateOnly.FromDateTime(DateTime.Today),
                        Note = "",
                        Status = "Using",
                        CreateAt = DateTime.UtcNow.ToLocalTime(),
                    };
                    swappedBatteries.Add(batteryDto.BatteryId);
                    await _batSwapRepo.CreateAsync(swapOut);
                    await _batRepo.UpdateAsync(batteryEntity);
                    await _slotRepo.UpdateAsync(pillarEntity);
                }

            }

            // Cập nhật thông tin subscription (ví dụ tăng RemainingSwap) — giữ logic bạn đang dùng
            var sub = await _subRepo.GetByIdAsync(subId);
            if (sub == null)
                return new ServiceResult { Status = 404, Message = "Subscription not found" };

            sub.RemainingSwap += swappedBatteries.Count;
            await _subRepo.UpdateAsync(sub);
            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = swappedBatteries.Any()
                    ? "Battery swapped out successfully from locked slots."
                    : "No batteries swapped out.",
                Data = new BillAfterSwapOutResponse
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

            var getsation = await _unitOfWork.StationStaffs.GetStationWithStaffIdAsync(requestDto.StaffId);
            if (string.IsNullOrEmpty(getsation.BatterySwapStationId) || string.IsNullOrEmpty(requestDto.StaffId))
            {
                return new ServiceResult { Status = 400, Message = "Invalid station or staff ID" };
            }
            // Xử lý Battery Out
            if (!string.IsNullOrEmpty(requestDto.BatteryOutId))
            {
                var batteryOut = await _unitOfWork.BatterySwap.GetBatteryInventoryInStaiion(getsation.BatterySwapStationId, requestDto.BatteryOutId);

                if (batteryOut != null)
                {
                    batteryOut.BatterySwapStationId = null;
                    batteryOut.BatteryStatus = "Using";
                    await _batRepo.UpdateAsync(batteryOut);
                    var swapOut = new BatterySwap
                    {
                        SwapHistoryId = await GenerateBatterySwapId(),
                        SubscriptionId = requestDto.SubId,
                        BatterySwapStationId = getsation.BatterySwapStationId,
                        BatteryOutId = requestDto.BatteryOutId,
                        BatteryInId = null,
                        SwapDate = DateOnly.FromDateTime(DateTime.Today),
                        Note = $"Staff {requestDto.StaffId} transferred out",
                        Status = "Using",
                        CreateAt = DateTime.UtcNow.ToLocalTime(),
                    };
                    await _batSwapRepo.CreateAsync(swapOut);
                    await _unitOfWork.SaveChangesAsync();
                }
            }

            // Xử lý Battery In
            if (!string.IsNullOrEmpty(requestDto.BatteryInId))
            {
                var batteryIn = await _batRepo.GetByIdAsync(b => b.BatteryId == requestDto.BatteryInId);
                if (batteryIn != null)
                {
                    batteryIn.BatterySwapStationId = getsation.BatterySwapStationId;
                    batteryIn.BatteryStatus = "Maintanance";
                    await _batRepo.UpdateAsync(batteryIn);
                    var swapIn = new BatterySwap
                    {
                        SwapHistoryId = await GenerateBatterySwapId(),
                        SubscriptionId = requestDto.SubId,
                        BatterySwapStationId = getsation.BatterySwapStationId,
                        BatteryOutId = null,
                        BatteryInId = requestDto.BatteryInId,
                        SwapDate = DateOnly.FromDateTime(DateTime.Today),
                        Note = $"Staff {requestDto.StaffId} transferred out",
                        Status = "Returned",
                        CreateAt = DateTime.UtcNow.ToLocalTime(),
                    };
                    await _batSwapRepo.CreateAsync(swapIn);
                    await _unitOfWork.SaveChangesAsync();
                }

            }

            return new ServiceResult
            {
                Status = 200,
                Message = "Battery transfer processed successfully"
            };
        }
        public async Task<ServiceResult> StaffSwapBattery(StaffBatteryRequest requestDto)
        {
            var currDate = DateOnly.FromDateTime(DateTime.UtcNow.ToLocalTime());
            //Lấy trạm của staff
            var station = await _unitOfWork.StationStaffs.GetStationWithStaffIdAsync(requestDto.StaffId);
            if (station == null || string.IsNullOrEmpty(station.BatterySwapStationId))
                return new ServiceResult { Status = 400, Message = "Invalid station or staff ID" };

            var stationId = station.BatterySwapStationId;
            var getsub = await _unitOfWork.Subscriptions.GetByIdAsync(requestDto.SubId);
            //Kiểm tra BatteryOut hợp lệ
            if (string.IsNullOrEmpty(requestDto.BatteryOutId))
                return new ServiceResult { Status = 400, Message = "BatteryOutId is required" };

            var batteryOut = await _batRepo.GetByIdAsync(b => b.BatteryId == requestDto.BatteryOutId);
            if (batteryOut == null)
                return new ServiceResult { Status = 404, Message = "BatteryOut not found" };

            if (batteryOut.BatterySwapStationId != stationId)
                return new ServiceResult { Status = 400, Message = "Battery not available in this station" };

            if (batteryOut.BatteryStatus == "Using")
                return new ServiceResult { Status = 409, Message = "Battery is already in use" };

            //Xử lý pin ra (swap-out)
            batteryOut.BatterySwapStationId = null;
            batteryOut.BatteryStatus = "Using";
            await _batRepo.UpdateAsync(batteryOut);

            var swapOut = new BatterySwap
            {
                SwapHistoryId = await GenerateBatterySwapId(),
                SubscriptionId = requestDto.SubId,
                BatterySwapStationId = stationId,
                BatteryOutId = requestDto.BatteryOutId,
                Status = "Using",
                SwapDate = DateOnly.FromDateTime(DateTime.Today),
                Note = "Swap started",
                CreateAt = DateTime.UtcNow.ToLocalTime(),
            };
            await _batSwapRepo.CreateAsync(swapOut);

            //Nếu có BatteryIn thì xử lý đổi pin bình thường
            if (!string.IsNullOrEmpty(requestDto.BatteryInId))
            {
                var checkvar = await _unitOfWork.Batteries.FindingBatteryById(requestDto.BatteryInId);
                if (checkvar != null)
                {
                    return new ServiceResult
                    {
                        Status = 404,
                        Message = "You’re trying to return a different battery",
                        Data = checkvar,
                    };
                }

                var batteryIn = await _batRepo.GetByIdAsync(b => b.BatteryId == requestDto.BatteryInId);
                if (batteryIn == null)
                    return new ServiceResult { Status = 404, Message = "BatteryIn not found" };

                var getBatteryIn = await _batSwapRepo.GetAllQueryable()
                                        .Where(bat => bat.BatteryOutId == requestDto.BatteryInId
                                            && bat.SubscriptionId == bat.SubscriptionId
                                            && bat.Status == "Using")
                                        .FirstOrDefaultAsync();
                TimeSpan diff = currDate.ToDateTime(TimeOnly.MinValue) - getBatteryIn.SwapDate.ToDateTime(TimeOnly.MinValue);
                //Cập nhật pin vào (pin trả lại trạm)
                batteryIn.BatterySwapStationId = stationId;
                batteryIn.BatteryStatus = "Warehouse";
                batteryIn.Soc = new Random().Next(1, 100); // giả lập SOC
                getBatteryIn.Status = "Returned";
                await _batRepo.UpdateAsync(batteryIn);

                await _unitOfWork.BatterySwap.UpdateAsync(getBatteryIn);
                await _unitOfWork.SaveChangesAsync();
                var swapIn = new BatterySwap
                {
                    SwapHistoryId = await GenerateBatterySwapId(),
                    SubscriptionId = requestDto.SubId,
                    BatterySwapStationId = stationId,
                    BatteryInId = requestDto.BatteryInId,
                    Status = "Returned",
                    SwapDate = DateOnly.FromDateTime(DateTime.Today),
                    Note = "Swap completed",
                    CreateAt = DateTime.UtcNow.ToLocalTime(),
                };
                await _batSwapRepo.CreateAsync(swapIn);

                //Tạo session cho battery-in
                var sessions = await GenerateBatterySessionForBattery(requestDto.BatteryInId, diff);
                await _unitOfWork.BatSession.BulkCreateAsync(sessions);

                //Tính mileage base (km người dùng đã đi) và mileage fee (phí vượt km / penalty fee)
                var mileageBase = await CalMilleageBase(sessions);

                var mileageFee = await CalMilleageFee(
                    new BatterySwapRequest
                    {
                        SubId = requestDto.SubId,
                        MonthSwap = DateTime.UtcNow.Month,
                        YearSwap = DateTime.UtcNow.Year
                    },
                    sessions
                );

                var transaction = await _unitOfWork.Trans.GetAllQueryable()
                    .FirstOrDefaultAsync(t =>
                        t.SubscriptionId == requestDto.SubId &&
                        t.Status == "Waiting" &&
                        t.TransactionType == "Monthly Fee"
                    );

                if (transaction == null)
                {
                    var newTrans = await GenerateTransactionId();
                    transaction = new Transaction
                    {
                        TransactionId = newTrans,
                        SubscriptionId = requestDto.SubId,
                        UserDriverId = getsub.UserDriverId,
                        TransactionDate = DateTime.UtcNow.ToLocalTime(),
                        TransactionType = "Monthly Fee",
                        Fee = mileageFee,
                        TotalAmount = mileageFee,
                        Currency = "VND",
                        PaymentMethod = "QR",
                        Status = "Waiting",
                        CreateAt = DateTime.UtcNow.ToLocalTime(),
                    };

                    await _unitOfWork.Trans.CreateAsync(transaction);
                }
                else
                {
                    // ĐÃ có transaction chờ 
                    transaction.Fee += mileageFee;
                    transaction.TotalAmount += mileageFee;
                    await _unitOfWork.Trans.UpdateAsync(transaction);
                }

                //Cập nhật subscription
                var sub = await _subRepo.GetByIdAsync(requestDto.SubId);
                if (sub != null)
                {
                    sub.CurrentMileage += mileageBase.Sum(x => x.MilleageBase);
                    sub.RemainingSwap += await _unitOfWork.Subscriptions.GetNumberOfbatteryInSub(requestDto.SubId);

                    await _subRepo.UpdateAsync(sub);
                }
            }
            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = $"Swap success — Out: {requestDto.BatteryOutId}, In: {requestDto.BatteryInId ?? "None"}"
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
            newPillarSlot.PillarStatus = "Unavailable";
            newPillarSlot.UpdateAt = DateTime.UtcNow.ToLocalTime();
            await _slotRepo.UpdateAsync(newPillarSlot);

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


        //Nemo: cái này để tính ra được số lượt đổi pin theo tháng (admin)
        public async Task<BatterySwapMonthlyResponse> GetBatterySwapMonthly()
        {
            var currentYear = DateTime.UtcNow.ToLocalTime().Year;
            var getBatterySwap = await _batSwapRepo.GetAllQueryable()
                                    .Where(bs => bs.SwapDate.Year == currentYear
                                    && bs.Status == "Returned"
                                    && bs.BatteryInId != null)
                                    .GroupBy(bs => bs.SwapDate.Month)
                                    .Select(bs => new
                                    {
                                        Month = bs.Key,
                                        BatterySwapInMonth = bs.Count(),
                                    })
                                    .ToListAsync();

            // Tạo danh sách 12 tháng trong năm
            var monthlyList = Enumerable.Range(1, 12)
                .Select(m =>
                {
                    var monthData = getBatterySwap.FirstOrDefault(d => d.Month == m);
                    int count = monthData?.BatterySwapInMonth ?? 0;

                    return new BatterySwapMonthlyList
                    {
                        Month = m,
                        BatterySwapInMonth = count
                    };
                })
                .ToList();

            // Tính trung bình cả năm (nếu cần)
            var avg = monthlyList.Count > 0
                ? (int)Math.Round(monthlyList.Average(x =>
                    x.BatterySwapInMonth / (double)DateTime.DaysInMonth(currentYear, x.Month)), 0)
                : 0;

            // Trả về 1 object tổng hợp
            return new BatterySwapMonthlyResponse
            {
                BatterySwapMonthlyLists = monthlyList,
                AvgBatterySwap = avg
            };
        }


        private async Task<string> GetPillarSlotAvailable(AccessRequest requestDto)
        {
            int topNumber = await _unitOfWork.Subscriptions.GetNumberOfbatteryInSub(requestDto.SubscriptionId);
            var getPillarInStation = await _pillarRepo.GetAllQueryable()
                                        .Where(pi => pi.BatterySwapStationId == requestDto.StationId)
                                        .Include(pi => pi.BatterySwapStation)
                                        .Select(g => new
                                        {
                                            PillarId = g.BatterySwapPillarId
                                        })
                                        .ToListAsync();
            foreach (var item in getPillarInStation)
            {
                var getBat = await _slotService.GetBatteriesInPillarByPillarIdAsync(item.PillarId);
                int result = getBat.Count();
                if (result > topNumber)
                {
                    return item.PillarId;
                }
            }

            return string.Empty;
        }

        private async Task<string> GetPillarSlotSwapIn(AccessRequest requestDto)
        {
            int topNumber = await _unitOfWork.Subscriptions.GetNumberOfbatteryInSub(requestDto.SubscriptionId);
            var getPillarInStation = await _pillarRepo.GetAllQueryable()
                                        .Where(pi => pi.BatterySwapStationId == requestDto.StationId)
                                        .Include(pi => pi.BatterySwapStation)
                                        .Select(g => new
                                        {
                                            PillarId = g.BatterySwapPillarId
                                        })
                                        .ToListAsync();
            foreach (var item in getPillarInStation)
            {
                var getBat = await _slotRepo.GetAllQueryable()
                                .Where(x => x.PillarStatus == "Available")
                                .ToListAsync();
                int result = getBat.Count();
                if (result >= topNumber)
                {
                    return item.PillarId;
                }
            }

            return string.Empty;
        }
        //Nemo: Pillarslot empty
        private async Task<List<int>> GetSlotSwapIn(AccessRequest requestDto)
        {
            int topNumber = await _unitOfWork.Subscriptions.GetNumberOfbatteryInSub(requestDto.SubscriptionId);
            var getPillarInStation = await _pillarRepo.GetAllQueryable()
                                        .Where(pi => pi.BatterySwapStationId == requestDto.StationId)
                                        .Include(pi => pi.BatterySwapStation)
                                        .Select(g => new
                                        {
                                            PillarId = g.BatterySwapPillarId
                                        })
                                        .ToListAsync();
            foreach (var item in getPillarInStation)
            {
                var getBat = await _slotRepo.GetAllQueryable()
                                .Where(x => x.PillarStatus == "Available"
                                && x.BatterySwapPillarId == item.PillarId)
                                .ToListAsync();
                int result = getBat.Count();
                var getList = getBat;
                if (result >= topNumber)
                {
                    return await _slotRepo.GetAllQueryable()
                            .Where(x => x.BatterySwapPillar.BatterySwapPillarId == item.PillarId
                            && x.PillarStatus == "Available")
                            .OrderBy(x => x.SlotNumber) // sắp xếp nếu cần
                            .Take(topNumber)
                            .Select(x => x.SlotId) // chỉ lấy SlotId
                            .ToListAsync();
                }


            }

            return new List<int>();
        }


        //Nemo: Từ phần này trở xuống là về phần tính milleage và phí


        //1. Lấy tất cả mã pin mà subId đó trả trong tháng, năm đó
        //2. Sau khi lấy mã pin xong thì sẽ cal cho tháng đó
        // Ở đây sẽ truyền vào là tháng và năm đó để có thể lấy được batSession trong đó

        // Nemo: lấy tất cả lịch sử mà có pin in id

        //Nemo: Bước đầu
        private async Task<List<GetBatterySwapList>> GetSwapHistoryByBatId(BatterySwapRequest requestDto)
        {
            var startDate = new DateOnly(requestDto.YearSwap, requestDto.MonthSwap, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1); // ngày cuối tháng

            var getList = await _unitOfWork.BatterySwap.GetAllQueryable()
                .Where(swap =>
                    swap.BatteryInId != null &&
                    swap.SubscriptionId == requestDto.SubId &&
                    swap.SwapDate >= startDate &&
                    swap.SwapDate <= endDate)
                .Select(swap => new GetBatterySwapList
                {
                    BatteryId = swap.BatteryInId,
                    SwapDate = swap.SwapDate
                })
                .ToListAsync();

            return getList;
        }

        // Nemo: Tính ra quãng đường cơ sở từ bat đã lưu
        // Nemo: Đây là tính Milleage cho tháng mà người dùng mượn
        //Milleage 2

        //Bước 2
        private async Task<decimal?> CalMilleageInMonth(List<GetBatterySwapList> requestDto)
        {
            decimal? result = 0;

            foreach (var item in requestDto)
            {
                var getbatSessionList = await _batSessionRepo.GetAllQueryable()
                                        .Where(bat => bat.BatteryId == item.BatteryId &&
                                               bat.Timestamp.Month == item.SwapDate.Month &&
                                               bat.Timestamp.Year == item.SwapDate.Year)
                                        .ToListAsync();

                var getMilleageBase = await CalMilleageBase(getbatSessionList);

                // Tính tổng mileage cho tháng hiện tại
                var monthlyMileage = getMilleageBase
                    .Where(m => m.Month.Month == item.SwapDate.Month && m.Month.Year == item.SwapDate.Year)
                    .Sum(m => m.MilleageBase);

                result += monthlyMileage;
            }

            return result;
        }


        //Đây là hàm tính milleage base theo tháng
        // Nemo: Đây là hàm tính milleage khi đưa pin vào
        //Milleage 1
        //Bước 3
        public async Task<List<MilleageBaseMonthly>> CalMilleageBase(List<BatterySession> batSession)
        {
            var sortedSessions = batSession.OrderBy(s => s.Timestamp).ToList();

            // Lọc chỉ "Use end"
            var useEndSessions = sortedSessions.Where(s => s.EventType.Equals("Use end")).ToList();

            // Tính effective month/year theo quy tắc: <=28 thuộc tháng hiện tại, >28 thuộc tháng sau
            var milleageBaseMonthly = useEndSessions
                .Select(s => new
                {
                    Timestamp = s.Timestamp,
                    EnergyDeltaWh = s.EnergyDeltaWh,  // Thêm dòng này để có thể sử dụng trong Sum
                    EffectiveYear = s.Timestamp.Month == 12 && s.Timestamp.Day > 28
                        ? s.Timestamp.Year + 1
                        : s.Timestamp.Year,
                    EffectiveMonth = s.Timestamp.Month == 12 && s.Timestamp.Day > 28
                        ? 1
                        : (s.Timestamp.Day > 28 ? s.Timestamp.Month + 1 : s.Timestamp.Month)
                })
                .GroupBy(x => new { x.EffectiveYear, x.EffectiveMonth })
                .Select(monthGroup => new MilleageBaseMonthly
                {
                    Year = new DateTime(monthGroup.Key.EffectiveYear, 1, 1),  // DateTime đại diện cho năm effective
                    Month = new DateTime(monthGroup.Key.EffectiveYear, monthGroup.Key.EffectiveMonth, 1),  // DateTime đại diện cho tháng effective
                    MilleageBase = monthGroup.Sum(x => (-x.EnergyDeltaWh ?? 0m) / 60m)  // Sử dụng x.EnergyDeltaWh (không phải x.Timestamp.EnergyDeltaWh)
                })
                .ToList();
            return milleageBaseMonthly;
        }


        //Nemo: Đây là hàm sẽ tính phí dựa trên Milleage 1 và Milleage 2
        // 1-->2-->3
        // 2 bao gồm 1
        //1. Lấy ra được plan thông qua subId
        //2. Từ subId đó lấy ra được fee của plan đó
        //3. Sau đó thì sử dụng calMilleageBase để cho ra được quãng đường trong session theo tháng và năm
        //4. Sau khi lấy xong thì sẽ lấy thêm getBatHistory nếu có pin được trả trước đó trong tháng thì sẽ cộng dồn
        //5. Nếu không có thì cứ tính bình thường thôi
        private async Task<decimal> CalMilleageFee(BatterySwapRequest requestDto, List<BatterySession> newBatSession)
        {
            // 1. Lấy plan từ subscription
            var getPlanBySubId = await _batSwapRepo.GetAllQueryable()
                                    .Where(swap => swap.SubscriptionId == requestDto.SubId)
                                    .Include(swap => swap.Subscription)
                                    .Select(swap => swap.Subscription.PlanId)
                                    .FirstOrDefaultAsync();

            if (string.IsNullOrEmpty(getPlanBySubId))
                return 0;

            // 2. Lấy mileage base của plan
            var planMileageBase = await _unitOfWork.Plans.GetAllQueryable()
                                    .Where(p => p.PlanId == getPlanBySubId)
                                    .Select(p => p.MileageBaseUsed)
                                    .FirstOrDefaultAsync();

            // 3. Lấy fee tiers
            var feeList = await GetPlanFee(getPlanBySubId);

            // 4. Lấy lịch sử swap để tính mileage các pin đã trả
            var getBatHistory = await GetSwapHistoryByBatId(requestDto);

            // 5. Tính mileage của các pin đã trả trong tháng
            var existingMileage = await CalMilleageInMonth(getBatHistory) ?? 0;

            // 6. Tính mileage của pin mới (chưa lưu DB)
            var newBatMileageList = await CalMilleageBase(newBatSession);
            var newMileage = newBatMileageList
                .Where(m => m.Month.Month == requestDto.MonthSwap &&
                       m.Month.Year == requestDto.YearSwap)
                .Sum(m => m.MilleageBase) ?? 0;

            // 7. Tính tổng mileage và mileage vượt
            var totalMileage = existingMileage + newMileage;
            var excessMileage = (totalMileage - planMileageBase) ?? 0; // Thêm ?? 0

            // 8. Nếu không vượt, return 0
            if (excessMileage <= 0)
                return 0;

            // 9. Tính phí vượt theo tier
            var excessFee = CalculateExcessFee(excessMileage, feeList);

            return excessFee;
        }

        // Hàm tính phí vượt theo tier
        private decimal CalculateExcessFee(decimal excessMileage, List<GetPlanFeeResponse> feeList)
        {
            decimal totalFee = 0;
            var remainingMileage = excessMileage;

            // Sắp xếp fee theo MinValue tăng dần
            var sortedFees = feeList.Where(f => f.TypeOfFee == "Excess Mileage")
                                   .OrderBy(f => f.MinValue)
                                   .ToList();

            foreach (var fee in sortedFees)
            {
                if (remainingMileage <= 0)
                    break;

                // Tính khoảng mileage trong tier hiện tại
                var tierMileageCapacity = fee.MaxValue - fee.MinValue;
                var mileageInThisTier = Math.Min(remainingMileage, tierMileageCapacity);

                if (mileageInThisTier > 0)
                {
                    totalFee += mileageInThisTier * fee.Amount;
                    remainingMileage -= mileageInThisTier;
                }
            }

            // Nếu vẫn còn mileage vượt sau tất cả tiers, tính theo tier cuối
            if (remainingMileage > 0 && sortedFees.Any())
            {
                var lastTier = sortedFees.Last();
                totalFee += remainingMileage * lastTier.Amount;
            }

            return totalFee;
        }


        //Nemo: Tìm phí vượt
        private async Task<List<GetPlanFeeResponse>> GetPlanFee(string planId)
        {
            return await _feeRepo.GetAllQueryable()
                            .Where(fee => fee.PlanId == planId && fee.TypeOfFee.Equals("Excess Mileage"))
                            .OrderByDescending(fee => fee.MinValue)
                            .Select(fee => new GetPlanFeeResponse
                            {
                                PlanId = planId,
                                TypeOfFee = fee.TypeOfFee,
                                MinValue = fee.MinValue,
                                MaxValue = fee.MaxValue,
                                Amount = fee.Amount,
                                PlanFeeId = fee.FeeId,
                            })
                            .ToListAsync();
        }





        // Hàm tạo session riêng cho từng pin
        private async Task<List<BatterySession>> GenerateBatterySessionForBattery(string batId, TimeSpan diff)
        {
            List<BatterySession> getBatterSessionList = new();
            for (int i = 0; i <= diff.Days; i++)
            {
                var eventTypes = new[] { "Use start", "Use end", "Charge start", "Charge end" };
                var eventType = eventTypes[_random.Next(eventTypes.Length)];
                decimal socDelta = 0;
                decimal energyDelta = 0;

                if (eventType == "Use start" || eventType == "Charge start")
                {
                    socDelta = 0m;
                    energyDelta = 0m;
                }
                else if (eventType == "Use end")
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
                var range = (DateTime.Now.ToLocalTime() - startDate).TotalSeconds;
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

        //Nemo: Total Swap in day for staff
        public async Task<int> CalNumberOfSwapDailyForStaff(string staffId)
        {
            var getStation = await _unitOfWork.StationStaffs.GetStationWithStaffIdAsync(staffId);
            var getDateNow = DateTime.UtcNow.Date.ToLocalTime().Day;
            var getBatterySwap = await _batSwapRepo.GetAllQueryable()
                        .Where(bs => bs.SwapDate.Day == getDateNow
                            && bs.Status == "Returned"
                            && bs.BatteryOutId != null
                            && bs.BatterySwapStationId == getStation.BatterySwapStationId)
                        .CountAsync();
            return getBatterySwap;
        }


        //Nemo: Total Swap in day for admin
        public async Task<BatterySwapInDayResponse> CalNumberOfSwapDailyForAdmin()
        {
            var getDateNow = DateTime.UtcNow.Date.ToLocalTime().Day;
            var getDatePrev = DateTime.UtcNow.Date.ToLocalTime().AddDays(-1).Day;
            var getBatterySwap = await _batSwapRepo.GetAllQueryable()
                        .Where(bs => bs.SwapDate.Day == getDateNow
                            && bs.Status == "Returned"
                            && bs.BatteryOutId != null)
                        .CountAsync();
            var getPrevDayBatterySwap = await _batSwapRepo.GetAllQueryable()
                        .Where(bs => bs.SwapDate.Day == getDatePrev
                            && bs.Status == "Returned"
                            && bs.BatteryOutId != null)
                        .CountAsync();
            if (getBatterySwap == 0 || getPrevDayBatterySwap == 0)
            {
                return new BatterySwapInDayResponse
                {
                    TotalSwap = getBatterySwap,
                    PercentSwap = 0,
                };
            }

            return new BatterySwapInDayResponse
            {
                TotalSwap = getBatterySwap,
                PercentSwap = getBatterySwap / getPrevDayBatterySwap,
            };
        }

        public async Task<ServiceResult> TranferBatBetweenStation(BatteryTranferRequest requestDto)
        {
            var getBatteryTransferList = requestDto.BatId;
            var getAdmin = await _unitOfWork.Users.GetAdminAsync();
            foreach (var item in getBatteryTransferList)
            {
                var createTransfer = new TransferLog
                {
                    OldLocationId = requestDto.StationFrom,
                    NewLocationId = requestDto.StationTo,
                    BatteryId = item,
                    Reason = requestDto.Reason,
                    TransferStatus = "Success",
                    UserAdminId = getAdmin.UserId,
                    CreatedAt = DateTime.UtcNow.ToLocalTime(),
                };
                var getbatStation = await _batRepo.GetAllQueryable()
                                            .Where(x => x.BatteryId == item)
                                            .FirstOrDefaultAsync();
                getbatStation.BatterySwapStationId = requestDto.StationTo;
                await _batRepo.UpdateAsync(getbatStation);

            }
            var result = await _unitOfWork.SaveChangesAsync();

            if (result < 0)
            {
                return new ServiceResult
                {
                    Status = 400,
                    Message = "Something wrong",
                };
            }

            return new ServiceResult
            {
                Status = 200,
                Message = "Successfull"
            };
        }

        private async Task<List<BatteryLockDto>> GetBatLock(string subId)
        {
            var getSlotIn = await _unitOfWork.PillarSlots.GetAllQueryable()
                                            .Include(x => x.Appointment)
                                            .Where(app => app.Appointment.SubscriptionId == subId)
                                            .Select(x => new BatteryLockDto
                                            {
                                                PillarId = x.BatterySwapPillarId,
                                                SlotId = x.SlotId,
                                                BatteryId = x.BatteryId,
                                            })
                                            .ToListAsync();

            return getSlotIn;
        }

        private async Task<List<int>> GetSlotLockSwapIn(string pillarId, string subId)
        {
            int topNumber = await _unitOfWork.Subscriptions.GetNumberOfbatteryInSub(subId);
            var unavailableSlots = await _slotRepo.GetAllQueryable()
                    .Where(x => x.BatterySwapPillar.BatterySwapPillarId == pillarId
                                && x.PillarStatus == "Available")
                    .OrderBy(x => x.SlotNumber) // Sắp xếp theo số thứ tự slot (tùy chọn)
                    .Take(topNumber)
                    .Select(x => x.SlotId)
                    .ToListAsync();

            return unavailableSlots;
        }
    }
}


