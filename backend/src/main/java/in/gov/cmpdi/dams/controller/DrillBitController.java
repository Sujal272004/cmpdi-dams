package in.gov.cmpdi.dams.controller;

import in.gov.cmpdi.dams.dto.ApiResponse;
import in.gov.cmpdi.dams.dto.DrillBitDTO;
import in.gov.cmpdi.dams.service.DrillBitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/bits")
@RequiredArgsConstructor
public class DrillBitController {

    private final DrillBitService drillBitService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DrillBitDTO>>> getAllBits(
            @RequestParam(required = false) Long campId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.ok("Drill bits retrieved successfully", drillBitService.getAllBits(campId, status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DrillBitDTO>> getBitById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Drill bit details retrieved", drillBitService.getBitById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPT_EXEC', 'CAMP_EXEC')")
    public ResponseEntity<ApiResponse<DrillBitDTO>> createBit(
            @RequestBody DrillBitDTO dto,
            Principal principal) {
        String username = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(ApiResponse.ok("Drill bit registered successfully", drillBitService.createBit(dto, username)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPT_EXEC', 'CAMP_EXEC')")
    public ResponseEntity<ApiResponse<DrillBitDTO>> updateBit(
            @PathVariable Long id,
            @RequestBody DrillBitDTO dto,
            Principal principal) {
        String username = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(ApiResponse.ok("Drill bit updated successfully", drillBitService.updateBit(id, dto, username)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPT_EXEC', 'CAMP_EXEC')")
    public ResponseEntity<ApiResponse<String>> deleteBit(
            @PathVariable Long id,
            Principal principal) {
        String username = principal != null ? principal.getName() : "Admin";
        drillBitService.deleteBit(id, username);
        return ResponseEntity.ok(ApiResponse.ok("Drill bit deleted successfully", "Bit id " + id + " deleted"));
    }
}
