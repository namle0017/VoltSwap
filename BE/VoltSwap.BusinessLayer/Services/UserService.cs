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
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public UserService(
            IServiceProvider serviceProvider,
            IGenericRepositories<User> userRepo,
            IGenericRepositories<StationStaff> stationStaffRepo,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _userRepo = userRepo;
            _stationStaffRepo = stationStaffRepo;
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
                        StationName = getStation.BatterySwapStationName,
                        ShiftStart = staffStations.ShiftStart,
                        ShiftEnd = staffStations.ShiftEnd
                    }
                },
            };
        }

        //Cái này để cần update để cập nhật thông tin của staff
        public async Task<IServiceResult> UpdateStaffInformationAsync(StaffUpdate requestDto)
        {
            var getUser = await _unitOfWork.Users.CheckUserActive(requestDto.StaffId);
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
    }
}
