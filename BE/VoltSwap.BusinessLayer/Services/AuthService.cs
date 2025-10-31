using BCrypt.Net;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.BusinessLayer.Base;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.Common.DTOs;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;
using VoltSwap.DAL.UnitOfWork;

namespace VoltSwap.BusinessLayer.Services
{
    //isRevoke: là để xem coi token đó có bị thu hồi hay chưa 

    public class AuthService : BaseService, IAuthService
    {
        private readonly IGenericRepositories<User> _userRepo;
        private readonly IGenericRepositories<RefreshToken> _refreshTokenRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        public AuthService(
            IServiceProvider serviceProvider,
            IGenericRepositories<User> userRepo,
            IGenericRepositories<RefreshToken> refreshTokenRepo,
            IUnitOfWork unitOfWork,
            IConfiguration configuration) : base(serviceProvider)
        {
            _userRepo = userRepo;
            _refreshTokenRepo = refreshTokenRepo;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }
        public async Task<ServiceResult> LoginAsync(LoginRequest requestDto)
        {
            var user = await _unitOfWork.Users.GetByEmailAsync(requestDto.Email);
            if(user == null)
            {
                return new ServiceResult
                {
                    Status = 404,
                    Message = "This user was not found.",
                    Data = new UserInfo(),
                };
            }
            if (!VerifyPasswords(requestDto.Password, user.UserPasswordHash))
            {
                return new ServiceResult
                {
                    Status = 400,
                    Message = "Incorrect Password or Email",
                    Data = new UserInfo(),
                };
            }
            //bên trái là dành cho password người dùng đưa vào, bên phải là dành cho password đã hash từ dưới database
            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken(user.UserId);

            await _refreshTokenRepo.Insert(refreshToken);
            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = "Login successfull",
                Data = new LoginResponse
                {
                    Token = token,
                    RefreshToken = refreshToken.Token,
                    ExpiresAt = DateTime.UtcNow.AddHours(1), // JWT expires in 1 hour
                    User = new UserInfo
                    {
                        UserId = user.UserId,
                        UserEmail = user.UserEmail,
                        UserName = user.UserName,
                        UserRole = user.UserRole
                    }
                }
            };
        }

        public async Task<ServiceResult> RegisterAsync(RegisterRequest request)
        {
            try
            {
                var isUserActive = await _unitOfWork.Users.CheckUserActive(request.UserEmail);
                if (isUserActive != null)
                {
                    return new ServiceResult
                    {
                        Status = 409,
                        Message = "Email already exists"
                    };
                }

                string role = string.IsNullOrEmpty(request.UserRole) ? "Driver" : request.UserRole;
                var supervisorId = await GetAdminId();
                var userId = await GenerateUserId(role);
                var newUser = new User()
                {
                    UserId = userId,
                    UserName = request.UserName,
                    UserPasswordHash = GeneratedPasswordHash(request.UserPassword),
                    UserEmail = request.UserEmail,
                    UserTele = request.UserTele,
                    UserRole = role,
                    UserAddress = request.UserAddress,
                    SupervisorId = supervisorId,
                    CreatedAt = DateTime.UtcNow,
                    Status = "Active"
                };

                await _userRepo.CreateAsync(newUser);
                await _unitOfWork.SaveChangesAsync();

                return new ServiceResult
                {
                    Status = 201,
                    Message = "Registration successful"
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return new ServiceResult
                {
                    Status = 500,
                    Message = "An error occurred during registration"
                };
            }
        }



        //Part: JWT
        public async Task<ServiceResult> RefreshTokenAsync(string refreshToken)
        {
            var storedToken = await _refreshTokenRepo.GetByIdAsync(x => x.Token == refreshToken);
            if (storedToken == null || storedToken.IsRevoked || storedToken.ExpiresAt < DateTime.UtcNow)
            {
                return new ServiceResult
                {
                    Status = 401, // đây là mã trả về là token đã hết hạn
                    Message = "The session you are logging in to has expired.",
                };
            }

            var user = await _userRepo.GetByIdAsync(storedToken.UserId);
            if (user == null || user.Status == "Active")
            {
                return new ServiceResult
                {
                    Status = 401, // đây là mã trả về là token đã hết hạn
                    Message = "User not found or inactive",
                };
            }

            storedToken.IsRevoked = true;
            await _refreshTokenRepo.UpdateAsync(storedToken);

            var newToken = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken(user.UserId);

            await _refreshTokenRepo.Insert(newRefreshToken);
            await _unitOfWork.SaveChangesAsync();

            return new ServiceResult
            {
                Status = 200,
                Message = "OK",
                Data = new LoginResponse
                {
                    Token = newToken,
                    RefreshToken = newRefreshToken.Token,
                    ExpiresAt = DateTime.UtcNow.AddHours(1),
                    User = new UserInfo
                    {
                        UserId = user.UserId,
                        UserEmail = user.UserEmail,
                        UserName = user.UserName,
                        UserTele = user.UserTele,
                        UserRole = user.UserRole,
                    }

                }
            };

        }

        public async Task<bool> RevokeTokenAsync(String refreshToken)
        {
            var storedToken = await _refreshTokenRepo.GetByIdAsync(x => x.Token == refreshToken);
            if (storedToken == null) return false;
            storedToken.IsRevoked = true;
            await _refreshTokenRepo.UpdateAsync(storedToken);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ValidateTokenAsync(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]);

                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["Jwt:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _configuration["Jwt:Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return true;
            }
            catch
            {
                return false;
            }
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Token"]);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                    new Claim(ClaimTypes.Email, user.UserEmail),
                    new Claim(ClaimTypes.Name, user.UserName),
                    new Claim(ClaimTypes.Role, user.UserRole)
                }),
                Expires = DateTime.UtcNow.AddDays(1),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private RefreshToken GenerateRefreshToken(String userId)
        {
            using var rng = RandomNumberGenerator.Create();
            var randomBytes = new byte[64];
            rng.GetBytes(randomBytes);

            return new RefreshToken
            {
                TokenId = Guid.NewGuid().ToString(),
                Token = Convert.ToBase64String(randomBytes),
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow,
                UserId = userId,
                IsRevoked = false
            };
        }


        //Part: Password

        private string GeneratedPasswordHash(String password) => BCrypt.Net.BCrypt.HashPassword(password);

        private bool VerifyPasswords(String passwordRquest, string passwrodHash) => BCrypt.Net.BCrypt.Verify(passwordRquest, passwrodHash);
        private async Task<string> GenerateUserId(string userRole)
        {
            Guid id = Guid.NewGuid();
            int code = Math.Abs(id.GetHashCode() % 100000000);
            string userID = "";

            string prefix = userRole.Trim().ToLower() switch
            {
                "driver" => "DR",
                "staff" => "ST",
                "admin" => "AD",
                _ => throw new ArgumentException($"Invalid role: {userRole}")
            };


            bool isDuplicated;
            do
            {
                Guid guid = Guid.NewGuid();
                int codePrefix = Math.Abs(BitConverter.ToInt32(id.ToByteArray(), 0)) % 100000000;
                userID = $"{prefix}-{codePrefix}";
                isDuplicated = await _userRepo.AnyAsync(u => u.UserId == userID);
            } while (isDuplicated);

            return userID;
        }



        private async Task<string> GetAdminId()
        {
            var userAdmin = await _unitOfWork.Users.GetAdminAsync();
            string adminId = userAdmin.UserId;
            return adminId;
        }
    }
}
