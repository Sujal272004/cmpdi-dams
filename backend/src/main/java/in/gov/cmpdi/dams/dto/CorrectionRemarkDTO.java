package in.gov.cmpdi.dams.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CorrectionRemarkDTO {
    private Long id;
    private Long reportId;
    private String remarks;
    private String createdBy;
    private LocalDateTime createdAt;
}
