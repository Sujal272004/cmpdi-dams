package in.gov.cmpdi.dams.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthRequest {

    @NotBlank(message = "Employee ID or Email is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;
}
