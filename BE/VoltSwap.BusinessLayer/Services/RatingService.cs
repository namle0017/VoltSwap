using Azure;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;
using VoltSwap.DAL.UnitOfWork;
using static VoltSwap.Common.DTOs.RatingDtos;

namespace VoltSwap.BusinessLayer.Services
{
    public class RatingService: BaseService ,IRatingService
    {
        private readonly IGenericRepositories<Rating> _ratingRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;

        public RatingService(IServiceProvider serviceProvider,
                            IGenericRepositories<Rating> ratingRepo,
                            IUnitOfWork unitOfWork,
                             IConfiguration configuration) : base(serviceProvider)
                              {
                             _ratingRepo = ratingRepo;
                             _unitOfWork = unitOfWork;
                              _configuration = configuration;
                             }

        public async Task<ServiceResult> RatingStation (RatingRequest request)
        {
            var result = new Rating
            {
                UserDriverId = request.DriverId,
                BatterySwapStationId = request.StationId,
                RatingScore = request.RatingScore,
                Comment = request.Comment,
                CreatedAt = DateTime.UtcNow.ToLocalTime()

            };
            await _ratingRepo.CreateAsync(result);
            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = "Rating created successfully"
            };
        }

        public async Task<ServiceResult> ViewRating()
        {
            var getrating = await _unitOfWork.Ratings.GetAllAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = "View Rating successfully",
                Data = new 
                {
                    ratingList = getrating 
                }

            };
        }

    }
}
