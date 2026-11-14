package in.gov.cmpdi.dams.service;

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
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Generates a standalone Excel report showing Achievement Against Target
 * for all drilling machines, grouped by camp, with SUB TOTAL and GRAND TOTAL rows.
 *
 * Layout (matches Book1.xlsx format):
 *   Row 0: Title — "ACHIEVEMENT AGAINST TARGET — RI-IV, CMPDI, NAGPUR"
 *   Row 1: "As on: DD.MM.YYYY"
 *   (blank row)
 *   For each camp:
 *     Camp header row: [CAMP NAME] | [blank] | TARGET | Achievement
 *     Machine rows:    [blank]     | Machine No | target | achieved meters
 *     SUB TOTAL row:   [blank]     | SUB TOTAL  | sum    | sum
 *     (blank spacer row)
 *   GRAND TOTAL row:  GRAND TOTAL | [blank] | total target | total achieved
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AchievementExportService {

    private final DailyReportService dailyReportService;
    private final DrillingMachineRepository machineRepository;
    private final CampRepository campRepository;

    // -------------------------------------------------------------------------
    //  PUBLIC API
    // -------------------------------------------------------------------------

    /**
     * Generate Achievement Against Target Excel as a byte array.
     *
     * @param asOfDate  The reference date (defaults to today). FY = April 1 of the same FY year.
     */
    public byte[] generateAchievementReport(LocalDate asOfDate) throws IOException {
        if (asOfDate == null) asOfDate = LocalDate.now();
        final LocalDate reportDate = asOfDate;

        // Build FY meterage map (machineNumber.toUpperCase() -> total drilled meters this FY)
        LocalDate fyStart = ExportService.getFinancialYearStart(reportDate);
        List<DailyReportDTO> fyReports = dailyReportService.getAllReports(null, null, fyStart, reportDate);
        Map<String, Double> machineYearlyMeterage = new HashMap<>();
        for (DailyReportDTO r : fyReports) {
            if (r.getMachineNumber() == null) continue;
            String mKey = r.getMachineNumber().trim().toUpperCase();
            double prog = r.getDailyProgress() != null ? r.getDailyProgress().doubleValue() : 0.0;
            machineYearlyMeterage.put(mKey, machineYearlyMeterage.getOrDefault(mKey, 0.0) + prog);
        }

        // Sort camps by ID
        List<Camp> camps = campRepository.findByIsDeletedFalse();
        camps.sort(Comparator.comparing(Camp::getId));

        List<DrillingMachine> allMachines = machineRepository.findByIsDeletedFalse();

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Achievement vs Target");

            // ---- Column widths (units: 1/256 of a character width) ----
            sheet.setColumnWidth(0, 30 * 256);  // Camp / GRAND TOTAL
            sheet.setColumnWidth(1, 22 * 256);  // Machine No / SUB TOTAL
            sheet.setColumnWidth(2, 16 * 256);  // TARGET
            sheet.setColumnWidth(3, 16 * 256);  // Achievement

            // ---- Fonts ----
            Font titleFont = workbook.createFont();
            titleFont.setFontName("Arial");
            titleFont.setFontHeightInPoints((short) 13);
            titleFont.setBold(true);

            Font subTitleFont = workbook.createFont();
            subTitleFont.setFontName("Arial");
            subTitleFont.setFontHeightInPoints((short) 10);
            subTitleFont.setBold(true);

            Font headFont = workbook.createFont();
            headFont.setFontName("Arial");
            headFont.setFontHeightInPoints((short) 9);
            headFont.setBold(true);

            Font dataFont = workbook.createFont();
            dataFont.setFontName("Arial");
            dataFont.setFontHeightInPoints((short) 9);

            // ---- Styles ----
            DataFormat df = workbook.createDataFormat();
            short numFmt = df.getFormat("0.00");

            // Title style
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            titleStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Sub-title / date style
            CellStyle subTitleStyle = workbook.createCellStyle();
            subTitleStyle.setFont(subTitleFont);
            subTitleStyle.setAlignment(HorizontalAlignment.CENTER);
            subTitleStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Camp header style (bold, light blue background)
            CellStyle campHeadStyle = workbook.createCellStyle();
            campHeadStyle.setFont(headFont);
            campHeadStyle.setAlignment(HorizontalAlignment.CENTER);
            campHeadStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            campHeadStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            campHeadStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            applyThinBorders(campHeadStyle);

            // Camp header LEFT style (for col A — camp name, left-aligned)
            CellStyle campHeadLeftStyle = workbook.createCellStyle();
            campHeadLeftStyle.setFont(headFont);
            campHeadLeftStyle.setAlignment(HorizontalAlignment.LEFT);
            campHeadLeftStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            campHeadLeftStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            campHeadLeftStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            applyThinBorders(campHeadLeftStyle);

            // Data row style (normal)
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setFont(dataFont);
            dataStyle.setAlignment(HorizontalAlignment.CENTER);
            dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyThinBorders(dataStyle);

            // Data row LEFT (machine number)
            CellStyle dataLeftStyle = workbook.createCellStyle();
            dataLeftStyle.setFont(dataFont);
            dataLeftStyle.setAlignment(HorizontalAlignment.LEFT);
            dataLeftStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyThinBorders(dataLeftStyle);

            // Number style (data)
            CellStyle numStyle = workbook.createCellStyle();
            numStyle.setFont(dataFont);
            numStyle.setDataFormat(numFmt);
            numStyle.setAlignment(HorizontalAlignment.CENTER);
            numStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyThinBorders(numStyle);

            // SUB TOTAL style (bold, light yellow bg)
            CellStyle subTotalStyle = workbook.createCellStyle();
            subTotalStyle.setFont(headFont);
            subTotalStyle.setAlignment(HorizontalAlignment.CENTER);
            subTotalStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            subTotalStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            subTotalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            applyThinBorders(subTotalStyle);

            // SUB TOTAL number style (bold, yellow bg, number format)
            CellStyle subTotalNumStyle = workbook.createCellStyle();
            subTotalNumStyle.setFont(headFont);
            subTotalNumStyle.setDataFormat(numFmt);
            subTotalNumStyle.setAlignment(HorizontalAlignment.CENTER);
            subTotalNumStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            subTotalNumStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            subTotalNumStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            applyThinBorders(subTotalNumStyle);

            // GRAND TOTAL style (bold, orange/gold bg)
            CellStyle grandTotalStyle = workbook.createCellStyle();
            grandTotalStyle.setFont(headFont);
            grandTotalStyle.setAlignment(HorizontalAlignment.CENTER);
            grandTotalStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            grandTotalStyle.setFillForegroundColor(IndexedColors.GOLD.getIndex());
            grandTotalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            applyThinBorders(grandTotalStyle);

            // GRAND TOTAL number style
            CellStyle grandTotalNumStyle = workbook.createCellStyle();
            grandTotalNumStyle.setFont(headFont);
            grandTotalNumStyle.setDataFormat(numFmt);
            grandTotalNumStyle.setAlignment(HorizontalAlignment.CENTER);
            grandTotalNumStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            grandTotalNumStyle.setFillForegroundColor(IndexedColors.GOLD.getIndex());
            grandTotalNumStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            applyThinBorders(grandTotalNumStyle);

            // ---- Build Rows ----
            int rowIdx = 0;

            // Row 0: Title
            Row titleRow = sheet.createRow(rowIdx++);
            titleRow.setHeightInPoints(26f);
            for (int c = 0; c < 4; c++) {
                Cell cell = titleRow.createCell(c);
                cell.setCellStyle(titleStyle);
            }
            titleRow.getCell(0).setCellValue("ACHIEVEMENT AGAINST TARGET — RI-IV, CMPDI, NAGPUR");
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 3));

            // Row 1: Date
            String dateLabel = "As on: " + reportDate.format(DateTimeFormatter.ofPattern("dd.MM.yyyy"));
            Row dateRow = sheet.createRow(rowIdx++);
            dateRow.setHeightInPoints(18f);
            for (int c = 0; c < 4; c++) {
                Cell cell = dateRow.createCell(c);
                cell.setCellStyle(subTitleStyle);
            }
            dateRow.getCell(0).setCellValue(dateLabel);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 3));

            // Row 2: FY label
            String fyLabel = "Financial Year: " + fyStart.getYear() + " - " + reportDate.getYear();
            Row fyRow = sheet.createRow(rowIdx++);
            fyRow.setHeightInPoints(16f);
            for (int c = 0; c < 4; c++) {
                Cell cell = fyRow.createCell(c);
                cell.setCellStyle(subTitleStyle);
            }
            fyRow.getCell(0).setCellValue(fyLabel);
            sheet.addMergedRegion(new CellRangeAddress(2, 2, 0, 3));

            // Blank spacer
            rowIdx++;

            double grandTotalTarget = 0.0;
            double grandTotalAchievement = 0.0;

            for (Camp camp : camps) {
                List<DrillingMachine> campMachines = allMachines.stream()
                        .filter(m -> m.getCamp() != null && m.getCamp().getId().equals(camp.getId()))
                        .sorted(Comparator.comparing(DrillingMachine::getMachineNumber))
                        .collect(Collectors.toList());

                if (campMachines.isEmpty()) continue;

                // Camp header row
                int campHeaderIdx = rowIdx++;
                Row campHeader = sheet.createRow(campHeaderIdx);
                campHeader.setHeightInPoints(20f);

                Cell chA = campHeader.createCell(0);
                chA.setCellValue(camp.getCampName());
                chA.setCellStyle(campHeadLeftStyle);

                Cell chB = campHeader.createCell(1);
                chB.setCellStyle(campHeadStyle);

                Cell chC = campHeader.createCell(2);
                chC.setCellValue("TARGET");
                chC.setCellStyle(campHeadStyle);

                Cell chD = campHeader.createCell(3);
                chD.setCellValue("Achievement");
                chD.setCellStyle(campHeadStyle);

                double campTarget = 0.0;
                double campAchievement = 0.0;

                // Machine rows
                for (DrillingMachine dm : campMachines) {
                    String mKey = dm.getMachineNumber().trim().toUpperCase();
                    double target = dm.getYearlyTarget() != null ? dm.getYearlyTarget().doubleValue() : 0.0;
                    double achieved = machineYearlyMeterage.getOrDefault(mKey, 0.0);
                    campTarget += target;
                    campAchievement += achieved;

                    Row mRow = sheet.createRow(rowIdx++);
                    mRow.setHeightInPoints(17f);

                    Cell mA = mRow.createCell(0);
                    mA.setCellStyle(dataStyle); // blank

                    Cell mB = mRow.createCell(1);
                    mB.setCellValue(dm.getMachineNumber());
                    mB.setCellStyle(dataLeftStyle);

                    Cell mC = mRow.createCell(2);
                    mC.setCellValue(target);
                    mC.setCellStyle(numStyle);

                    Cell mD = mRow.createCell(3);
                    mD.setCellValue(achieved);
                    mD.setCellStyle(numStyle);
                }

                // SUB TOTAL row
                int stIdx = rowIdx++;
                Row subTotal = sheet.createRow(stIdx);
                subTotal.setHeightInPoints(19f);

                Cell stA = subTotal.createCell(0);
                stA.setCellStyle(subTotalStyle);

                Cell stB = subTotal.createCell(1);
                stB.setCellValue("SUB TOTAL");
                stB.setCellStyle(subTotalStyle);

                Cell stC = subTotal.createCell(2);
                stC.setCellValue(campTarget);
                stC.setCellStyle(subTotalNumStyle);

                Cell stD = subTotal.createCell(3);
                stD.setCellValue(campAchievement);
                stD.setCellStyle(subTotalNumStyle);

                // Blank spacer row between camps
                rowIdx++;

                grandTotalTarget += campTarget;
                grandTotalAchievement += campAchievement;
            }

            // GRAND TOTAL row
            int gtIdx = rowIdx++;
            Row gtRow = sheet.createRow(gtIdx);
            gtRow.setHeightInPoints(22f);

            Cell gtA = gtRow.createCell(0);
            gtA.setCellValue("GRAND TOTAL");
            gtA.setCellStyle(grandTotalStyle);

            Cell gtB = gtRow.createCell(1);
            gtB.setCellStyle(grandTotalStyle);

            Cell gtC = gtRow.createCell(2);
            gtC.setCellValue(grandTotalTarget);
            gtC.setCellStyle(grandTotalNumStyle);

            Cell gtD = gtRow.createCell(3);
            gtD.setCellValue(grandTotalAchievement);
            gtD.setCellStyle(grandTotalNumStyle);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // -------------------------------------------------------------------------
    //  Helpers
    // -------------------------------------------------------------------------

    private void applyThinBorders(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }
}

