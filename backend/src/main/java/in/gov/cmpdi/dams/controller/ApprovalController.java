package in.gov.cmpdi.dams.controller;

import in.gov.cmpdi.dams.dto.ApiResponse;
import in.gov.cmpdi.dams.dto.ApproveReturnRequest;
import in.gov.cmpdi.dams.dto.DailyReportDTO;
import in.gov.cmpdi.dams.service.DailyReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ApprovalController {

    private final DailyReportService dailyReportService;

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('DEPT_EXEC', 'ADMIN')")
    public ResponseEntity<ApiResponse<DailyReportDTO>> approveReport(@PathVariable Long id, Principal principal) {
        String username = principal != null ? principal.getName() : "Dept Executive";
        DailyReportDTO report = dailyReportService.approveReport(id, username);
        return ResponseEntity.ok(ApiResponse.ok("Report approved and locked permanently", report));
    }

    @PostMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('DEPT_EXEC', 'ADMIN')")
    public ResponseEntity<ApiResponse<DailyReportDTO>> returnReport(
            @PathVariable Long id,
            @RequestBody ApproveReturnRequest request,
            Principal principal) {
        String username = principal != null ? principal.getName() : "Dept Executive";
        DailyReportDTO report = dailyReportService.returnReport(id, request.getRemarks(), username);
        return ResponseEntity.ok(ApiResponse.ok("Report returned to camp executive for correction", report));
    }
}
