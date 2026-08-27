package in.gov.cmpdi.dams.service;

import in.gov.cmpdi.dams.dto.UserDTO;
import in.gov.cmpdi.dams.entity.Camp;
import in.gov.cmpdi.dams.entity.User;
import in.gov.cmpdi.dams.exception.DuplicateEntryException;
import in.gov.cmpdi.dams.exception.ResourceNotFoundException;
import in.gov.cmpdi.dams.repository.CampRepository;
import in.gov.cmpdi.dams.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CampRepository campRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        return userRepository.findByIsDeletedFalse().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDTO createUser(UserDTO dto, String adminUsername) {
        if (userRepository.existsByEmailAndIsDeletedFalse(dto.getEmail())) {
            throw new DuplicateEntryException("Email already registered: " + dto.getEmail());
        }
        if (userRepository.existsByEmployeeIdAndIsDeletedFalse(dto.getEmployeeId())) {
            throw new DuplicateEntryException("Employee ID already registered: " + dto.getEmployeeId());
        }

        Camp camp = null;
        if (dto.getCampId() != null) {
            camp = campRepository.findByIdAndIsDeletedFalse(dto.getCampId())
                    .orElseThrow(() -> new ResourceNotFoundException("Camp not found with id: " + dto.getCampId()));
        }

        if (dto.getPassword() == null || dto.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required for user account creation.");
        }

        User user = User.builder()
                .employeeId(dto.getEmployeeId())
                .name(dto.getName())
                .designation(dto.getDesignation())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .role(dto.getRole())
                .camp(camp)
                .status("ACTIVE")
                .build();

        User saved = userRepository.save(user);
        auditLogService.logAction("User", saved.getId().toString(), "CREATE", null, "Created user: " + saved.getName(), adminUsername, "127.0.0.1");

        return mapToDTO(saved);
    }

    @Transactional
    public UserDTO updateUserStatus(Long userId, String status, String adminUsername) {
        User user = userRepository.findById(userId)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setStatus(status);
        User saved = userRepository.save(user);
        auditLogService.logAction("User", userId.toString(), "UPDATE_STATUS", null, "Status changed to: " + status, adminUsername, "127.0.0.1");

        return mapToDTO(saved);
    }

    @Transactional
    public void resetPassword(Long userId, String newPassword, String adminUsername) {
        User user = userRepository.findById(userId)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditLogService.logAction("User", userId.toString(), "RESET_PASSWORD", null, "Password reset by admin", adminUsername, "127.0.0.1");
    }

    @Transactional
    public void changePassword(String userEmail, String currentPassword, String newPassword) {
        User user = userRepository.findByEmailAndIsDeletedFalse(userEmail)
                .orElseGet(() -> userRepository.findByEmployeeIdAndIsDeletedFalse(userEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User profile not found for identifier: " + userEmail)));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password provided is incorrect.");
        }

        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters long.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditLogService.logAction("User", user.getId().toString(), "CHANGE_PASSWORD", null, "User changed account password", user.getName(), "127.0.0.1");
    }

    private UserDTO mapToDTO(User u) {
        return UserDTO.builder()
                .id(u.getId())
                .employeeId(u.getEmployeeId())
                .name(u.getName())
                .designation(u.getDesignation())
                .email(u.getEmail())
                .role(u.getRole())
                .campId(u.getCamp() != null ? u.getCamp().getId() : null)
                .campName(u.getCamp() != null ? u.getCamp().getCampName() : null)
                .status(u.getStatus())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }
}
