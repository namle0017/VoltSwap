using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.DTO;
using VoltSwap.DAL.Models;
using VoltSwap.DAL.UnitOfWork;

namespace VoltSwap.BusinessLayer.Services
{
    public class CustomerService : BaseService, ICustomerService
    {
        private readonly IGenericRepositories<Customer> _customerRepo;

        public CustomerService(IServiceProvider serviceProvider, IGenericRepositories<Customer> customerRepo)
            : base(serviceProvider)
        {
            _customerRepo = customerRepo;
        }

        public Task<Customer> Create(CustomerDTO customer)
        {
            throw new NotImplementedException();
        }

        public Task<PagedResult<Customer>> Get(QueryOptions<Customer> queryOptions)
        {
            throw new NotImplementedException();
        }

        public async Task<PagedResult<Customer>> GetAllCustomers(QueryOptions<Customer> queryOptions)
        {
           
            return await _customerRepo.GetAllDataByExpression(new QueryOptions<Customer>
            {
                Filter = queryOptions.Filter,    
                PageNumber = queryOptions.PageNumber,
                PageSize = queryOptions.PageSize,
                OrderBy = queryOptions.OrderBy
            });
        }

        
        public async Task<Customer?> GetCustomerById(Guid id)
        {
            return await _customerRepo.GetByIdAsync(id);
        }
    }
}
    
