package in.gov.cmpdi.dams.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String employeeId;
    private String name;
    private String designation;
    private String email;
    private String password;
    private String role;
    private Long campId;
    private String campName;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
