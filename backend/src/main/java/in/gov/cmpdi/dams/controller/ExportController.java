package in.gov.cmpdi.dams.controller;

import in.gov.cmpdi.dams.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(required = false) Long campId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) throws Exception {
        byte[] bytes = exportService.generateExcelReport(campId, status, fromDate, toDate);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=CMPDI_Drilling_Report.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(bytes);
    }

    @GetMapping("/excel/sundaywise")
    public ResponseEntity<byte[]> exportSundaywiseExcel(
            @RequestParam(required = false) Long campId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String month) throws Exception {
        byte[] bytes = exportService.generateSundaywiseExcelReport(campId, status, month);
        String filename = "CMPDI_Sundaywise_Drilling_Report_" + (month != null ? month : "ALL") + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(bytes);
    }


    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(required = false) Long campId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) throws Exception {
        byte[] bytes = exportService.generatePdfReport(campId, status, fromDate, toDate);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=CMPDI_Drilling_Report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }
}
