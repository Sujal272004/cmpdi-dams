package in.gov.cmpdi.dams.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long userId;
    private String employeeId;
    private String name;
    private String email;
    private String designation;
    private String role;
    private Long campId;
    private String campName;
}
