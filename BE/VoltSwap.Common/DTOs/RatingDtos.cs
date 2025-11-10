using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class RatingDtos
    {
        public class RatingRequest
        {

            public string DriverId { get; set; }
            public string StationId { get; set; }
            public int RatingScore { get; set; }
            public string Comment { get; set; }
        }
    }
}
