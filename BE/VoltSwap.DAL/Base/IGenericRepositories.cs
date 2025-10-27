using System.Linq.Expressions;
using VoltSwap.DAL.Models;

namespace VoltSwap.DAL.Base
{
    public interface IGenericRepositories<T> where T : class
    {
        List<T> GetAll();

        Task<List<T>> GetAllAsync();

        Task<List<T>> GetAllAsync(
            Expression<Func<T, bool>>? predicate = null,
            Func<IQueryable<T>, IQueryable<T>>? include = null,
            Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
            bool asNoTracking = true
        );
        Task<T> Insert(T entity);

        IQueryable<T> GetAllQueryable();

        T GetById(int id);

        Task<T> GetByIdAsync(int id);

        T GetById(string code);

        Task<T> GetByIdAsync(string code);

        T GetById(Guid id);

        Task<T> GetByIdAsync(Guid id);

        Task<T?> GetByIdAsync(
            Expression<Func<T, bool>> predicate,
            Func<IQueryable<T>, IQueryable<T>>? include = null,
            bool asNoTracking = true
        );

        Task CreateAsync(T entity);

        Task BulkCreateAsync<T>(IEnumerable<T> entities) where T : class;

        Task AddRangeAndSaveAsync(IEnumerable<T> entities);

        //Task<int> CreateAsync(T entity);

        void Update(T entity);
        Task UpdateAsync(T entity);
        void UpdateRange(IEnumerable<T> entities);

        //Task<int> UpdateAsync(T entity);

        Task RemoveAsync(T entity);

        //Task<bool> RemoveAsync(T entity);

        void PrepareCreate(T entity);

        void PrepareUpdate(T entity);

        void PrepareRemove(T entity);

        int Save();

        Task<int> SaveAsync();

        Task<bool> AnyAsync(
            Expression<Func<T, bool>> predicate,
            bool asNoTracking = true
        );

        Task<TResult?> GetByPredicateAsync<TResult>(
            Expression<Func<T, bool>> predicate,
            Expression<Func<T, TResult>> selector,
            Func<IQueryable<T>, IQueryable<T>>? include = null,
            Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
            bool asNoTracking = true
        );

        Task<int> CountAsync(
        Expression<Func<T, bool>>? predicate = null,
        bool asNoTracking = true);
    }
}
