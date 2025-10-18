﻿using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
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
    public class ReportService : BaseService, IReportService
    {
        private readonly IGenericRepositories<User> _userRepo;
        private readonly IGenericRepositories<Report> _reportRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public ReportService(
            IServiceProvider serviceProvider,
            IGenericRepositories<User> userRepo,
            IGenericRepositories<Report> reportRepo,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _userRepo = userRepo;
            _reportRepo = reportRepo;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }

        //Hàm này để list ra danh sách các report hiện tại và sẽ filter theo create_at và status là processing
        public async Task<List<Report>> GetAllReport()
        {
            var reports = await _reportRepo.GetAllAsync() ?? new List<Report>();
            return reports
                .OrderBy(rp => rp.Status == "Processing")
                .ThenByDescending(rp => rp.CreateAt)
                .ToList();
        }

        //hàm này để driver tạo report
        public async Task<ServiceResult> DriverCreateReport(UserReportRequest requestDto)
        {
            var result = new Report
            {
                UserAdminId = await GetAdminId(),
                UserStaffId = requestDto.StaffId,
                UserDriverId = requestDto.DriverId,
                ReportType = requestDto.ReportType,
                Note = requestDto.ReportNote,
                CreateAt = DateTime.UtcNow.ToLocalTime(),
                Status = "Processing",
                ProcessesAt = null,
            };

            await _reportRepo.CreateAsync(result);
            await _unitOfWork.SaveChangesAsync();
            return new ServiceResult
            {
                Status = 201,
                Message = "Report created successfully",
            };
        }

        public async Task<ServiceResult> AdminAsignStaff(StaffAssignedRequest request)
        {
            var report  = await _reportRepo.GetByIdAsync(request.ReportId);
            if(report == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Report not found",
                };
            }

            report.UserStaffId = request.StaffId;
            await _reportRepo.UpdateAsync(report);
            await _unitOfWork.SaveChangesAsync();
            return new ServiceResult
            {
                Status = 200,
                Message = "Staff assigned successfully",
            };
        }

        public async Task<ServiceResult> GetStaffList()
        {
            var staffList = await _unitOfWork.Users.GetStaffWithStationAsync();
            var response = staffList.Select(staff => new StaffListResponse
            {
                StaffId = staff.UserId,
                StaffName = staff.UserName,
                PhoneNumber = staff.UserTele,
                StationId = staff.StationStaffs.FirstOrDefault()?.BatterySwapStation?.BatterySwapStationId,
                StationName = staff.StationStaffs.FirstOrDefault()?.BatterySwapStation?.BatterySwapStationName,
            }).ToList();
            return new ServiceResult
            {
                Status = 200,
                Data = response,
            };
        }

        public async Task<ServiceResult> GetDriverContact(string driverID)
        {
            var driverContact = await _unitOfWork.Reports.GetDriverContact(driverID);
            if(driverContact == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "Driver not found",
                };
            }
            return new ServiceResult
            {
                Status = 200,
                Data = driverContact,
            };
        }


        private async Task<string> GetAdminId()
        {
            var userAdmin = await _unitOfWork.Users.GetAdminAsync();
            string adminId = userAdmin.UserId;
            return adminId;
        }
    }
}
