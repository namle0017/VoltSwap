using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using VoltSwap.BusinessLayer.Services;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OverviewController : ControllerBase
    {
        private readonly OverviewService _overviewService;
        public OverviewController(OverviewService overviewService)
        {
            _overviewService = overviewService;
        }


    }
}
