using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VoltSwap.Common.DTOs
{
    public class FeeDtos
    {
        public class UpdateFeeGroupRequest
        {
            public string GroupKey { get; set; } = string.Empty;
            public List<FeeUpdateRequest> Fees { get; set; } = new();
        }

        public class FeeUpdateRequest
        {
            public string TypeOfFee { get; set; } = string.Empty;
            public decimal? Amount { get; set; }
            public string? Unit { get; set; }
            public List<ExcessMileageTierDto>? Tiers { get; set; } 
        }

        public class ExcessMileageTierDto
        {
            public decimal MinValue { get; set; }
            public decimal MaxValue { get; set; }
            public decimal Amount { get; set; }
            public string Unit { get; set; } = string.Empty;
        }

    }
}
