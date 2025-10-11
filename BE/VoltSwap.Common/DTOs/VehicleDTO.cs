using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class VehicleDTO
    {
        public Guid Id { get; set; }
        public string VIN { get; set; }
        public string VehicleName { get; set; }
        public Guid CustomerId { get; set; }

    }
}
