package in.gov.cmpdi.dams.controller;

import in.gov.cmpdi.dams.dto.ApiResponse;
import in.gov.cmpdi.dams.dto.UserDTO;
import in.gov.cmpdi.dams.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.ok("Users retrieved", userService.getAllUsers()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> createUser(@Valid @RequestBody UserDTO dto, Principal principal) {
        String username = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(ApiResponse.ok("User created successfully", userService.createUser(dto, username)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body, Principal principal) {
        String username = principal != null ? principal.getName() : "Admin";
        String status = body.get("status");
        return ResponseEntity.ok(ApiResponse.ok("User status updated", userService.updateUserStatus(id, status, username)));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> body, Principal principal) {
        String username = principal != null ? principal.getName() : "Admin";
        String newPassword = body.get("password");
        userService.resetPassword(id, newPassword, username);
        return ResponseEntity.ok(ApiResponse.ok("Password reset successfully", "Password reset for user " + id));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(@RequestBody Map<String, String> body, Principal principal) {
        String email = principal != null ? principal.getName() : body.get("email");
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        userService.changePassword(email, currentPassword, newPassword);
        return ResponseEntity.ok(ApiResponse.ok("Password updated successfully", "Account password changed successfully"));
    }
}
