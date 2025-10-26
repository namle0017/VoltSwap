using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.Common.DTOs;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IUserService
    {
        Task<IServiceResult> GetDriverUpdateInformationAsync(UserRequest requestDto);
        Task<IServiceResult> UpdateDriverInformationAsync(DriverUpdate requestDto);
        
        Task<IServiceResult> GetAllStaffsAsync();
        Task<IServiceResult> GetAllDriversAsync();
        Task<IServiceResult> GetDriverDetailInformationAsync(UserRequest requestDto);
        Task<IServiceResult> DeleteUserAsync(UserRequest requestDto);
        Task<int> GetNumberOfDriver();

        }
}
