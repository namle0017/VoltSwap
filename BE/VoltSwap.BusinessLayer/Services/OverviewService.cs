using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;
using VoltSwap.DAL.UnitOfWork;

namespace VoltSwap.BusinessLayer.Services
{
    public class OverviewService : BaseService
    {
        private readonly IGenericRepositories<User> _userRepo;
        private readonly IGenericRepositories<BatterySwapStation> _batterySwapStationRepo;
        private readonly IGenericRepositories<BatterySwap> _batterySwapRepo;
        private readonly IGenericRepositories<Transaction> _transactionRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public OverviewService(
            IServiceProvider serviceProvider,
            IGenericRepositories<User> userRepo,
            IGenericRepositories<BatterySwapStation> batterySwapStationRepo,
            IGenericRepositories<BatterySwap> batterySwapRepo,
            IGenericRepositories<Transaction> transactionRepo,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _userRepo = userRepo;
            _batterySwapStationRepo = batterySwapStationRepo;
            _batterySwapRepo = batterySwapRepo;
            _transactionRepo = transactionRepo;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }


        public async Task<int> GetNumberOfDriver()
        {
            int numberOfDriver = await _unitOfWork.Users.GetNumberOfDriverAsync();
            return numberOfDriver;
        }
    }
}
