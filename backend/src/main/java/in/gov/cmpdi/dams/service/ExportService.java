package in.gov.cmpdi.dams.service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import in.gov.cmpdi.dams.dto.DailyReportDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private final DailyReportService dailyReportService;

    // -------------------------------------------------------------------------
    // DPR Format columns (matches DPR Format.xlsx exactly – 15 columns):
    //  A: Camp Name               B: RIG No.               C: Shift
    //  D: Total Day Progress      E: Monthly Cummulative Meterage  F: Yearly Cummulative Meterage
    //  G: Borehole ID             H: Borehole Start dt      I: Block Name
    //  J: Remarks                 K: Preventive Hrs         L: Working Hrs
    //  M: Diesel in Pump(Ltrs)   N: Diesel in Rig(Ltrs)    O: Bit No
    // -------------------------------------------------------------------------

    private static final String[] DPR_COLUMNS = {
        "Camp Name",
        "RIG No.",
        "Shift",
        "Total Day Progress",
        "Monthly Cummulative Meterage",
        "Yearly Cummulative Meterage",
        "Borehole ID",
        "Borehole Start dt",
        "Block Name",
        "Remarks",
        "Preventive Hrs",
        "Working Hrs",
        "Diesel in Pump(Ltrs)",
        "Diesel in Rig(Ltrs)",
        "Bit No"
    };

    /** Column widths (character units) mirroring DPR Format.xlsx */
    private static final int[] DPR_COL_WIDTHS = {
        15, 15, 11, 12, 12, 14, 12, 16, 11, 25, 10, 10, 13, 11, 10
    };

    // =========================================================================
    //  Template Loading / Fallback Helpers
    // =========================================================================

    private Workbook loadTemplateWorkbook() {
        // 1. Try classpath resource
        try {
            InputStream is = getClass().getResourceAsStream("/templates/DPR_Format.xlsx");
            if (is == null) {
                is = getClass().getResourceAsStream("/templates/DPR Format.xlsx");
            }
            if (is != null) {
                log.info("Loaded DPR Format workbook from classpath template");
                return new XSSFWorkbook(is);
            }
        } catch (Exception e) {
            log.warn("Could not load template from classpath: {}", e.getMessage());
        }

        // 2. Try file system locations
        String[] candidatePaths = {
            "C:/Users/Appr Sujal/Downloads/cmpdi-dams-main/DPR Format.xlsx",
            "../DPR Format.xlsx",
            "../../DPR Format.xlsx",
            "DPR Format.xlsx",
            "cmpdi-dams-main/backend/src/main/resources/templates/DPR_Format.xlsx"
        };
        for (String path : candidatePaths) {
            File file = new File(path);
            if (file.exists() && file.isFile()) {
                try (FileInputStream fis = new FileInputStream(file)) {
                    log.info("Loaded DPR Format workbook from file: {}", path);
                    return new XSSFWorkbook(fis);
                } catch (Exception e) {
                    log.warn("Failed reading template from file {}: {}", path, e.getMessage());
                }
            }
        }

        // 3. Fallback: create fresh workbook strictly matching DPR Format structure
        log.info("Creating DPR Format workbook programmatically");
        return createFallbackWorkbook();
    }

    private Workbook createFallbackWorkbook() {
        Workbook wb = new XSSFWorkbook();
        Sheet sheet = wb.createSheet("Sheet1");

        CellStyle headerStyle = createDprHeaderStyle(wb);
        Row headerRow = sheet.createRow(0);
        headerRow.setHeightInPoints(33.75f);

        for (int i = 0; i < DPR_COLUMNS.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(DPR_COLUMNS[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, DPR_COL_WIDTHS[i] * 256);
        }
        return wb;
    }

    /** Bold Arial-8 header cell style matching DPR Format.xlsx */
    private CellStyle createDprHeaderStyle(Workbook wb) {
        org.apache.poi.ss.usermodel.Font font = wb.createFont();
        font.setFontName("Arial");
        font.setFontHeightInPoints((short) 8);
        font.setBold(true);

        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);
        applyThinBorders(style);
        return style;
    }

    /** Data cell style (Arial-8, centered, thin border) */
    private CellStyle createDprDataStyle(Workbook wb) {
        org.apache.poi.ss.usermodel.Font font = wb.createFont();
        font.setFontName("Arial");
        font.setFontHeightInPoints((short) 8);

        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyThinBorders(style);
        return style;
    }

    private void applyThinBorders(CellStyle style) {
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
    }

    private CellStyle getStyle(CellStyle[] styles, int col, CellStyle defaultStyle) {
        if (styles != null && col < styles.length && styles[col] != null) {
            return styles[col];
        }
        return defaultStyle;
    }

    /** Fills one DPR data row from a DailyReportDTO matching the 15 columns */
    private void writeDprDataRow(Row row, DailyReportDTO r, CellStyle[] styles, CellStyle defaultStyle,
                                  double monthlyCumulative, double yearlyCumulative) {
        row.setHeightInPoints(18f);

        // A (0) – Camp Name
        createStringCell(row, 0, r.getCampName(), getStyle(styles, 0, defaultStyle));
        // B (1) – RIG No.
        createStringCell(row, 1, r.getMachineNumber(), getStyle(styles, 1, defaultStyle));
        // C (2) – Shift
        createStringCell(row, 2, r.getShift(), getStyle(styles, 2, defaultStyle));
        // D (3) – Total Day Progress
        createNumericCell(row, 3, r.getDailyProgress() != null ? r.getDailyProgress().doubleValue() : 0.0, getStyle(styles, 3, defaultStyle));
        // E (4) – Monthly Cummulative Meterage
        createNumericCell(row, 4, monthlyCumulative, getStyle(styles, 4, defaultStyle));
        // F (5) – Yearly Cummulative Meterage
        createNumericCell(row, 5, yearlyCumulative, getStyle(styles, 5, defaultStyle));
        // G (6) – Borehole ID
        String bhId = (r.getBoreholeId() != null && !r.getBoreholeId().isBlank())
                ? r.getBoreholeId() : (r.getDrillHole() != null ? r.getDrillHole() : "");
        createStringCell(row, 6, bhId, getStyle(styles, 6, defaultStyle));
        // H (7) – Borehole Start dt
        String startDt = r.getBoreholeStartDate() != null
                ? r.getBoreholeStartDate().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) : "";
        createStringCell(row, 7, startDt, getStyle(styles, 7, defaultStyle));
        // I (8) – Block Name
        createStringCell(row, 8, r.getBlockName(), getStyle(styles, 8, defaultStyle));
        // J (9) – Remarks
        createStringCell(row, 9, r.getRemarks(), getStyle(styles, 9, defaultStyle));
        // K (10) – Preventive Hrs
        createNumericCell(row, 10, r.getPreventiveHours() != null ? r.getPreventiveHours().doubleValue() : 0.0, getStyle(styles, 10, defaultStyle));
        // L (11) – Working Hrs
        createNumericCell(row, 11, r.getWorkingHours() != null ? r.getWorkingHours().doubleValue() : 0.0, getStyle(styles, 11, defaultStyle));
        // M (12) – Diesel in Pump(Ltrs)
        createNumericCell(row, 12, r.getDieselPump() != null ? r.getDieselPump().doubleValue() : 0.0, getStyle(styles, 12, defaultStyle));
        // N (13) – Diesel in Rig(Ltrs)
        createNumericCell(row, 13, r.getDieselRig() != null ? r.getDieselRig().doubleValue() : 0.0, getStyle(styles, 13, defaultStyle));
        // O (14) – Bit No
        createStringCell(row, 14, r.getBitNo(), getStyle(styles, 14, defaultStyle));
    }

    private void createStringCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        if (style != null) cell.setCellStyle(style);
    }

    private void createNumericCell(Row row, int col, double value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        if (style != null) cell.setCellStyle(style);
    }

    // =========================================================================
    //  Cumulative Progress Calculator
    // =========================================================================

    private Map<Long, Double[]> computeCumulativeProgress(List<DailyReportDTO> reports, Long campId, String status, LocalDate fromDate) {
        Map<Long, Double[]> resultMap = new HashMap<>();
        Map<String, Double> machineMonthlyProgress = new HashMap<>();
        Map<String, Double> machineYearlyProgress = new HashMap<>();

        // If fromDate is specified, fetch prior reports in the current year to initialize cumulative bases
        if (fromDate != null) {
            LocalDate yearStart = fromDate.withDayOfYear(1);
            if (yearStart.isBefore(fromDate)) {
                try {
                    List<DailyReportDTO> priorReports = dailyReportService.getAllReports(campId, status, yearStart, fromDate.minusDays(1));
                    priorReports.sort(Comparator.comparing(DailyReportDTO::getReportDate, Comparator.nullsLast(Comparator.naturalOrder()))
                            .thenComparing(DailyReportDTO::getReportId, Comparator.nullsLast(Comparator.naturalOrder())));

                    for (DailyReportDTO r : priorReports) {
                        if (r.getReportDate() == null) continue;
                        String machine = r.getMachineNumber() != null ? r.getMachineNumber() : "ALL";
                        double prog = r.getDailyProgress() != null ? r.getDailyProgress().doubleValue() : 0.0;
                        String yKey = machine + "_" + r.getReportDate().getYear();
                        machineYearlyProgress.put(yKey, machineYearlyProgress.getOrDefault(yKey, 0.0) + prog);

                        if (r.getReportDate().getMonth() == fromDate.getMonth()) {
                            String mKey = machine + "_" + YearMonth.from(r.getReportDate());
                            machineMonthlyProgress.put(mKey, machineMonthlyProgress.getOrDefault(mKey, 0.0) + prog);
                        }
                    }
                } catch (Exception e) {
                    log.warn("Error calculating prior cumulative meterage: {}", e.getMessage());
                }
            }
        }

        // Process the exported reports in chronological order
        for (DailyReportDTO r : reports) {
            String machine = r.getMachineNumber() != null ? r.getMachineNumber() : "ALL";
            LocalDate date = r.getReportDate() != null ? r.getReportDate() : LocalDate.now();
            String mKey = machine + "_" + YearMonth.from(date);
            String yKey = machine + "_" + date.getYear();

            double prog = r.getDailyProgress() != null ? r.getDailyProgress().doubleValue() : 0.0;
            double mCum = machineMonthlyProgress.getOrDefault(mKey, 0.0) + prog;
            machineMonthlyProgress.put(mKey, mCum);

            double yCum = machineYearlyProgress.getOrDefault(yKey, 0.0) + prog;
            machineYearlyProgress.put(yKey, yCum);

            if (r.getReportId() != null) {
                resultMap.put(r.getReportId(), new Double[]{mCum, yCum});
            }
        }

        return resultMap;
    }

    // =========================================================================
    //  PUBLIC: Daily Excel Report  (Strict DPR Format.xlsx)
    // =========================================================================

    public byte[] generateExcelReport(Long campId, String status,
                                       LocalDate fromDate,
                                       LocalDate toDate) throws IOException {

        List<DailyReportDTO> reports = dailyReportService.getAllReports(campId, status, fromDate, toDate);

        // Sort chronologically (earliest to latest) for accurate progress tracking
        reports.sort(Comparator.comparing(DailyReportDTO::getReportDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(DailyReportDTO::getReportId, Comparator.nullsLast(Comparator.naturalOrder())));

        Map<Long, Double[]> cumulativeMap = computeCumulativeProgress(reports, campId, status, fromDate);

        try (Workbook workbook = loadTemplateWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : workbook.createSheet("Sheet1");

            // Extract styles from template row (index 1) if available
            CellStyle[] templateStyles = new CellStyle[DPR_COLUMNS.length];
            Row templateRow = sheet.getRow(1);
            if (templateRow != null) {
                for (int c = 0; c < DPR_COLUMNS.length; c++) {
                    Cell cell = templateRow.getCell(c);
                    if (cell != null) {
                        templateStyles[c] = cell.getCellStyle();
                    }
                }
            }
            CellStyle defaultDataStyle = createDprDataStyle(workbook);

            // Populate rows starting at index 1 (directly below Row 0 headers)
            for (int i = 0; i < reports.size(); i++) {
                int targetRowIdx = i + 1;
                Row row = sheet.getRow(targetRowIdx);
                if (row == null) {
                    row = sheet.createRow(targetRowIdx);
                }
                DailyReportDTO r = reports.get(i);
                Double[] cum = (r.getReportId() != null) ? cumulativeMap.get(r.getReportId()) : null;
                double mCum = cum != null ? cum[0] : (r.getDailyProgress() != null ? r.getDailyProgress().doubleValue() : 0.0);
                double yCum = cum != null ? cum[1] : (r.getDailyProgress() != null ? r.getDailyProgress().doubleValue() : 0.0);

                writeDprDataRow(row, r, templateStyles, defaultDataStyle, mCum, yCum);
            }

            // If template had extra rows beyond reports size, remove unused rows
            int lastRowNum = sheet.getLastRowNum();
            for (int r = reports.size() + 1; r <= lastRowNum; r++) {
                Row rowToRemove = sheet.getRow(r);
                if (rowToRemove != null) {
                    sheet.removeRow(rowToRemove);
                }
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] generateExcelReport(Long campId, String status) throws IOException {
        return generateExcelReport(campId, status, null, null);
    }

    // =========================================================================
    //  PUBLIC: Sundaywise Excel Report  (Strict DPR Format.xlsx)
    // =========================================================================

    public byte[] generateSundaywiseExcelReport(Long campId, String status, String monthStr) throws IOException {
        YearMonth ym = (monthStr != null && !monthStr.isBlank())
                ? YearMonth.parse(monthStr) : YearMonth.now();
        LocalDate fromDate = ym.atDay(1);
        LocalDate toDate   = ym.atEndOfMonth();

        List<DailyReportDTO> allReports = dailyReportService.getAllReports(campId, status, fromDate, toDate);
        List<DailyReportDTO> sundayReports = allReports.stream()
                .filter(r -> r.getReportDate() != null
                        && r.getReportDate().getDayOfWeek() == java.time.DayOfWeek.SUNDAY)
                .sorted(Comparator.comparing(DailyReportDTO::getReportDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(DailyReportDTO::getReportId, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        Map<Long, Double[]> cumulativeMap = computeCumulativeProgress(sundayReports, campId, status, fromDate);

        try (Workbook workbook = loadTemplateWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : workbook.createSheet("Sheet1");

            CellStyle[] templateStyles = new CellStyle[DPR_COLUMNS.length];
            Row templateRow = sheet.getRow(1);
            if (templateRow != null) {
                for (int c = 0; c < DPR_COLUMNS.length; c++) {
                    Cell cell = templateRow.getCell(c);
                    if (cell != null) {
                        templateStyles[c] = cell.getCellStyle();
                    }
                }
            }
            CellStyle defaultDataStyle = createDprDataStyle(workbook);

            for (int i = 0; i < sundayReports.size(); i++) {
                int targetRowIdx = i + 1;
                Row row = sheet.getRow(targetRowIdx);
                if (row == null) {
                    row = sheet.createRow(targetRowIdx);
                }
                DailyReportDTO r = sundayReports.get(i);
                Double[] cum = (r.getReportId() != null) ? cumulativeMap.get(r.getReportId()) : null;
                double mCum = cum != null ? cum[0] : (r.getDailyProgress() != null ? r.getDailyProgress().doubleValue() : 0.0);
                double yCum = cum != null ? cum[1] : (r.getDailyProgress() != null ? r.getDailyProgress().doubleValue() : 0.0);

                writeDprDataRow(row, r, templateStyles, defaultDataStyle, mCum, yCum);
            }

            int lastRowNum = sheet.getLastRowNum();
            for (int r = sundayReports.size() + 1; r <= lastRowNum; r++) {
                Row rowToRemove = sheet.getRow(r);
                if (rowToRemove != null) {
                    sheet.removeRow(rowToRemove);
                }
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // =========================================================================
    //  PUBLIC: PDF Report  (15 DPR columns – landscape A4)
    // =========================================================================

    public byte[] generatePdfReport(Long campId, String status,
                                     LocalDate fromDate,
                                     LocalDate toDate) throws DocumentException {

        List<DailyReportDTO> reports = dailyReportService.getAllReports(campId, status, fromDate, toDate);
        reports.sort(Comparator.comparing(DailyReportDTO::getReportDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(DailyReportDTO::getReportId, Comparator.nullsLast(Comparator.naturalOrder())));

        Map<Long, Double[]> cumulativeMap = computeCumulativeProgress(reports, campId, status, fromDate);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 15, 15, 15, 15);
        PdfWriter.getInstance(document, out);
        document.open();

        // Title
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, java.awt.Color.BLACK);
        Paragraph title = new Paragraph(
                "CENTRAL MINE PLANNING & DESIGN INSTITUTE LIMITED (CMPDI)", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, java.awt.Color.DARK_GRAY);
        Paragraph subtitle = new Paragraph("DAILY DRILLING PROGRESS REPORT (DPR)", subTitleFont);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        subtitle.setSpacingAfter(4);
        document.add(subtitle);

        String dateRange = (fromDate != null && toDate != null)
                ? fromDate.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"))
                  + " to " + toDate.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"))
                : "All Dates";
        Font infoFont = FontFactory.getFont(FontFactory.HELVETICA, 8, java.awt.Color.GRAY);
        Paragraph info = new Paragraph(
                "Period: " + dateRange + "     Generated On: "
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm:ss")),
                infoFont);
        info.setAlignment(Element.ALIGN_CENTER);
        info.setSpacingAfter(10);
        document.add(info);

        // DPR 15 Columns Table
        PdfPTable table = new PdfPTable(DPR_COLUMNS.length);
        table.setWidthPercentage(100);

        float[] relWidths = { 12f, 11f, 9f, 9f, 10f, 10f, 10f, 11f, 10f, 22f, 8f, 8f, 9f, 9f, 9f };
        try { table.setWidths(relWidths); } catch (DocumentException ignored) {}

        Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, java.awt.Color.WHITE);
        java.awt.Color headerBg = new java.awt.Color(0, 51, 102);

        for (String header : DPR_COLUMNS) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headFont));
            cell.setBackgroundColor(headerBg);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cell.setPadding(3);
            table.addCell(cell);
        }

        Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 6.5f, java.awt.Color.BLACK);

        for (DailyReportDTO r : reports) {
            Double[] cum = (r.getReportId() != null) ? cumulativeMap.get(r.getReportId()) : null;
            double mCum = cum != null ? cum[0] : (r.getDailyProgress() != null ? r.getDailyProgress().doubleValue() : 0.0);
            double yCum = cum != null ? cum[1] : (r.getDailyProgress() != null ? r.getDailyProgress().doubleValue() : 0.0);
            double progress = r.getDailyProgress() != null ? r.getDailyProgress().doubleValue() : 0.0;

            String startDt = r.getBoreholeStartDate() != null
                    ? r.getBoreholeStartDate().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) : "";
            String bhId = (r.getBoreholeId() != null && !r.getBoreholeId().isBlank())
                    ? r.getBoreholeId() : (r.getDrillHole() != null ? r.getDrillHole() : "");

            addPdfCell(table, r.getCampName(), dataFont);
            addPdfCell(table, r.getMachineNumber(), dataFont);
            addPdfCell(table, r.getShift(), dataFont);
            addPdfCell(table, String.format("%.2f", progress), dataFont);
            addPdfCell(table, String.format("%.2f", mCum), dataFont);
            addPdfCell(table, String.format("%.2f", yCum), dataFont);
            addPdfCell(table, bhId, dataFont);
            addPdfCell(table, startDt, dataFont);
            addPdfCell(table, r.getBlockName(), dataFont);
            addPdfCell(table, r.getRemarks(), dataFont);
            addPdfCell(table, r.getPreventiveHours() != null ? r.getPreventiveHours().toString() : "0.00", dataFont);
            addPdfCell(table, r.getWorkingHours() != null ? r.getWorkingHours().toString() : "0.00", dataFont);
            addPdfCell(table, r.getDieselPump() != null ? r.getDieselPump().toString() : "0.00", dataFont);
            addPdfCell(table, r.getDieselRig() != null ? r.getDieselRig().toString() : "0.00", dataFont);
            addPdfCell(table, r.getBitNo(), dataFont);
        }

        document.add(table);

        // Signature section
        Font sigFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, java.awt.Color.DARK_GRAY);
        Paragraph sig = new Paragraph(
                "\n\n___________________________                      ___________________________\n"
                + "   Prepared by (Camp Exec)                             Authorized Signatory (Dept Exec)",
                sigFont);
        document.add(sig);

        document.close();
        return out.toByteArray();
    }

    private void addPdfCell(PdfPTable table, String value, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(value != null ? value : "", font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(3);
        table.addCell(cell);
    }
}
