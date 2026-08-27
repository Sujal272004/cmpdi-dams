package in.gov.cmpdi.dams.service;

import in.gov.cmpdi.dams.dto.AuthRequest;
import in.gov.cmpdi.dams.dto.AuthResponse;
import in.gov.cmpdi.dams.security.JwtTokenProvider;
import in.gov.cmpdi.dams.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuditLogService auditLogService;

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        String token = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);

        auditLogService.logAction("User", userPrincipal.getId().toString(), "LOGIN", null, "User logged in", userPrincipal.getName(), "127.0.0.1");

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(userPrincipal.getId())
                .employeeId(userPrincipal.getEmployeeId())
                .name(userPrincipal.getName())
                .email(userPrincipal.getEmail())
                .role(userPrincipal.getRole())
                .campId(userPrincipal.getCampId())
                .campName(userPrincipal.getCampName())
                .build();
    }
}
