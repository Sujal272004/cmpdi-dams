package in.gov.cmpdi.dams.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrillBitDTO {
    private Long id;
    private String bitNumber;
    private String bitType;
    private String size;
    private String manufacturer;
    private Long campId;
    private String campName;
    private String campCode;
    private String assignedMachineNumber;
    private String status;
    private BigDecimal totalMetersDrilled;
    private LocalDate issueDate;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
