using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
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

            [RegularExpression("^(VND|USD)$", ErrorMessage = "Unit must be either VND or USD.")]
            public string? Unit { get; set; }
            public List<ExcessMileageTierDto>? Tiers { get; set; }
        }

        public class ExcessMileageTierDto
        {
            [Range(0.01, double.MaxValue, ErrorMessage = "Min value must be greater than 0.")]
            public decimal MinValue { get; set; }

            public decimal MaxValue { get; set; }

            [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0.")]
            public decimal Amount { get; set; }

            [Required(ErrorMessage = "Unit is required.")]

            [RegularExpression("^(VND/km|USD/km)$", ErrorMessage = "Unit must be either VND or USD.")]
            public string Unit { get; set; } = string.Empty;

            public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
            {
                if (MaxValue <= MinValue)
                {
                    yield return new ValidationResult(
                        "Max value must be greater than min value.",
                        new[] { nameof(MaxValue), nameof(MinValue) } // gắn lỗi cho 2 field
                    );
                }
            }
        }

    }
}
