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

namespace VoltSwap.BusinessLayer.Services
{
    public class OverviewService : BaseService, IOverviewService
    {
        private readonly IGenericRepositories<User> _userRepo;
        private readonly IGenericRepositories<BatterySwapStation> _batterySwapStationRepo;
        private readonly IGenericRepositories<BatterySwap> _batterySwapRepo;
        private readonly IGenericRepositories<Transaction> _transactionRepo;
        private readonly IUserService _userService;
        private readonly IBatterySwapService _batterySwapService;
        private readonly IStationService _stationService;
        private readonly IReportService _reportService;
        private readonly ITransactionService _transactionService;
        private readonly IPlanService _planService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public OverviewService(
            IServiceProvider serviceProvider,
            IGenericRepositories<User> userRepo,
            IGenericRepositories<BatterySwapStation> batterySwapStationRepo,
            IGenericRepositories<BatterySwap> batterySwapRepo,
            IGenericRepositories<Transaction> transactionRepo,
            IUserService userService,
            IStationService stationService,
            IReportService reportService,
            ITransactionService transactionService,
            IPlanService planService,
            IBatterySwapService batterySwapService,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _userRepo = userRepo;
            _batterySwapStationRepo = batterySwapStationRepo;
            _batterySwapRepo = batterySwapRepo;
            _transactionRepo = transactionRepo;
            _userService = userService;
            _batterySwapService = batterySwapService;
            _stationService = stationService;
            _reportService = reportService;
            _transactionService = transactionService;
            _planService = planService;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }


        //Nemo: feat cho staff Overview
        public async Task<IServiceResult> StaffOverviewAsync(UserRequest requestDto)
        {
            //1. Check staff có active và có đang manage cái trạm nào không
            var checkStaff = await _unitOfWork.StationStaffs.GetAllQueryable()
                .FirstOrDefaultAsync(x => x.UserStaffId == requestDto.UserId);
            var checkStaffById = await _unitOfWork.Users.CheckUserActiveById(requestDto.UserId);
            if (checkStaff != null && checkStaffById != null)
            {
                //2.Chỗ này để lấy số lượng pin trong trạm theo 4 status (maintance, avaialable, Charging và warehouse)
                var getNumberOfBatStatus = await _stationService.GetNumberOfBatteryStatusAsync(requestDto.UserId);
                //3. tính số lượng pin đổi hằng ngày
                var getNumberOfSwapInDay = await _batterySwapService.CalNumberOfSwapDailyForStaff(requestDto.UserId);
                //4. Report cho staff
                var getReportForStaff = await _reportService.GetReportForStaff(requestDto.UserId);
                var dtoList = new StaffOverviewResponse
                {
                    NumberOfBat = getNumberOfBatStatus,
                    SwapInDat = getNumberOfSwapInDay,
                    RepostList = getReportForStaff,
                };

                return new ServiceResult
                {
                    Status = 200,
                    Message = "Get successfull",
                    Data = dtoList,
                };
            }

            return new ServiceResult
            {
                Status = 404,
                Message = "This staff is not manage any station or inactive"
            };

        }


        //Nemo: feat cho admin overview
        public async Task<IServiceResult> AdminOverviewAsync()
        {
            //0. Lấy năm, tháng hiện tại
            int currentMonth = DateTime.UtcNow.ToLocalTime().Month;
            int currentYear = DateTime.UtcNow.ToLocalTime().Year;
            //1. Total Customers
            var totalCustomers = await _userService.GetNumberOfDriver();
            //2. Doanh thu hằng tháng (Monthly Revenue)
            var getRevenueInMonth = await _transactionService.GetMonthlyRevenue();
            //3. Số lượng swap trong ngày
            var getNumberOfSwapInDay = await _batterySwapService.CalNumberOfSwapDailyForAdmin();
            //4. Số lượng trạm đang active
            var getNumberOfActiveStation = await _stationService.GetStationOverviewAsync();
            //5. phần trăm các gói + số lượng khách của từng gói
            var packageUsage = await _planService.GetPlanSummaryAsync(currentMonth, currentYear);
            //6. số lượng swap theo từng tháng.
            var monthlyBatterySwaps = await _batterySwapService.GetBatterySwapMonthly();

            var adminOverview = new AdminOverviewResponse
            {
                NumberOfDriver = totalCustomers,
                MonthlyRevenue = getRevenueInMonth,
                NumberOfSwapDailyForAdmin = getNumberOfSwapInDay,
                StationOverview = getNumberOfActiveStation,
                PlanSummary = packageUsage,
                BatterySwapMonthly = monthlyBatterySwaps,
            };
            return new ServiceResult
            {
                Status = 200,
                Message = "Get Admin overview successfull",
                Data = adminOverview
            };
        }

        public async Task<ServiceResult> GetUserSubscriptionsAsync(CheckSubRequest request)
        {
            var userSubscriptions = await _unitOfWork.Subscriptions
                .GetSubscriptionByUserIdAsync(request.DriverId);


            if (userSubscriptions == null || !userSubscriptions.Any())
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "No subscriptions found for the user."
                };
            }
            var getTrans = await _unitOfWork.Trans
                .GetAllQueryable()
                .Where(trans => trans.UserDriverId == request.DriverId)
                .ToListAsync();

            // Tính tổng Fee theo từng SubscriptionId
            var feeBySubId = getTrans
                .GroupBy(trans => trans.SubscriptionId) // Giả sử Trans có thuộc tính SubscriptionId
                .ToDictionary(
                    g => g.Key,
                    g => (double)g.Sum(trans => trans.Fee)
                );

            // Map subscription thành DTO, gán Fee riêng
            var subscriptionDtos = new List<ServiceOverviewItemDto>();

            foreach (var sub in userSubscriptions.Where(s => s.Status != "Inactive"))
            {
                var batteryDtos = await _batterySwapService.GetBatteryInUsingAvailable(sub.SubscriptionId);

                subscriptionDtos.Add(new ServiceOverviewItemDto
                {
                    SubId = sub.SubscriptionId,
                    PlanName = sub.Plan.PlanName,
                    PlanStatus = sub.Status,
                    SwapLimit = null,
                    Remaining_swap = sub.RemainingSwap,
                    Current_miligate = sub.CurrentMileage,
                    SubFee = feeBySubId.TryGetValue(sub.SubscriptionId, out var fee) ? fee : 0.0,
                    EndDate = sub.EndDate,
                    BatteryDtos = batteryDtos
                });
            }

            return new ServiceResult
            {
                Status = 200,
                Message = "Subscriptions retrieved successfully.",
                Data = subscriptionDtos
            };
    }
    }
}
