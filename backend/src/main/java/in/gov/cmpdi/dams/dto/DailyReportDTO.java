package in.gov.cmpdi.dams.dto;

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
    private String remarks;
    private String blockName;
    private String boreholeId;
    private String bitNo;

    private BigDecimal boreholeDepth;
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
