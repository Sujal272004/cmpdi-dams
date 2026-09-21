package in.gov.cmpdi.dams.controller;

import in.gov.cmpdi.dams.dto.ApiResponse;
import in.gov.cmpdi.dams.dto.DrillingMachineDTO;
import in.gov.cmpdi.dams.dto.MachineTargetRequestDTO;
import in.gov.cmpdi.dams.service.DrillingMachineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/machines")
@RequiredArgsConstructor
public class MachineController {

    private final DrillingMachineService machineService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DrillingMachineDTO>>> getAllMachines(
            @RequestParam(required = false) Long campId,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(ApiResponse.ok("Drilling machines retrieved", machineService.getAllMachines(campId, year)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DrillingMachineDTO>> getMachineById(
            @PathVariable Long id,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(ApiResponse.ok("Machine details retrieved", machineService.getMachineById(id, year)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPT_EXEC')")
    public ResponseEntity<ApiResponse<DrillingMachineDTO>> createMachine(
            @RequestBody DrillingMachineDTO dto, 
            Principal principal) {
        String username = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(ApiResponse.ok("Machine created successfully", machineService.createMachine(dto, username)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPT_EXEC')")
    public ResponseEntity<ApiResponse<DrillingMachineDTO>> updateMachine(
            @PathVariable Long id,
            @RequestBody DrillingMachineDTO dto,
            Principal principal) {
        String username = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(ApiResponse.ok("Machine updated successfully", machineService.updateMachine(id, dto, username)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPT_EXEC')")
    public ResponseEntity<ApiResponse<String>> deleteMachine(
            @PathVariable Long id,
            Principal principal) {
        String username = principal != null ? principal.getName() : "Admin";
        machineService.deleteMachine(id, username);
        return ResponseEntity.ok(ApiResponse.ok("Machine deleted successfully", "Machine id " + id + " has been deleted"));
    }

    @GetMapping("/{id}/targets")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getMachineTargets(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "2026") Integer year) {
        return ResponseEntity.ok(ApiResponse.ok("Machine targets retrieved", machineService.getMachineTargets(id, year)));
    }

    @PostMapping("/{id}/targets")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPT_EXEC')")
    public ResponseEntity<ApiResponse<DrillingMachineDTO>> setMachineTargets(
            @PathVariable Long id,
            @RequestBody MachineTargetRequestDTO req,
            Principal principal) {
        String username = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(ApiResponse.ok("Monthwise targets updated successfully", machineService.setMachineTargets(id, req, username)));
    }
}
