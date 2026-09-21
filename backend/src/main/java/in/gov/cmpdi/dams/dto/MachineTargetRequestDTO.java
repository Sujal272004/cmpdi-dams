package in.gov.cmpdi.dams.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MachineTargetRequestDTO {
    private Long machineId;
    private Integer targetYear;
    private Map<String, BigDecimal> targets;
    private String notes;
}
