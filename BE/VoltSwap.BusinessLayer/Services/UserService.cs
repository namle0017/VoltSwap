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

namespace VoltSwap.BusinessLayer.Services
{
    public class UserService : BaseService, IUserService
    {
        private readonly IGenericRepositories<User> _userRepo;
        private readonly IGenericRepositories<StationStaff> _stationStaffRepo;
        private readonly IGenericRepositories<DriverVehicle> _vehicleRepo;
        private readonly IGenericRepositories<Battery> _BatteryRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public UserService(
            IServiceProvider serviceProvider,
            IGenericRepositories<User> userRepo,
            IGenericRepositories<StationStaff> stationStaffRepo,
            IGenericRepositories<DriverVehicle> vehicleRepo,
            IGenericRepositories<Battery> BatteryRepo,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _userRepo = userRepo;
            _stationStaffRepo = stationStaffRepo;
            _vehicleRepo = vehicleRepo;
            _BatteryRepo = BatteryRepo;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }


        //Cái này để gọi khi mà người dùng cần update sẽ đưa ra các thông tin của người dùng theo DriverUpdate
        public async Task<IServiceResult> GetDriverUpdateInformationAsync(UserRequest requestDto)
        {
            var getUser = await _unitOfWork.Users.GetByIdAsync(us => us.UserId == requestDto.UserId && us.Status == "Active");
            if (getUser == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Something wrong",
                };
            }

            return new ServiceResult
            {
                Status = 200,
                Message = "Get driver information successfully",
                Data = new DriverUpdate
                {
                    DriverId = getUser.UserId,
                    DriverName = getUser.UserName,
                    DriverEmail = getUser.UserEmail,
                    DriverTele = getUser.UserTele,
                    DriverAddress = getUser.UserAddress,
                    DriverStatus = getUser.Status
                },
            };
        }


