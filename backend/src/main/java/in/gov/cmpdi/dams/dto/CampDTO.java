package in.gov.cmpdi.dams.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampDTO {
    private Long id;
    private String campCode;
    private String campName;
    private String location;
    private java.math.BigDecimal latitude;
    private java.math.BigDecimal longitude;
    private String status;
    private java.math.BigDecimal dailyTarget;
    private java.math.BigDecimal weeklyTarget;
    private java.math.BigDecimal monthlyTarget;
    private java.math.BigDecimal yearlyTarget;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
