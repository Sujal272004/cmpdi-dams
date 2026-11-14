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
import in.gov.cmpdi.dams.entity.Camp;
import in.gov.cmpdi.dams.entity.DrillingMachine;
import in.gov.cmpdi.dams.repository.CampRepository;
import in.gov.cmpdi.dams.repository.DrillingMachineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.util.CellRangeAddress;
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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private final DailyReportService dailyReportService;
    private final DrillingMachineRepository machineRepository;
    private final CampRepository campRepository;

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
    //  Cumulative Progress Calculator (Financial Year: April 1 to March 31)
    // =========================================================================

    public static LocalDate getFinancialYearStart(LocalDate date) {
        if (date == null) date = LocalDate.now();
        int fyYear = (date.getMonthValue() >= 4) ? date.getYear() : (date.getYear() - 1);
        return LocalDate.of(fyYear, 4, 1);
    }

    public static LocalDate getMonthStart(LocalDate date) {
        if (date == null) date = LocalDate.now();
        return date.withDayOfMonth(1);
    }

    public static String getFinancialYearKey(LocalDate date) {
        if (date == null) date = LocalDate.now();
        int fyYear = (date.getMonthValue() >= 4) ? date.getYear() : (date.getYear() - 1);
        return "FY" + fyYear;
    }

    private Map<Long, Double[]> computeCumulativeProgress(List<DailyReportDTO> reports, Long campId, String status, LocalDate fromDate) {
        Map<Long, Double[]> resultMap = new HashMap<>();
        Map<String, Double> machineMonthlyProgress = new HashMap<>();
        Map<String, Double> machineYearlyProgress = new HashMap<>();

        // If fromDate is specified, fetch prior reports in the financial year to initialize cumulative bases
        if (fromDate != null) {
            LocalDate fyStart = getFinancialYearStart(fromDate);
            LocalDate monthStart = getMonthStart(fromDate);
            if (fyStart.isBefore(fromDate)) {
                try {
                    List<DailyReportDTO> priorReports = dailyReportService.getAllReports(campId, status, fyStart, fromDate.minusDays(1));
                    priorReports.sort(Comparator.comparing(DailyReportDTO::getReportDate, Comparator.nullsLast(Comparator.naturalOrder()))
                            .thenComparing(DailyReportDTO::getReportId, Comparator.nullsLast(Comparator.naturalOrder())));

                    for (DailyReportDTO r : priorReports) {
                        if (r.getReportDate() == null) continue;
                        String machine = r.getMachineNumber() != null ? r.getMachineNumber().trim().toUpperCase() : "ALL";
                        double prog = r.getDailyProgress() != null ? r.getDailyProgress().doubleValue() : 0.0;
                        String yKey = machine + "_" + getFinancialYearKey(r.getReportDate());
                        machineYearlyProgress.put(yKey, machineYearlyProgress.getOrDefault(yKey, 0.0) + prog);

                        if (!r.getReportDate().isBefore(monthStart)) {
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
            String machine = r.getMachineNumber() != null ? r.getMachineNumber().trim().toUpperCase() : "ALL";
            LocalDate date = r.getReportDate() != null ? r.getReportDate() : LocalDate.now();
            String mKey = machine + "_" + YearMonth.from(date);
            String yKey = machine + "_" + getFinancialYearKey(date);

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
    //  PUBLIC: Official Daily Excel Report – DRILLING PROGRESS OF RI-IV,NAGPUR
    // =========================================================================

    public byte[] generateExcelReport(Long campId, String status,
                                       LocalDate fromDate,
                                       LocalDate toDate) throws IOException {

        LocalDate reportDate = (toDate != null) ? toDate : (fromDate != null ? fromDate : LocalDate.now());
        LocalDate fyStart = getFinancialYearStart(reportDate);
        LocalDate monthStart = getMonthStart(reportDate);

        // Calculate actual drilling meterage done till date for every machine in financial year
        List<DailyReportDTO> fyReports = dailyReportService.getAllReports(null, null, fyStart, reportDate);
        Map<String, Double> machineYearlyMeterage = new HashMap<>();
        Map<String, Double> machineMonthlyMeterage = new HashMap<>();

        for (DailyReportDTO r : fyReports) {
            if (r.getMachineNumber() == null || r.getReportDate() == null) continue;
            String mKey = r.getMachineNumber().trim().toUpperCase();
            double prog = r.getDailyProgress() != null ? r.getDailyProgress().doubleValue() : 0.0;
            machineYearlyMeterage.put(mKey, machineYearlyMeterage.getOrDefault(mKey, 0.0) + prog);

            if (!r.getReportDate().isBefore(monthStart) && !r.getReportDate().isAfter(reportDate)) {
                machineMonthlyMeterage.put(mKey, machineMonthlyMeterage.getOrDefault(mKey, 0.0) + prog);
            }
        }

        List<DailyReportDTO> reports = dailyReportService.getAllReports(campId, status, fromDate, toDate);
        reports.sort(Comparator.comparing(DailyReportDTO::getReportDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(DailyReportDTO::getReportId, Comparator.nullsLast(Comparator.naturalOrder())));

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("RI-IV Progress");

            // Setup 17 Column Widths
            int[] colWidths = { 16, 10, 10, 12, 16, 16, 12, 22, 24, 10, 16, 45, 14, 14, 12, 12, 16 };
            for (int i = 0; i < colWidths.length; i++) {
                sheet.setColumnWidth(i, colWidths[i] * 256);
            }

            // Cell Styles
            CellStyle titleStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font titleFont = workbook.createFont();
            titleFont.setFontName("Arial");
            titleFont.setFontHeightInPoints((short) 12);
            titleFont.setBold(true);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            CellStyle dateStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font dateFont = workbook.createFont();
            dateFont.setFontName("Arial");
            dateFont.setFontHeightInPoints((short) 10);
            dateFont.setBold(true);
            dateStyle.setFont(dateFont);
            dateStyle.setAlignment(HorizontalAlignment.CENTER);
            dateStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            CellStyle headStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headFont = workbook.createFont();
            headFont.setFontName("Arial");
            headFont.setFontHeightInPoints((short) 8);
            headFont.setBold(true);
            headStyle.setFont(headFont);
            headStyle.setAlignment(HorizontalAlignment.CENTER);
            headStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headStyle.setWrapText(true);
            applyThinBorders(headStyle);

            CellStyle dataStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font dataFont = workbook.createFont();
            dataFont.setFontName("Arial");
            dataFont.setFontHeightInPoints((short) 8);
            dataStyle.setFont(dataFont);
            dataStyle.setAlignment(HorizontalAlignment.CENTER);
            dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyThinBorders(dataStyle);

            CellStyle dataLeftStyle = workbook.createCellStyle();
            dataLeftStyle.setFont(dataFont);
            dataLeftStyle.setAlignment(HorizontalAlignment.LEFT);
            dataLeftStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            dataLeftStyle.setWrapText(true);
            applyThinBorders(dataLeftStyle);

            CellStyle boldDataStyle = workbook.createCellStyle();
            boldDataStyle.setFont(headFont);
            boldDataStyle.setAlignment(HorizontalAlignment.CENTER);
            boldDataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyThinBorders(boldDataStyle);

            DataFormat df = workbook.createDataFormat();
            short numFormat = df.getFormat("0.00");

            CellStyle numStyle = workbook.createCellStyle();
            numStyle.setFont(dataFont);
            numStyle.setDataFormat(numFormat);
            numStyle.setAlignment(HorizontalAlignment.CENTER);
            numStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyThinBorders(numStyle);

            CellStyle boldNumStyle = workbook.createCellStyle();
            boldNumStyle.setFont(headFont);
            boldNumStyle.setDataFormat(numFormat);
            boldNumStyle.setAlignment(HorizontalAlignment.CENTER);
            boldNumStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyThinBorders(boldNumStyle);

            // Row 0: Title
            int rowIdx = 0;
            Row rTitle = sheet.createRow(rowIdx++);
            rTitle.setHeightInPoints(24f);
            for (int c = 0; c < 17; c++) {
                Cell cell = rTitle.createCell(c);
                cell.setCellStyle(titleStyle);
            }
            rTitle.getCell(0).setCellValue("DRILLING PROGRESS OF RI-IV,NAGPUR");
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 16));

            // Row 1: Date
            String dateStr = reportDate.format(DateTimeFormatter.ofPattern("dd.MM.yyyy"));
            Row rDate = sheet.createRow(rowIdx++);
            rDate.setHeightInPoints(18f);
            for (int c = 0; c < 17; c++) {
                Cell cell = rDate.createCell(c);
                cell.setCellStyle(dateStyle);
            }
            rDate.getCell(0).setCellValue(dateStr);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 16));

            List<Camp> camps = campRepository.findByIsDeletedFalse();
            if (campId != null) {
                camps = camps.stream().filter(c -> c.getId().equals(campId)).collect(Collectors.toList());
            }
            camps.sort(Comparator.comparing(Camp::getId));

            List<DrillingMachine> allMachines = machineRepository.findByIsDeletedFalse();

            Map<Long, List<DailyReportDTO>> reportsByCamp = reports.stream()
                    .filter(r -> r.getCampId() != null)
                    .collect(Collectors.groupingBy(DailyReportDTO::getCampId));

            double grandTotalDaily = 0.0;
            double grandTotalMonthly = 0.0;
            double grandTotalYearly = 0.0;
            double grandTotalDiesel = 0.0;

            for (Camp camp : camps) {
                String campName = camp.getCampName();
                List<DailyReportDTO> campReports = reportsByCamp.getOrDefault(camp.getId(), List.of());
                List<DrillingMachine> campMachines = allMachines.stream()
                        .filter(m -> m.getCamp() != null && m.getCamp().getId().equals(camp.getId()))
                        .collect(Collectors.toList());

                // Camp Header Row 1
                int h1RowIdx = rowIdx++;
                Row h1Row = sheet.createRow(h1RowIdx);
                h1Row.setHeightInPoints(26f);
                for (int c = 0; c < 17; c++) {
                    createStyledCell(h1Row, c, headStyle);
                }
                h1Row.getCell(0).setCellValue(campName);
                h1Row.getCell(1).setCellValue("Shift");
                sheet.addMergedRegion(new CellRangeAddress(h1RowIdx, h1RowIdx, 1, 2));
                h1Row.getCell(3).setCellValue("Total  (m)");
                h1Row.getCell(4).setCellValue("Monthly Cumm.\nMeterage");
                h1Row.getCell(5).setCellValue("Yearly Cumm.\nMeterage");
                h1Row.getCell(6).setCellValue("BH\nDepth\n(m)");
                h1Row.getCell(7).setCellValue("BH ID / Start dt");
                h1Row.getCell(8).setCellValue("Block Name");
                h1Row.getCell(9).setCellValue("BH Type");
                h1Row.getCell(10).setCellValue("B/D Hours.Minutes");
                h1Row.getCell(11).setCellValue("Remarks");
                h1Row.getCell(12).setCellValue("Preventive\nHrs");
                h1Row.getCell(13).setCellValue("Working\nHrs");
                h1Row.getCell(14).setCellValue("Diesel (Ltrs)");
                sheet.addMergedRegion(new CellRangeAddress(h1RowIdx, h1RowIdx, 14, 15));
                h1Row.getCell(16).setCellValue("Bit No");

                // Camp Header Row 2
                int h2RowIdx = rowIdx++;
                Row h2Row = sheet.createRow(h2RowIdx);
                h2Row.setHeightInPoints(18f);
                for (int c = 0; c < 17; c++) {
                    createStyledCell(h2Row, c, headStyle);
                }
                boolean isDurgapur = campName.toLowerCase().contains("durgapur");
                h2Row.getCell(1).setCellValue(isDurgapur ? "1ST SHIFT" : "12hr");
                h2Row.getCell(2).setCellValue(isDurgapur ? "2ND SHIFT" : "");
                h2Row.getCell(14).setCellValue("Pump (Ltrs)");
                h2Row.getCell(15).setCellValue("Rig (Ltrs)");

                double campTotalDaily = 0.0;
                double campTotalMonthly = 0.0;
                double campTotalYearly = 0.0;
                double campTotalPump = 0.0;
                double campTotalRig = 0.0;

                Map<String, List<DailyReportDTO>> reportsByMachine = campReports.stream()
                        .filter(r -> r.getMachineNumber() != null)
                        .collect(Collectors.groupingBy(r -> r.getMachineNumber().trim().toUpperCase()));

                List<String> machineNumbers = campMachines.stream()
                        .map(DrillingMachine::getMachineNumber)
                        .collect(Collectors.toList());
                for (DailyReportDTO r : campReports) {
                    if (r.getMachineNumber() != null && !machineNumbers.contains(r.getMachineNumber())) {
                        machineNumbers.add(r.getMachineNumber());
                    }
                }

                for (String mNum : machineNumbers) {
                    String mKey = mNum.trim().toUpperCase();
                    List<DailyReportDTO> repList = reportsByMachine.getOrDefault(mKey, List.of());

                    double shift1 = 0.0;
                    double shift2 = 0.0;
                    double daily = 0.0;
                    double mCum = machineMonthlyMeterage.getOrDefault(mKey, 0.0);
                    double yCum = machineYearlyMeterage.getOrDefault(mKey, 0.0);
                    String bhDepth = "0.00";
                    String bhIdAndStart = "";
                    String blockName = "";
                    String bhType = "C";
                    String bdHours = "Nil hr";
                    String remarks = "";
                    String prevHrs = "0.00";
                    String workHrs = "0.00";
                    double pump = 0.0;
                    double rig = 0.0;
                    String bitNo = "";

                    if (!repList.isEmpty()) {
                        for (DailyReportDTO rep : repList) {
                            double prog = rep.getDailyProgress() != null ? rep.getDailyProgress().doubleValue() : 0.0;
                            String sh = rep.getShift() != null ? rep.getShift().toLowerCase() : "";
                            if (sh.contains("2nd") || sh.contains("night")) {
                                shift2 += prog;
                            } else {
                                shift1 += prog;
                            }
                            if (rep.getDieselPump() != null) pump += rep.getDieselPump().doubleValue();
                            if (rep.getDieselRig() != null) rig += rep.getDieselRig().doubleValue();
                        }
                        daily = shift1 + shift2;

                        DailyReportDTO latest = repList.get(repList.size() - 1);
                        bhDepth = latest.getBoreholeDepth() != null ? String.format("%.2f", latest.getBoreholeDepth().doubleValue())
                                : (latest.getClosingDepth() != null ? String.format("%.2f", latest.getClosingDepth().doubleValue()) : "0.00");
                        String bId = latest.getBoreholeId() != null && !latest.getBoreholeId().isBlank() ? latest.getBoreholeId() : (latest.getDrillHole() != null ? latest.getDrillHole() : "");
                        String sDt = latest.getBoreholeStartDate() != null ? latest.getBoreholeStartDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")) : "";
                        bhIdAndStart = !sDt.isEmpty() ? (bId + " / " + sDt) : bId;
                        blockName = latest.getBlockName() != null ? latest.getBlockName() : "";
                        if (latest.getDrillingType() != null && !latest.getDrillingType().isBlank()) {
                            bhType = latest.getDrillingType().equalsIgnoreCase("Coring") ? "C" : latest.getDrillingType();
                        }
                        bdHours = latest.getBreakdownHours() != null && !latest.getBreakdownHours().isBlank() ? latest.getBreakdownHours() : "Nil hr";
                        remarks = repList.stream().map(DailyReportDTO::getRemarks).filter(s -> s != null && !s.isBlank()).collect(Collectors.joining("; "));
                        double pSum = repList.stream().mapToDouble(r -> r.getPreventiveHours() != null ? r.getPreventiveHours().doubleValue() : 0.0).sum();
                        prevHrs = pSum > 0 ? String.format("%.2f", pSum) : "0.00";
                        double wSum = repList.stream().mapToDouble(r -> r.getWorkingHours() != null ? r.getWorkingHours().doubleValue() : 0.0).sum();
                        workHrs = wSum > 0 ? String.format("%.2f", wSum) : "0.00";
                        bitNo = latest.getBitNo() != null ? latest.getBitNo() : "";
                    } else {
                        DailyReportDTO prev = dailyReportService.getLatestPreviousReport(mNum, null, reportDate);
                        if (prev != null) {
                            bhDepth = prev.getBoreholeDepth() != null ? String.format("%.2f", prev.getBoreholeDepth().doubleValue())
                                    : (prev.getClosingDepth() != null ? String.format("%.2f", prev.getClosingDepth().doubleValue()) : "0.00");
                            String bId = prev.getBoreholeId() != null && !prev.getBoreholeId().isBlank() ? prev.getBoreholeId() : (prev.getDrillHole() != null ? prev.getDrillHole() : "");
                            String sDt = prev.getBoreholeStartDate() != null ? prev.getBoreholeStartDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")) : "";
                            bhIdAndStart = !sDt.isEmpty() ? (bId + " / " + sDt) : bId;
                            blockName = prev.getBlockName() != null ? prev.getBlockName() : "";
                            if (prev.getDrillingType() != null && !prev.getDrillingType().isBlank()) {
                                bhType = prev.getDrillingType().equalsIgnoreCase("Coring") ? "C" : prev.getDrillingType();
                            }
                            bitNo = prev.getBitNo() != null ? prev.getBitNo() : "";
                        }
                        remarks = "Not operated due to shortage of man power";
                        bdHours = "0.00";
                    }

                    campTotalDaily += daily;
                    campTotalMonthly += mCum;
                    campTotalYearly += yCum;
                    campTotalPump += pump;
                    campTotalRig += rig;

                    Row mRow = sheet.createRow(rowIdx++);
                    mRow.setHeightInPoints(20f);
                    for (int c = 0; c < 17; c++) {
                        createStyledCell(mRow, c, dataStyle);
                    }
                    mRow.getCell(0).setCellStyle(dataLeftStyle);
                    mRow.getCell(0).setCellValue(mNum);
                    mRow.getCell(1).setCellStyle(numStyle);
                    mRow.getCell(1).setCellValue(shift1);
                    mRow.getCell(2).setCellStyle(numStyle);
                    mRow.getCell(2).setCellValue(shift2);
                    mRow.getCell(3).setCellStyle(boldNumStyle);
                    mRow.getCell(3).setCellValue(daily);
                    mRow.getCell(4).setCellStyle(boldNumStyle);
                    mRow.getCell(4).setCellValue(mCum);
                    mRow.getCell(5).setCellStyle(boldNumStyle);
                    mRow.getCell(5).setCellValue(yCum);
                    mRow.getCell(6).setCellValue(bhDepth);
                    mRow.getCell(7).setCellValue(bhIdAndStart);
                    mRow.getCell(8).setCellStyle(dataLeftStyle);
                    mRow.getCell(8).setCellValue(blockName);
                    mRow.getCell(9).setCellValue(bhType);
                    mRow.getCell(10).setCellValue(bdHours);
                    mRow.getCell(11).setCellStyle(dataLeftStyle);
                    mRow.getCell(11).setCellValue(remarks);
                    mRow.getCell(12).setCellValue(prevHrs);
                    mRow.getCell(13).setCellValue(workHrs);
                    mRow.getCell(14).setCellStyle(numStyle);
                    mRow.getCell(14).setCellValue(pump);
                    mRow.getCell(15).setCellStyle(numStyle);
                    mRow.getCell(15).setCellValue(rig);
                    mRow.getCell(16).setCellValue(bitNo);
                }

                // Camp Total Row
                int cTotIdx = rowIdx++;
                Row cTotRow = sheet.createRow(cTotIdx);
                cTotRow.setHeightInPoints(20f);
                for (int c = 0; c < 17; c++) {
                    createStyledCell(cTotRow, c, boldDataStyle);
                }
                cTotRow.getCell(0).setCellValue("Total");
                cTotRow.getCell(3).setCellStyle(boldNumStyle);
                cTotRow.getCell(3).setCellValue(campTotalDaily);
                cTotRow.getCell(4).setCellStyle(boldNumStyle);
                cTotRow.getCell(4).setCellValue(campTotalMonthly);
                cTotRow.getCell(5).setCellStyle(boldNumStyle);
                cTotRow.getCell(5).setCellValue(campTotalYearly);
                cTotRow.getCell(11).setCellStyle(dataLeftStyle);
                cTotRow.getCell(11).setCellValue(campName.toLowerCase().contains("anandwan") ? "Requirement:- 300 nos. NQ drill rod, Pipe wrench 18\",24\" & 36\"" : "");
                if (campTotalPump > 0) {
                    cTotRow.getCell(14).setCellStyle(boldNumStyle);
                    cTotRow.getCell(14).setCellValue(campTotalPump);
                }
                if (campTotalRig > 0) {
                    cTotRow.getCell(15).setCellStyle(boldNumStyle);
                    cTotRow.getCell(15).setCellValue(campTotalRig);
                }

                grandTotalDaily += campTotalDaily;
                grandTotalMonthly += campTotalMonthly;
                grandTotalYearly += campTotalYearly;
                grandTotalDiesel += (campTotalPump + campTotalRig);
            }

            // Grand Total Block (Bottom of Excel sheet)
            // Grand Total Row 1
            int gt1RowIdx = rowIdx++;
            Row gt1 = sheet.createRow(gt1RowIdx);
            gt1.setHeightInPoints(20f);
            for (int c = 0; c < 17; c++) {
                createStyledCell(gt1, c, boldDataStyle);
            }
            gt1.getCell(0).setCellValue("RI-IV, CMPDI, NAGPUR");
            sheet.addMergedRegion(new CellRangeAddress(gt1RowIdx, gt1RowIdx, 0, 3));
            gt1.getCell(4).setCellValue("Monthly Cumm.\nMeterage");
            gt1.getCell(5).setCellValue("Yearly Cumm.\nMeterage");

            // Grand Total Row 2
            int gt2RowIdx = rowIdx++;
            Row gt2 = sheet.createRow(gt2RowIdx);
            gt2.setHeightInPoints(22f);
            for (int c = 0; c < 17; c++) {
                createStyledCell(gt2, c, boldDataStyle);
            }
            gt2.getCell(0).setCellValue("TOTAL (m)");
            sheet.addMergedRegion(new CellRangeAddress(gt2RowIdx, gt2RowIdx, 0, 2));
            gt2.getCell(3).setCellStyle(boldNumStyle);
            gt2.getCell(3).setCellValue(grandTotalDaily);
            gt2.getCell(4).setCellStyle(boldNumStyle);
            gt2.getCell(4).setCellValue(grandTotalMonthly);
            gt2.getCell(5).setCellStyle(boldNumStyle);
            gt2.getCell(5).setCellValue(grandTotalYearly);
            gt2.getCell(14).setCellStyle(boldNumStyle);
            gt2.getCell(14).setCellValue(grandTotalDiesel);
            sheet.addMergedRegion(new CellRangeAddress(gt2RowIdx, gt2RowIdx, 14, 15));

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private Cell createStyledCell(Row row, int col, CellStyle style) {
        Cell cell = row.createCell(col);
        if (style != null) cell.setCellStyle(style);
        return cell;
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
    //  PUBLIC: Official PDF Report – DRILLING PROGRESS OF RI-IV,NAGPUR
    // =========================================================================

    public byte[] generatePdfReport(Long campId, String status,
                                     LocalDate fromDate,
                                     LocalDate toDate) throws DocumentException {

        LocalDate reportDate = (toDate != null) ? toDate : (fromDate != null ? fromDate : LocalDate.now());
        LocalDate fyStart = getFinancialYearStart(reportDate);
        LocalDate monthStart = getMonthStart(reportDate);

        // Calculate actual drilling meterage done till date for every machine in financial year
        List<DailyReportDTO> fyReports = dailyReportService.getAllReports(null, null, fyStart, reportDate);
        Map<String, Double> machineYearlyMeterage = new HashMap<>();
        Map<String, Double> machineMonthlyMeterage = new HashMap<>();

        for (DailyReportDTO r : fyReports) {
            if (r.getMachineNumber() == null || r.getReportDate() == null) continue;
            String mKey = r.getMachineNumber().trim().toUpperCase();
            double prog = r.getDailyProgress() != null ? r.getDailyProgress().doubleValue() : 0.0;
            machineYearlyMeterage.put(mKey, machineYearlyMeterage.getOrDefault(mKey, 0.0) + prog);

            if (!r.getReportDate().isBefore(monthStart) && !r.getReportDate().isAfter(reportDate)) {
                machineMonthlyMeterage.put(mKey, machineMonthlyMeterage.getOrDefault(mKey, 0.0) + prog);
            }
        }

        List<DailyReportDTO> reports = dailyReportService.getAllReports(campId, status, fromDate, toDate);
        reports.sort(Comparator.comparing(DailyReportDTO::getReportDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(DailyReportDTO::getReportId, Comparator.nullsLast(Comparator.naturalOrder())));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        // Compact margins on landscape A4 (842 x 595 pt)
        Document document = new Document(PageSize.A4.rotate(), 10, 10, 12, 12);
        PdfWriter.getInstance(document, out);
        document.open();

        // Title: DRILLING PROGRESS OF RI-IV,NAGPUR
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10.5f, java.awt.Color.BLACK);
        Paragraph title = new Paragraph("DRILLING PROGRESS OF RI-IV,NAGPUR", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        // Date: e.g. 12.11.2026
        String dateStr = reportDate.format(DateTimeFormatter.ofPattern("dd.MM.yyyy"));
        Font dateFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, java.awt.Color.BLACK);
        Paragraph datePara = new Paragraph(dateStr, dateFont);
        datePara.setAlignment(Element.ALIGN_CENTER);
        datePara.setSpacingAfter(6f);
        document.add(datePara);

        // 17-Column Table matching the official layout with Bit No at the end
        PdfPTable table = new PdfPTable(17);
        table.setWidthPercentage(100);
        float[] relWidths = { 62f, 25f, 25f, 32f, 44f, 44f, 30f, 60f, 68f, 30f, 44f, 138f, 30f, 30f, 27f, 27f, 44f };
        table.setWidths(relWidths);

        Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 6.5f, java.awt.Color.BLACK);
        Font subHeadFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 6f, java.awt.Color.BLACK);
        Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 6f, java.awt.Color.BLACK);
        Font boldDataFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 6f, java.awt.Color.BLACK);

        List<Camp> camps = campRepository.findByIsDeletedFalse();
        if (campId != null) {
            camps = camps.stream().filter(c -> c.getId().equals(campId)).collect(Collectors.toList());
        }
        camps.sort(Comparator.comparing(Camp::getId));

        List<DrillingMachine> allMachines = machineRepository.findByIsDeletedFalse();

        Map<Long, List<DailyReportDTO>> reportsByCamp = reports.stream()
                .filter(r -> r.getCampId() != null)
                .collect(Collectors.groupingBy(DailyReportDTO::getCampId));

        double grandTotalDaily = 0.0;
        double grandTotalMonthly = 0.0;
        double grandTotalYearly = 0.0;
        double grandTotalDiesel = 0.0;

        for (Camp camp : camps) {
            String campName = camp.getCampName();
            List<DailyReportDTO> campReports = reportsByCamp.getOrDefault(camp.getId(), List.of());
            List<DrillingMachine> campMachines = allMachines.stream()
                    .filter(m -> m.getCamp() != null && m.getCamp().getId().equals(camp.getId()))
                    .collect(Collectors.toList());

            // Header Row 1 for this camp
            addPdfCell(table, campName, headFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "Shift", headFont, Element.ALIGN_CENTER, 2);
            addPdfCell(table, "Total  (m)", headFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "Monthly Cumm.\nMeterage", headFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "Yearly Cumm.\nMeterage", headFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "BH\nDepth\n(m)", headFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "BH ID / Start dt", headFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "Block Name", headFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "BH Type", headFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "B/D Hours.Minutes", headFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "Remarks", headFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "Preventive\nHrs", headFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "Working\nHrs", headFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "Diesel (Ltrs)", headFont, Element.ALIGN_CENTER, 2);
            addPdfCell(table, "Bit No", headFont, Element.ALIGN_CENTER, 1);

            // Header Row 2 (Subheaders)
            boolean isDurgapur = campName.toLowerCase().contains("durgapur");
            addPdfCell(table, "", subHeadFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, isDurgapur ? "1ST SHIFT" : "12hr", subHeadFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, isDurgapur ? "2ND SHIFT" : "", subHeadFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "", subHeadFont, Element.ALIGN_CENTER, 11);
            addPdfCell(table, "Pump\n(Ltrs)", subHeadFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "Rig (Ltrs)", subHeadFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "", subHeadFont, Element.ALIGN_CENTER, 1);

            double campTotalDaily = 0.0;
            double campTotalMonthly = 0.0;
            double campTotalYearly = 0.0;
            double campTotalPump = 0.0;
            double campTotalRig = 0.0;

            Map<String, List<DailyReportDTO>> reportsByMachine = campReports.stream()
                    .filter(r -> r.getMachineNumber() != null)
                    .collect(Collectors.groupingBy(r -> r.getMachineNumber().trim().toUpperCase()));

            List<String> machineNumbers = campMachines.stream()
                    .map(DrillingMachine::getMachineNumber)
                    .collect(Collectors.toList());
            for (DailyReportDTO r : campReports) {
                if (r.getMachineNumber() != null && !machineNumbers.contains(r.getMachineNumber())) {
                    machineNumbers.add(r.getMachineNumber());
                }
            }

            for (String mNum : machineNumbers) {
                String mKey = mNum.trim().toUpperCase();
                List<DailyReportDTO> repList = reportsByMachine.getOrDefault(mKey, List.of());

                double shift1 = 0.0;
                double shift2 = 0.0;
                double daily = 0.0;
                double mCum = machineMonthlyMeterage.getOrDefault(mKey, 0.0);
                double yCum = machineYearlyMeterage.getOrDefault(mKey, 0.0);
                String bhDepth = "0.00";
                String bhIdAndStart = "";
                String blockName = "";
                String bhType = "C";
                String bdHours = "Nil hr";
                String remarks = "";
                String prevHrs = "0.00";
                String workHrs = "0.00";
                double pump = 0.0;
                double rig = 0.0;
                String bitNo = "";

                if (!repList.isEmpty()) {
                    for (DailyReportDTO rep : repList) {
                        double prog = rep.getDailyProgress() != null ? rep.getDailyProgress().doubleValue() : 0.0;
                        String sh = rep.getShift() != null ? rep.getShift().toLowerCase() : "";
                        if (sh.contains("2nd") || sh.contains("night")) {
                            shift2 += prog;
                        } else {
                            shift1 += prog;
                        }
                        if (rep.getDieselPump() != null) pump += rep.getDieselPump().doubleValue();
                        if (rep.getDieselRig() != null) rig += rep.getDieselRig().doubleValue();
                    }
                    daily = shift1 + shift2;

                    DailyReportDTO latest = repList.get(repList.size() - 1);
                    bhDepth = latest.getBoreholeDepth() != null ? String.format("%.2f", latest.getBoreholeDepth().doubleValue())
                            : (latest.getClosingDepth() != null ? String.format("%.2f", latest.getClosingDepth().doubleValue()) : "0.00");
                    String bId = latest.getBoreholeId() != null && !latest.getBoreholeId().isBlank() ? latest.getBoreholeId() : (latest.getDrillHole() != null ? latest.getDrillHole() : "");
                    String sDt = latest.getBoreholeStartDate() != null ? latest.getBoreholeStartDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")) : "";
                    bhIdAndStart = !sDt.isEmpty() ? (bId + " / " + sDt) : bId;
                    blockName = latest.getBlockName() != null ? latest.getBlockName() : "";
                    if (latest.getDrillingType() != null && !latest.getDrillingType().isBlank()) {
                        bhType = latest.getDrillingType().equalsIgnoreCase("Coring") ? "C" : latest.getDrillingType();
                    }
                    bdHours = latest.getBreakdownHours() != null && !latest.getBreakdownHours().isBlank() ? latest.getBreakdownHours() : "Nil hr";
                    remarks = repList.stream().map(DailyReportDTO::getRemarks).filter(s -> s != null && !s.isBlank()).collect(Collectors.joining("; "));
                    double pSum = repList.stream().mapToDouble(r -> r.getPreventiveHours() != null ? r.getPreventiveHours().doubleValue() : 0.0).sum();
                    prevHrs = pSum > 0 ? String.format("%.2f", pSum) : "0.00";
                    double wSum = repList.stream().mapToDouble(r -> r.getWorkingHours() != null ? r.getWorkingHours().doubleValue() : 0.0).sum();
                    workHrs = wSum > 0 ? String.format("%.2f", wSum) : "0.00";
                    bitNo = latest.getBitNo() != null ? latest.getBitNo() : "";
                } else {
                    DailyReportDTO prev = dailyReportService.getLatestPreviousReport(mNum, null, reportDate);
                    if (prev != null) {
                        bhDepth = prev.getBoreholeDepth() != null ? String.format("%.2f", prev.getBoreholeDepth().doubleValue())
                                : (prev.getClosingDepth() != null ? String.format("%.2f", prev.getClosingDepth().doubleValue()) : "0.00");
                        String bId = prev.getBoreholeId() != null && !prev.getBoreholeId().isBlank() ? prev.getBoreholeId() : (prev.getDrillHole() != null ? prev.getDrillHole() : "");
                        String sDt = prev.getBoreholeStartDate() != null ? prev.getBoreholeStartDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")) : "";
                        bhIdAndStart = !sDt.isEmpty() ? (bId + " / " + sDt) : bId;
                        blockName = prev.getBlockName() != null ? prev.getBlockName() : "";
                        if (prev.getDrillingType() != null && !prev.getDrillingType().isBlank()) {
                            bhType = prev.getDrillingType().equalsIgnoreCase("Coring") ? "C" : prev.getDrillingType();
                        }
                        bitNo = prev.getBitNo() != null ? prev.getBitNo() : "";
                    }
                    remarks = "Not operated due to shortage of man power";
                    bdHours = "0.00";
                }

                campTotalDaily += daily;
                campTotalMonthly += mCum;
                campTotalYearly += yCum;
                campTotalPump += pump;
                campTotalRig += rig;

                addPdfCell(table, mNum, dataFont, Element.ALIGN_LEFT);
                addPdfCell(table, String.format("%.2f", shift1), dataFont, Element.ALIGN_CENTER);
                addPdfCell(table, String.format("%.2f", shift2), dataFont, Element.ALIGN_CENTER);
                addPdfCell(table, String.format("%.2f", daily), boldDataFont, Element.ALIGN_CENTER);
                addPdfCell(table, String.format("%.2f", mCum), boldDataFont, Element.ALIGN_CENTER);
                addPdfCell(table, String.format("%.2f", yCum), boldDataFont, Element.ALIGN_CENTER);
                addPdfCell(table, bhDepth, dataFont, Element.ALIGN_CENTER);
                addPdfCell(table, bhIdAndStart, dataFont, Element.ALIGN_CENTER);
                addPdfCell(table, blockName, dataFont, Element.ALIGN_LEFT);
                addPdfCell(table, bhType, dataFont, Element.ALIGN_CENTER);
                addPdfCell(table, bdHours, dataFont, Element.ALIGN_CENTER);
                addPdfCell(table, remarks, dataFont, Element.ALIGN_LEFT);
                addPdfCell(table, prevHrs, dataFont, Element.ALIGN_CENTER);
                addPdfCell(table, workHrs, dataFont, Element.ALIGN_CENTER);
                addPdfCell(table, String.format("%.2f", pump), dataFont, Element.ALIGN_CENTER);
                addPdfCell(table, String.format("%.2f", rig), dataFont, Element.ALIGN_CENTER);
                addPdfCell(table, bitNo, dataFont, Element.ALIGN_CENTER);
            }

            // Camp Total Row
            addPdfCell(table, "Total", boldDataFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "", boldDataFont, Element.ALIGN_CENTER, 2);
            addPdfCell(table, String.format("%.2f", campTotalDaily), boldDataFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, String.format("%.2f", campTotalMonthly), boldDataFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, String.format("%.2f", campTotalYearly), boldDataFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "", boldDataFont, Element.ALIGN_CENTER, 5);
            addPdfCell(table, campName.toLowerCase().contains("anandwan") ? "Requirement:- 300 nos. NQ drill rod, Pipe wrench 18\",24\" & 36\"" : "", dataFont, Element.ALIGN_LEFT, 1);
            addPdfCell(table, "", boldDataFont, Element.ALIGN_CENTER, 2);
            addPdfCell(table, campTotalPump > 0 ? String.format("%.2f", campTotalPump) : "", boldDataFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, campTotalRig > 0 ? String.format("%.2f", campTotalRig) : "", boldDataFont, Element.ALIGN_CENTER, 1);
            addPdfCell(table, "", boldDataFont, Element.ALIGN_CENTER, 1);

            grandTotalDaily += campTotalDaily;
            grandTotalMonthly += campTotalMonthly;
            grandTotalYearly += campTotalYearly;
            grandTotalDiesel += (campTotalPump + campTotalRig);
        }

        // Grand Total Block (bottom of table)
        // Row 1
        addPdfCell(table, "RI-IV, CMPDI, NAGPUR", boldDataFont, Element.ALIGN_CENTER, 4);
        addPdfCell(table, "Monthly Cumm.\nMeterage", boldDataFont, Element.ALIGN_CENTER, 1);
        addPdfCell(table, "Yearly Cumm.\nMeterage", boldDataFont, Element.ALIGN_CENTER, 1);
        addPdfCell(table, "", boldDataFont, Element.ALIGN_CENTER, 11);

        // Row 2
        addPdfCell(table, "TOTAL (m)", boldDataFont, Element.ALIGN_CENTER, 3);
        addPdfCell(table, String.format("%.2f", grandTotalDaily), boldDataFont, Element.ALIGN_CENTER, 1);
        addPdfCell(table, String.format("%.2f", grandTotalMonthly), boldDataFont, Element.ALIGN_CENTER, 1);
        addPdfCell(table, String.format("%.2f", grandTotalYearly), boldDataFont, Element.ALIGN_CENTER, 1);
        addPdfCell(table, "", boldDataFont, Element.ALIGN_CENTER, 8);
        addPdfCell(table, String.format("%.0f", grandTotalDiesel), boldDataFont, Element.ALIGN_CENTER, 2);
        addPdfCell(table, "", boldDataFont, Element.ALIGN_CENTER, 1);

        document.add(table);
        document.close();
        return out.toByteArray();
    }

    private void addPdfCell(PdfPTable table, String value, Font font, int align) {
        addPdfCell(table, value, font, align, 1);
    }

    private void addPdfCell(PdfPTable table, String value, Font font, int align, int colspan) {
        PdfPCell cell = new PdfPCell(new Phrase(value != null ? value : "", font));
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(2.5f);
        cell.setBorderWidth(0.5f);
        cell.setBorderColor(java.awt.Color.BLACK);
        if (colspan > 1) {
            cell.setColspan(colspan);
        }
        table.addCell(cell);
    }
}
