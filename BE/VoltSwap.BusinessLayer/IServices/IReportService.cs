using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Models;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IReportService
    {

        Task<List<Report>> GetAllReport();

        //Nemo: lấy report cho staff
        Task<List<StaffReportResponse>> GetReportForStaff(string staffId);

        //Nemo: Lấy Customer report list
        Task<IServiceResult> GetCustomerReportForStaff(UserRequest request);
    }
}
