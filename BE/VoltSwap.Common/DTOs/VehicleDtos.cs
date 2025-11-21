using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class CreateDriverVehicleRequest
    {
        public string DriverId { get; set; }


        [Required(ErrorMessage = "VIN is required.")]
        [RegularExpression(@"^VIN[-\s]?([A-Z0-9]{10})$",
      ErrorMessage = "VIN must follow the format: VIN-XXXXXXXXXX ")]
        public string VIN { get; set; }

        [Required(ErrorMessage = "Vehicle model is required.")]
        [RegularExpression(@"^[A-Za-z0-9\-_ ]{3,30}$",
       ErrorMessage = "Vehicle model must be 3–30 characters and can only contain letters, numbers, spaces, hyphens ( - ) and underscores ( _ ).")]
        public string VehicleModel { get; set; }


        [Range(1, int.MaxValue, ErrorMessage = "Number of batteries must be greater than 0.")]
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
