package in.gov.cmpdi.dams.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyReportDTO {

    private Long reportId;

    @NotNull(message = "Report date is required")
    private LocalDate reportDate;

    @NotNull(message = "Camp ID is required")
    private Long campId;
    private String campName;
    private String campCode;

    @NotNull(message = "Machine number is required")
    private String machineNumber;

    @NotNull(message = "Drill hole is required")
    private String drillHole;

    @NotNull(message = "Shift is required")
    private String shift; // SHIFT_A, SHIFT_B, SHIFT_C

    private BigDecimal plannedDepth;

    @NotNull(message = "Opening depth is required")
    private BigDecimal openingDepth;

    @NotNull(message = "Closing depth is required")
    private BigDecimal closingDepth;

    private BigDecimal dailyProgress;
    private BigDecimal cumulativeDepth;

    private String drillingStartTime;
    private String drillingEndTime;
    private String formation;
    private BigDecimal coreRecovery;
    private BigDecimal waterLevel;

    @NotBlank(message = "Operational remarks are required")
    private String remarks;

    @NotBlank(message = "Block Name is required")
    private String blockName;

    @NotBlank(message = "Borehole ID is required")
    private String boreholeId;

    private String bitNo;

    @NotNull(message = "Borehole depth is required")
    private BigDecimal boreholeDepth;

    @NotNull(message = "Borehole start date is required")
    private LocalDate boreholeStartDate;

    private BigDecimal workingHours;
    private BigDecimal dieselPump;
    private BigDecimal dieselRig;
    private BigDecimal latitude;
    private BigDecimal longitude;

    private String reportStatus; // DRAFT, SUBMITTED, APPROVED, RETURNED
    private String createdBy;
    private String approvedBy;
    private LocalDateTime approvedDate;
    private Long version;

    private List<CorrectionRemarkDTO> correctionHistory;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
