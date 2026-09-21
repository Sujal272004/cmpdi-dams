package in.gov.cmpdi.dams.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrillingMachineDTO {
    private Long id;
    private String machineNumber;
    private String machineName;
    private String machineType;
    private Long campId;
    private String campName;
    private String campCode;
    private String status;
    private String operatorName;
    private BigDecimal monthlyTarget;
    private BigDecimal yearlyTarget;
    private Integer targetYear;
    private Map<String, BigDecimal> monthwiseTargets;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
