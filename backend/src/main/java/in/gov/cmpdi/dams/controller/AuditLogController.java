package in.gov.cmpdi.dams.controller;

import in.gov.cmpdi.dams.dto.ApiResponse;
import in.gov.cmpdi.dams.dto.AuditLogDTO;
import in.gov.cmpdi.dams.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPT_EXEC')")
    public ResponseEntity<ApiResponse<List<AuditLogDTO>>> getAllAuditLogs() {
        return ResponseEntity.ok(ApiResponse.ok("Audit logs retrieved", auditLogService.getAllAuditLogs()));
    }
}
