using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.Common.DTOs;

namespace VoltSwap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserService _userService;
        public UserController(UserService userService)
        {
            _userService = userService;
        }


        //Cái này là của lấy thông tin của người dùng, user và admin thấy được
        [HttpGet("user-information")]
        public async Task<IActionResult> GetUserUpdateInformation([FromQuery]UserRequest requestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Invalid input", errors = ModelState });
            }

            var getUserInformation = await _userService.GetDriverUpdateInformationAsync(requestDto);

            return StatusCode(getUserInformation.Status, new { message = getUserInformation.Message, data = getUserInformation.Data });
        }

        //Cái này để update thông tin của người dùng
        [HttpPut("update-user-information")]
        public async Task<IActionResult> UpdateUserInformation(DriverUpdate requestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Invalid input", errors = ModelState });
            }

            var updateDriverInformation = await _userService.UpdateDriverInformationAsync(requestDto);

            return StatusCode(updateDriverInformation.Status,
                            new
                            {
                                message = updateDriverInformation.Message,
                                data = updateDriverInformation.Data
                            });
        }


        [HttpGet("staff-information")]
        public async Task<IActionResult> GetStaffUpdateInformation([FromQuery] UserRequest requestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Invalid input", errors = ModelState });
            }

            var getStaffInformation = await _userService.GetStaffUpdateInformationAsync(requestDto);

            return StatusCode(getStaffInformation.Status,
                new
                {
                    message = getStaffInformation.Message,
                    //data = getStaffInformation.Data
                });
        }



        [HttpPut("update-staff-information")]
        public async Task<IActionResult> UpdateStaffInformation(StaffUpdate requestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Invalid input", errors = ModelState });
            }

            var updateStaffInformation = await _userService.UpdateStaffInformationAsync(requestDto);

            return StatusCode(updateStaffInformation.Status,
                            new
                            {
                                message = updateStaffInformation.Message,
                                //data = updateStaffInformation.Data
                            });
        }
    }
}