        public async Task<IServiceResult> UpdateDriverInformationAsync(DriverUpdate requestDto)
        {
            var getUser = await _unitOfWork.Users.CheckUserActive(requestDto.DriverId);
            if (getUser == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Something wrong",
                };
            }
            getUser.UserName = requestDto.DriverName;
            getUser.UserEmail = requestDto.DriverEmail;
            getUser.UserTele = requestDto.DriverTele;
            getUser.UserAddress = requestDto.DriverAddress;
            getUser.Status = requestDto.DriverStatus;
            _userRepo.Update(getUser);
            await _unitOfWork.SaveChangesAsync();
            return new ServiceResult
            {
                Status = 200,
                Message = "Update driver information successfully",
            };
        }


        public async Task<IServiceResult> GetStaffUpdateInformationAsync(UserRequest requestDto)
        {
            var getUser = await _unitOfWork.Users.GetByIdAsync(us => us.UserId == requestDto.UserId && us.Status == "Active");
            if (getUser == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Something wrong",
                };
            }

            var staffStations = await _unitOfWork.StationStaffs.GetStationWithStaffIdAsync(requestDto.UserId);
            var getStation = await _unitOfWork.Stations.GetByIdAsync(staffStations.BatterySwapStationId);
            if (staffStations == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "StationStaff not found",
                };
            }

            return new ServiceResult
            {
                Status = 200,
                Message = "Get staff information successfully",
                Data = new StaffUpdate
                {
                    StaffId = getUser.UserId,
                    StaffName = getUser.UserName,
                    StaffEmail = getUser.UserEmail,
                    StaffTele = getUser.UserTele,
                    StaffAddress = getUser.UserAddress,
                    StaffStatus = getUser.Status,
                    StationStaff = new StationStaffResponse
                    {
                        StationId = staffStations.BatterySwapStationId,
                       
                        ShiftStart = staffStations.ShiftStart,
                        ShiftEnd = staffStations.ShiftEnd
                    }
                },
            };
        }

        //Cái này để cần update để cập nhật thông tin của staff
        public async Task<IServiceResult> UpdateStaffInformationAsync(StaffUpdate requestDto)
        {
            var getUser = await _unitOfWork.Users.GetAllQueryable()
                            .Where(us => us.UserId == requestDto.StaffId && us.Status == "Active").FirstOrDefaultAsync();
            if (getUser == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Something wrong",
                };
            }

            var staffStations = await _unitOfWork.StationStaffs.GetStationWithStaffIdAsync(requestDto.StaffId);
            if (staffStations == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "StationStaff not found",
                };
            }
            //Cập nhật các thông tin cơ bản của staff
            getUser.UserName = requestDto.StaffName;
            getUser.UserEmail = requestDto.StaffEmail;
            getUser.UserTele = requestDto.StaffTele;
            getUser.UserAddress = requestDto.StaffAddress;
            getUser.Status = requestDto.StaffStatus;
            _userRepo.Update(getUser);

            //Cập nhật thông tin về ca làm việc hay là stationID
            staffStations.BatterySwapStationId = requestDto.StationStaff.StationId;
            staffStations.ShiftStart = requestDto.StationStaff.ShiftStart;
            staffStations.ShiftEnd = requestDto.StationStaff.ShiftEnd;
            _stationStaffRepo.Update(staffStations);


            await _unitOfWork.SaveChangesAsync();
            return new ServiceResult
            {
                Status = 200,
                Message = "Update staff information successfully",
            };
        }


        // Nemo: Lấy số lượng driver
        public async Task<int> GetNumberOfDriver()
        {
            int numberOfDriver = await _unitOfWork.Users.GetNumberOfDriverAsync();
            return numberOfDriver;
        }
        //Bin: lấy danh sách driver
        public async Task<IServiceResult> GetAllDriversAsync()
        {
            var driverList = await _unitOfWork.Users.GetAllUsersAsync();
            var result = new List<DriverListResponse>();
            var plan = await _unitOfWork.Plans.GetAllAsync();
            foreach (var driver in driverList)
            {

                var currentPlans = await _unitOfWork.Plans.GetCurrentSubscriptionByUserIdAsync(driver.UserId);
                var numberOfVehicle = await _unitOfWork.Vehicles.CountVehiclesByDriverIdAsync(driver.UserId);
                var totalSwap = await _unitOfWork.Subscriptions.GetTotalSwapsUsedByDriverIdAsync(driver.UserId);
                result.Add(new DriverListResponse
                {
                    DriverId = driver.UserId,
                    DriverName = driver.UserName,
                    DriverEmail = driver.UserEmail,
                    DriverStatus = driver.Status,
                    NumberOfVehicle = numberOfVehicle,
                    CurrentPackage = currentPlans,
                    TotalSwaps = totalSwap,
                });

            }
            return new ServiceResult
            {
                Status = 200,
                Message = "Get all drivers successfully",
                Data = result
            };
        }

        //Bin: Lấy thông tin chi tiết của driver
        public async Task<IServiceResult> GetDriverDetailInformationAsync(UserRequest requestDto)
        {
            var getDriver = await _unitOfWork.Users.GetByIdAsync(us => us.UserId == requestDto.UserId && us.Status == "Active");
            if (getDriver == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Driver not found or Inactive Driver",
                };
            }
            var registrationDate = getDriver.CreatedAt.Date;
            var currentPackages = await _unitOfWork.Plans.GetCurrentWithSwapSubscriptionByUserIdAsync(getDriver.UserId);

            var current = new List<PlanDetail>();
            foreach (var currentPackage in currentPackages)
            {
                var sub = await _unitOfWork.Subscriptions.GetByIdAsync(currentPackage.SubscriptionId);
                if (sub != null)
                {
                    current.Add(new PlanDetail
                    {
                        PlanName = sub.Plan.PlanName,
                        Swap = (int)sub.RemainingSwap,
                    });
                }
            }
            var totalSwaps = await _unitOfWork.Subscriptions.GetTotalSwapsUsedByDriverIdAsync(getDriver.UserId);
            var driverVehicles = await GetDriverVehiclesInfoByUserIdAsync(getDriver.UserId);
            var driverDetailDto = new DriverDetailRespone
            {
                DriverId = getDriver.UserId,
                DriverEmail = getDriver.UserEmail,
                DriverTele = getDriver.UserTele,
                Registation = DateOnly.FromDateTime(registrationDate),
                CurrentPackage = current,
                TotalSwaps = totalSwaps,
                driverVehicles = driverVehicles
            };
            return new ServiceResult
            {
                Status = 200,
                Message = "Get driver detail information successfully",
                Data = driverDetailDto
            };
        }



        // Bin : Lấy danh sách tất cả staff
        public async Task<IServiceResult> GetAllStaffsAsync()
        {
            var staffList = await _unitOfWork.Users.GetStaffWithStationAsync();
            var staffListDto = new List<staffListRespone>();
            foreach (var staff in staffList)
            {
                var stationStaff = await _unitOfWork.StationStaffs.GetStationWithStaffIdAsync(staff.UserId);
                if (stationStaff == null)
                {
                    staffListDto.Add(new staffListRespone
                    {
                        StaffId = staff.UserId,
                        StaffName = staff.UserName,
                        StaffEmail = staff.UserEmail,
                        StaffTele = staff.UserTele,
                        StaffStatus = staff.Status,
                        StationName = "No Station Assigned",
                        ShiftStart = new TimeOnly(0, 0),
                        ShiftEnd = new TimeOnly(0, 0),

                    });
                    continue;
                }

                var station = await _unitOfWork.Stations.GetByIdAsync(stationStaff.BatterySwapStationId);
                if (station == null)
                {
                    return new ServiceResult
                    {
                        Status = 404,
                        Message = "BatterySwapStation not found",
                    };
                }

                staffListDto.Add(new staffListRespone
                {
                    StaffId = staff.UserId,
                    StaffName = staff.UserName,
                    StaffEmail = staff.UserEmail,
                    StaffTele = staff.UserTele,
                    StaffAddress = staff.UserAddress,
                    StaffStatus = staff.Status,
                    StationName = station.BatterySwapStationName,
                    ShiftStart = stationStaff.ShiftStart,
                    ShiftEnd = stationStaff.ShiftEnd,
                });
            }
            return new ServiceResult
            {
                Status = 200,
                Message = "Get all staffs successfully",
                Data = staffListDto
            };
        }
        // Bin: xóa người dùng(staff,driver)
        public async Task<IServiceResult> DeleteUserAsync(UserRequest requestDto)
        {
            var getUser = await _unitOfWork.Users.GetByIdAsync(us => us.UserId == requestDto.UserId && us.Status == "Active");
            if (getUser == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Something wrong",
                };
            }
            getUser.Status = "Inactive";
            _userRepo.Update(getUser);
            await _unitOfWork.SaveChangesAsync();
            return new ServiceResult
            {
                Status = 200,
                Message = "Delete user successfully",
            };
        }


        //Bin : tạo mới staff
        public async Task<IServiceResult> CreateNewStaffAsync(StaffCreateRequest request)
        {
            try
            {
                var isUserActive = await _unitOfWork.Users.CheckUserActive(request.StaffEmail);
                if (isUserActive != null)
                {
                    return new ServiceResult
                    {
                        Status = 409,
                        Message = "Email already exists"
                    };
                }

                var supervisorId = await GetAdminId();
                var userId =  await GenerateStaffId();
                var newUser = new User()
                {
                    UserId = userId,
                    UserName = request.StaffName,
                    UserEmail = request.StaffEmail,
                    UserPasswordHash = GeneratedPasswordHash("VoltSwapProjectSwp"),
                    UserTele = request.StaffTele,
                    UserRole = "Staff",
                    UserAddress = request.StaffAddress,
                    SupervisorId = supervisorId,
                    CreatedAt = DateTime.UtcNow,
                    Status = "Active"
                };

                await _userRepo.CreateAsync(newUser);
                await _unitOfWork.SaveChangesAsync();
                var station = new StationStaff()
                {
                    BatterySwapStationId = request.StationStaff.StationId,
                    UserStaffId = userId,
                    ShiftStart = request.StationStaff.ShiftStart,
                    ShiftEnd = request.StationStaff.ShiftEnd,

                };
                await _stationStaffRepo.CreateAsync(station);
                await _unitOfWork.SaveChangesAsync();


                return new ServiceResult
                {
                    Status = 201,
                    Message = "Create Staff successful"
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return new ServiceResult
                {
                    Status = 500,
                    Message = "An error occurred during registration"
                };
            }
        }

        public async Task<string> GenerateStaffId()
        {
            string staffId;
            bool isUnique;
            do
            {
                var random = new Random();
                staffId = $"ST-{string.Concat(Enumerable.Range(0, 9).Select(_ => random.Next(0, 7).ToString()))}";
                isUnique = await _unitOfWork.Users.AnyAsync(u => u.UserId == staffId);
            }
            while (isUnique);
            return staffId;
        }
        private string GeneratedPasswordHash(String password) => BCrypt.Net.BCrypt.HashPassword(password);

        private bool VerifyPasswords(String passwordRquest, string passwrodHash) => BCrypt.Net.BCrypt.Verify(passwordRquest, passwrodHash);

        private async Task<string> GetAdminId()
        {
            var userAdmin = await _unitOfWork.Users.GetAdminAsync();
            string adminId = userAdmin.UserId;
            return adminId;
        }

        //Bin: Lấy thông tin các xe của driver theo userId để làm detail
        public async Task<List<VehicleListRespone>> GetDriverVehiclesInfoByUserIdAsync(string userId)
        {
            var list = await _unitOfWork.Vehicles.GetDriverVehiclesListByUserIdAsync(userId);

            var result = list.Select(v => new VehicleListRespone
            {
                VehicleModel = v.VehicleModel,
                NumberOfBattery = v.NumberOfBattery,
                Registation = v.CreatedAt.Year
            }).ToList();

            return result;
        }
    }
}
