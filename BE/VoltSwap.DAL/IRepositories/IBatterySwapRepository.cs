﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Models;

namespace VoltSwap.DAL.IRepositories
{
    public interface IBatterySwapRepository : IGenericRepositories<BatterySwap>
    {
        Task<List<BatterySwap>> GetBatteryInUsingAsync(String subId);
    }
}
