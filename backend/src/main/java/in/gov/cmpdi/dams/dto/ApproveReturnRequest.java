package in.gov.cmpdi.dams.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApproveReturnRequest {
    private String remarks; // Required when returning report
}
