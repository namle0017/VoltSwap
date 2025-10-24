using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class CreateDriverVehicleRequest
    {
        public string DriverId { get; set; }
        public string VIN { get; set; }
        public string VehicleModel { get; set; }
        public int NumberOfBat {  get; set; }
       
    }
    public class CheckDriverVehicleRequest
    {
        public string UserDriverId { get; set; }
        public string VIN { get; set; }
    }
    public class CheckDriverRequest
    {
        public string UserDriverId { get; set; }
    }
    public class VehicleRespone
    {
        
        public string VIN { get; set; }
        public string VehicleModel { get; set; }
        public int NumberOfBattery { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<string> recommendPlan { get; set; }
    }

    public class VehicleListRespone
    {
       public string VehicleModel { get; set; }
        public int NumberOfBattery { get; set; }
        public int Registation { get; set; }


    }
}
