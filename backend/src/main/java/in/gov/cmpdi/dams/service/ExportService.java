package in.gov.cmpdi.dams.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import in.gov.cmpdi.dams.dto.DailyReportDTO;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final DailyReportService dailyReportService;

    public byte[] generateExcelReport(Long campId, String status, java.time.LocalDate fromDate, java.time.LocalDate toDate) throws IOException {
        List<DailyReportDTO> reports = dailyReportService.getAllReports(campId, status, fromDate, toDate);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Daily Drilling Progress");

            // Header Font
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            String[] columns = {
                "Report ID", "Date", "Camp", "Machine No.", "Drill Hole", "Bit No.", "Shift",
                "Opening Depth (m)", "Closing Depth (m)", "Daily Progress (m)",
                "Formation", "Core Recovery (%)", "Water Level (m)", "Status", "Created By", "Approved By"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (DailyReportDTO r : reports) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(r.getReportId() != null ? r.getReportId() : 0);
                row.createCell(1).setCellValue(r.getReportDate() != null ? r.getReportDate().toString() : "");
                row.createCell(2).setCellValue(r.getCampName() != null ? r.getCampName() : "");
                row.createCell(3).setCellValue(r.getMachineNumber() != null ? r.getMachineNumber() : "");
                row.createCell(4).setCellValue(r.getDrillHole() != null ? r.getDrillHole() : "");
                row.createCell(5).setCellValue(r.getBitNo() != null ? r.getBitNo() : "");
                row.createCell(6).setCellValue(r.getShift() != null ? r.getShift() : "");
                row.createCell(7).setCellValue(r.getOpeningDepth() != null ? r.getOpeningDepth().doubleValue() : 0.0);
                row.createCell(8).setCellValue(r.getClosingDepth() != null ? r.getClosingDepth().doubleValue() : 0.0);
                row.createCell(9).setCellValue(r.getDailyProgress() != null ? r.getDailyProgress().doubleValue() : 0.0);
                row.createCell(10).setCellValue(r.getFormation() != null ? r.getFormation() : "");
                row.createCell(11).setCellValue(r.getCoreRecovery() != null ? r.getCoreRecovery().doubleValue() : 0.0);
                row.createCell(12).setCellValue(r.getWaterLevel() != null ? r.getWaterLevel().doubleValue() : 0.0);
                row.createCell(13).setCellValue(r.getReportStatus() != null ? r.getReportStatus() : "");
                row.createCell(14).setCellValue(r.getCreatedBy() != null ? r.getCreatedBy() : "");
                row.createCell(15).setCellValue(r.getApprovedBy() != null ? r.getApprovedBy() : "N/A");
            }


            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] generateExcelReport(Long campId, String status) throws IOException {
        return generateExcelReport(campId, status, null, null);
    }

    public byte[] generatePdfReport(Long campId, String status, java.time.LocalDate fromDate, java.time.LocalDate toDate) throws DocumentException {
        List<DailyReportDTO> reports = dailyReportService.getAllReports(campId, status, fromDate, toDate);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 20);
        PdfWriter.getInstance(document, out);

        document.open();

        // Header Title
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, java.awt.Color.BLACK);
        Paragraph title = new Paragraph("CENTRAL MINE PLANNING & DESIGN INSTITUTE LIMITED (CMPDI)", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 12, java.awt.Color.DARK_GRAY);
        Paragraph subtitle = new Paragraph("EXPLORATION DEPARTMENT - DAILY DRILLING PROGRESS REPORT", subTitleFont);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        subtitle.setSpacingAfter(15);
        document.add(subtitle);

        Font tsFont = FontFactory.getFont(FontFactory.HELVETICA, 9, java.awt.Color.GRAY);
        Paragraph timestamp = new Paragraph(
                "Generated On: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm:ss")),
                tsFont);
        timestamp.setAlignment(Element.ALIGN_RIGHT);
        timestamp.setSpacingAfter(10);
        document.add(timestamp);

        // Table
        PdfPTable table = new PdfPTable(10);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10f);

        Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, java.awt.Color.WHITE);

        String[] headers = {"Date", "Camp", "Machine", "Drill Hole", "Shift",
                "Opening (m)", "Closing (m)", "Progress (m)", "Formation", "Status"};

        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headFont));
            cell.setBackgroundColor(new java.awt.Color(0, 51, 102));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(5);
            table.addCell(cell);
        }

        Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 8, java.awt.Color.BLACK);

        for (DailyReportDTO r : reports) {
            table.addCell(new Phrase(r.getReportDate() != null ? r.getReportDate().toString() : "", dataFont));
            table.addCell(new Phrase(r.getCampName() != null ? r.getCampName() : "", dataFont));
            table.addCell(new Phrase(r.getMachineNumber() != null ? r.getMachineNumber() : "", dataFont));
            table.addCell(new Phrase(r.getDrillHole() != null ? r.getDrillHole() : "", dataFont));
            table.addCell(new Phrase(r.getShift() != null ? r.getShift() : "", dataFont));
            table.addCell(new Phrase(r.getOpeningDepth() != null ? r.getOpeningDepth().toString() : "0", dataFont));
            table.addCell(new Phrase(r.getClosingDepth() != null ? r.getClosingDepth().toString() : "0", dataFont));
            table.addCell(new Phrase(r.getDailyProgress() != null ? r.getDailyProgress().toString() : "0", dataFont));
            table.addCell(new Phrase(r.getFormation() != null ? r.getFormation() : "-", dataFont));
            table.addCell(new Phrase(r.getReportStatus() != null ? r.getReportStatus() : "", dataFont));
        }

        document.add(table);

        // Signature Section
        Font sigFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, java.awt.Color.DARK_GRAY);
        Paragraph sig = new Paragraph(
                "\n\n\n___________________________                      ___________________________\n" +
                "   Prepared by (Camp Exec)                             Authorized Signatory (Dept Exec)",
                sigFont);
        document.add(sig);

        document.close();
        return out.toByteArray();
    }
}
