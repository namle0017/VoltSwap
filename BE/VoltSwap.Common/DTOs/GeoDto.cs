using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class GeoDto
    {
        public class Location
        {
            public double lat { get; set; }
            public double lng { get; set; }
        }

        public class Geometry
        {
            public Location location { get; set; }
        }

        public class Result
        {
            public string formatted_address { get; set; }
            public Geometry geometry { get; set; }
        }

        public class GeocodeResponse
        {
            public List<Result> results { get; set; }
            public string status { get; set; }
        }

    }
}
