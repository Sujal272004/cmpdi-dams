package in.gov.cmpdi.dams.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogDTO {
    private Long id;
    private String entityName;
    private String entityId;
    private String action;
    private String oldValue;
    private String newValue;
    private String changedBy;
    private String ipAddress;
    private LocalDateTime timestamp;
}
