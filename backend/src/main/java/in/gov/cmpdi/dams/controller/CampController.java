package in.gov.cmpdi.dams.controller;

import in.gov.cmpdi.dams.dto.ApiResponse;
import in.gov.cmpdi.dams.dto.CampDTO;
import in.gov.cmpdi.dams.service.CampService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/camps")
@RequiredArgsConstructor
public class CampController {

    private final CampService campService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CampDTO>>> getAllCamps() {
        return ResponseEntity.ok(ApiResponse.ok("Camps retrieved", campService.getAllCamps()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CampDTO>> getCampById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Camp details retrieved", campService.getCampById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CampDTO>> createCamp(@Valid @RequestBody CampDTO dto, Principal principal) {
        String username = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(ApiResponse.ok("Camp created successfully", campService.createCamp(dto, username)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPT_EXEC')")
    public ResponseEntity<ApiResponse<CampDTO>> updateCamp(@PathVariable Long id, @RequestBody CampDTO dto, Principal principal) {
        String username = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(ApiResponse.ok("Camp updated successfully", campService.updateCamp(id, dto, username)));
    }

    @PutMapping("/{id}/targets")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPT_EXEC')")
    public ResponseEntity<ApiResponse<CampDTO>> updateCampTargets(@PathVariable Long id, @RequestBody CampDTO dto, Principal principal) {
        String username = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(ApiResponse.ok("Camp targets updated successfully", campService.updateCampTargets(id, dto, username)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteCamp(@PathVariable Long id, Principal principal) {
        String username = principal != null ? principal.getName() : "Admin";
        campService.deleteCamp(id, username);
        return ResponseEntity.ok(ApiResponse.ok("Camp deleted successfully", "Soft deleted camp id " + id));
    }
}
