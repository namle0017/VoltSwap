using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;
using VoltSwap.DAL.UnitOfWork;
using static VoltSwap.Common.DTOs.GeoDto;
using System.Globalization;

namespace VoltSwap.BusinessLayer.Services
{
    public class GeocodingService : BaseService, IGeocodingService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        public GeocodingService(
            HttpClient httpClient,
            IUnitOfWork unitOfWork,
            IConfiguration configuration,
            IServiceProvider serviceProvider) // <-- Add this parameter
            : base(serviceProvider)
        {
            _configuration = configuration;
            _httpClient = httpClient;
        }

public async Task<LatAndLngDto> ConvertAddrToCoordinates(string stationAddress)
    {
        var apiKey = _configuration["GeoCodeAPI:Key"];
        var encodedAddress = Uri.EscapeDataString(stationAddress);
        var url = $"https://geocode.maps.co/search?q={encodedAddress}&api_key={apiKey}";

        var response = await _httpClient.GetStringAsync(url);

        var jsonArray = JArray.Parse(response);
        if (jsonArray.Count == 0)
        {
            return new LatAndLngDto
            {
                LocationLat = -190,
                LocationLng = -190,
            };
        }

        return new LatAndLngDto
        {
            LocationLat = decimal.Parse(jsonArray[0]["lat"].ToString(), CultureInfo.InvariantCulture),
            LocationLng = decimal.Parse(jsonArray[0]["lon"].ToString(), CultureInfo.InvariantCulture),
        };
    }



}
}
