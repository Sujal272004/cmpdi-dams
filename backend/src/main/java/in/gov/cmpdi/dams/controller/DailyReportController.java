package in.gov.cmpdi.dams.controller;

import in.gov.cmpdi.dams.dto.ApiResponse;
import in.gov.cmpdi.dams.dto.DailyReportDTO;
import in.gov.cmpdi.dams.service.DailyReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class DailyReportController {

    private final DailyReportService dailyReportService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DailyReportDTO>>> getAllReports(
            @RequestParam(required = false) Long campId,
            @RequestParam(required = false) String status) {
        List<DailyReportDTO> reports = dailyReportService.getAllReports(campId, status);
        return ResponseEntity.ok(ApiResponse.ok("Reports retrieved successfully", reports));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DailyReportDTO>> getReportById(@PathVariable Long id) {
        DailyReportDTO report = dailyReportService.getReportById(id);
        return ResponseEntity.ok(ApiResponse.ok("Report details retrieved", report));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CAMP_EXEC', 'ADMIN')")
    public ResponseEntity<ApiResponse<DailyReportDTO>> createReport(@Valid @RequestBody DailyReportDTO dto, Principal principal) {
        String username = principal != null ? principal.getName() : "System User";
        DailyReportDTO created = dailyReportService.createReport(dto, username);
        return ResponseEntity.ok(ApiResponse.ok("Daily report created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CAMP_EXEC', 'ADMIN')")
    public ResponseEntity<ApiResponse<DailyReportDTO>> updateReport(
            @PathVariable Long id,
            @Valid @RequestBody DailyReportDTO dto,
            Principal principal) {
        String username = principal != null ? principal.getName() : "System User";
        DailyReportDTO updated = dailyReportService.updateReport(id, dto, username);
        return ResponseEntity.ok(ApiResponse.ok("Daily report updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteReport(@PathVariable Long id, Principal principal) {
        String username = principal != null ? principal.getName() : "System Admin";
        dailyReportService.deleteReport(id, username);
        return ResponseEntity.ok(ApiResponse.ok("Report deleted successfully by Admin", null));
    }
}
