using System.Text.Json.Serialization;

namespace VoltSwap.BusinessLayer.Base
{
    public class ServiceResult : IServiceResult
    {
        public int Status { get; set; }
        public string? Message { get; set; }
        public object? Data { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<string>? Errors { get; set; }

        public ServiceResult()
        {
            Status = -1;
            Message = "Action fail";
        }

        public ServiceResult(int status, string message)
        {
            Status = status;
            Message = message;
        }

        public ServiceResult(int status, string message, object data)
        {
            Status = status;
            Message = message;
            Data = data;
        }

        public ServiceResult(int status, string message, List<string> errors)
        {
            Status = status;
            Message = message;
            Errors = errors;
        }
    }
}
