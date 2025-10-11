using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.DTO;
using VoltSwap.DAL.Models;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface ICustomerService
    {
            Task<PagedResult<Customer>> Get(QueryOptions<Customer> queryOptions);
            Task<Customer> Create(CustomerDTO customer);

        
    }
}
