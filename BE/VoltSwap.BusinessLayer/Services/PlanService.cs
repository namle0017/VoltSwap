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
    public class PlanService : BaseService, IPlanService
    {
        private readonly IGenericRepositories<Plan> _planRepo;
        private readonly IGenericRepositories<Fee> _feeRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public PlanService(
            IServiceProvider serviceProvider,
            IGenericRepositories<Plan> planRepo,
            IGenericRepositories<Fee> feeRepo,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _planRepo = planRepo;
            _feeRepo = feeRepo;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }

        public async Task<ServiceResult> GetPlanAsync()
        {
            var getPlanList = await _planRepo.GetAllAsync();
            var getList = getPlanList.Select(plan => new PlanDtos
            {
                PlanId = plan.PlanId,
                PlanName = plan.PlanName,
                NumberBattery = plan.NumberOfBattery ?? 0,
                DurationDays = plan.DurationDays ?? 0,
                MilleageBaseUsed = plan.MileageBaseUsed ?? 0,
                SwapLimit = plan.SwapLimit ?? 0,
                Price = plan.Price,
            }).ToList();

            return new ServiceResult
            {
                Status = 200,
                Message = "Successfull",
                Data = getList
            };
        }



        public async Task<int> GetDurationDays(string planId)
        {
            var getPlan = await _planRepo.GetByIdAsync(planId);

            if (getPlan == null)
            {
                // Ghi log hoặc ném lỗi tùy theo logic của hệ thống
                throw new Exception($"Plan with ID '{planId}' not found.");
                // hoặc nếu bạn muốn chỉ trả về 0 thay vì lỗi:
                // return 0;
            }

            return getPlan.DurationDays ?? 0;
        }
        public async Task<decimal> GetPriceByPlanId(string planId)
        {
            var getPlan = await _planRepo.GetByIdAsync(planId);

            if (getPlan == null)
            {
                // Ghi log hoặc ném lỗi tùy theo logic của hệ thống
                throw new Exception($"Plan with ID '{planId}' not found.");
                // hoặc nếu bạn muốn chỉ trả về 0 thay vì lỗi:
                // return 0;
            }

            return getPlan.Price ?? 0;
        }
        public async Task<int> GetSwapLimitByPlanId(string newPlanId)
        {
            var getPlan = await _planRepo.GetByIdAsync(newPlanId);

            if (getPlan == null)
            {
                // Ghi log hoặc ném lỗi tùy theo logic của hệ thống
                throw new Exception($"Plan with ID '{newPlanId}' not found.");
                // hoặc nếu bạn muốn chỉ trả về 0 thay vì lỗi:
                // return 0;
            }

            return getPlan.NumberOfBattery ?? 0;
        }

        //Hàm này để lấy ra detail của plan bao gồm tên PlanDtos và Fee của plan đó planId
        public async Task<ServiceResult> GetPlanDetailAsync(string planId)
        {
            var plan = await _planRepo.GetByIdAsync(planId);
            var fees = await _unitOfWork.Plans.GetAllFeeAsync(planId);
            var getFeeList = fees.Select(fee => new PlanFeeResponse
            {
                TypeOfFee = fee.TypeOfFee,
                AmountFee = fee.Amount,
                Unit = fee.Unit,
                MinValue = fee.MinValue,
                MaxValue = fee.MaxValue,
                CalculationMethod = fee.CalculationMethod,
                Description = fee.Description,
            }).ToList();
            if(plan == null && !fees.Any() && fees==null)
            {
                return new ServiceResult
                {
                    Status = 400,
                    Message = "Don't have any Plan"
                };
            }

            return new ServiceResult
            {
                Status = 200,
                Message = "Successfull",
                Data = new PlanDetailResponse
                {
                    Plans = new PlanDtos
                    {
                        PlanId = plan.PlanId,
                        PlanName = plan.PlanName,
                        NumberBattery = plan.NumberOfBattery,
                        DurationDays = plan.DurationDays,
                        MilleageBaseUsed = plan.MileageBaseUsed,
                        SwapLimit = plan.SwapLimit,
                        Price = plan.Price,
                    },
                    PlanFees = getFeeList,
                }
            };


        }

        //Bin: hiển thị các list plan nhưng sẽ suggest thêm các gói recommend cho xe
        public async Task<ServiceResult> GetPlanWithSuggestAsync(List<string> planName)
        {
            planName ??= new List<string>();
            var getPlanList = await _planRepo.GetAllAsync();
            var Plan = new List<PlanSuggestRespone>();

            foreach (var plan in getPlanList)
            {
                bool isSuggest = planName.Contains(plan.PlanName.Trim(), StringComparer.OrdinalIgnoreCase);
                var displayName = plan.PlanName;
                if (isSuggest)
                {
                    displayName = $"{plan.PlanName} (Suggest)";
                }

                Plan.Add(new PlanSuggestRespone
                {
                    PlanId = plan.PlanId,
                    PlanName = displayName,
                    NumberBattery = plan.NumberOfBattery,
                    DurationDays = plan.DurationDays,
                    MilleageBaseUsed = plan.MileageBaseUsed,
                    SwapLimit = plan.SwapLimit,
                    Price = plan.Price,
                    isSuggest = isSuggest
                });
            }

            return new ServiceResult
            {
                Status = 200,
                Message = "Successful",
                Data = Plan
            };
        }

        //Bin: Lấy danh sách tất cả plan và tính thống kê của từng plan và tính tổng người dùng đang sử dụng từng plan. Làm bảnh Sumarry gồm tổng doanh thu tháng và tổng người dùng hiện tại, số lượng đổi pin 
        public async Task<ServiceResult> GetPlanListSummaryAsync(int month, int year)
        {
            var planList = await _planRepo.GetAllAsync();
            var planSummaries = new List<PlanListResponse>();
            
            int TotalActiveUsers = 0;
            decimal TotalRevenue = 0;
            foreach (var plan in planList)
            {
                var userCount = await _unitOfWork.Plans.CountUsersByPlanIdAsync(plan.PlanId, month , year );
                
                var totalRevenueByPlan = await _unitOfWork.Plans.GetRevenueByPlanIdAsync(plan.PlanId, month, year);

                //tính lấy Summary
                TotalActiveUsers += userCount;
                TotalRevenue += totalRevenueByPlan;

                planSummaries.Add(new PlanListResponse
                {
                    
                    PlanName = plan.PlanName,
                    TotalUsers = userCount,
                    TotalRevenue = totalRevenueByPlan
                });
            }
            var TotalSwap = await _unitOfWork.Subscriptions.GetTotalSwapsUsedInMonthAsync(month, year);

            var summary = new ReportSummaryResponse
            {
                TotalMonthlyRevenue = TotalRevenue,
                SwapTimes = TotalSwap,
                ActiveCustomer = TotalActiveUsers
            };
            return new ServiceResult
            {
                Status = 200,
                Message = "Successful",
                Data = new
                          {
                              PlanList = planSummaries,
                              Summary = summary
                          }
            };
        }
    }
}
