package in.gov.cmpdi.dams.dto;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchFilterDTO {
    private LocalDate fromDate;
    private LocalDate toDate;
    private Long campId;
    private String machineNumber;
    private String drillHole;
    private String createdBy;
    private String reportStatus;
    private Integer month;
    private Integer year;
}
