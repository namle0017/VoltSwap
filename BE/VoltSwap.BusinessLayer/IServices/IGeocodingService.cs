using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.Common.DTOs;

namespace VoltSwap.BusinessLayer.IServices
{
    public interface IGeocodingService
    {
        Task<LatAndLngDto> ConvertAddrToCoordinates(string stationAddress);
    }
}
