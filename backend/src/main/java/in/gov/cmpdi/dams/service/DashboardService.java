package in.gov.cmpdi.dams.service;

import in.gov.cmpdi.dams.dto.DashboardSummaryDTO;
import in.gov.cmpdi.dams.repository.CampRepository;
import in.gov.cmpdi.dams.repository.DailyDrillingReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CampRepository campRepository;
    private final DailyDrillingReportRepository reportRepository;
    private final DailyReportService dailyReportService;

    @Transactional(readOnly = true)
    public DashboardSummaryDTO getDashboardSummary() {
        LocalDate today = LocalDate.now();
        LocalDate firstDayOfMonth = today.withDayOfMonth(1);

        // Calculate Indian Financial Year (Apr 1 to Mar 31)
        int currentYear = today.getYear();
        int currentMonth = today.getMonthValue();
        int currentFyStartYear = (currentMonth >= 4) ? currentYear : currentYear - 1;

        LocalDate currentFyStartDate = LocalDate.of(currentFyStartYear, 4, 1);
        String currentFyLabel = "FY " + currentFyStartYear + "-" + String.format("%02d", (currentFyStartYear + 1) % 100);

        LocalDate previousFyStartDate = LocalDate.of(currentFyStartYear - 1, 4, 1);
        LocalDate previousFyEndDate = LocalDate.of(currentFyStartYear, 3, 31);
        String previousFyLabel = "FY " + (currentFyStartYear - 1) + "-" + String.format("%02d", currentFyStartYear % 100);

        long totalCamps = campRepository.findByIsDeletedFalse().size();
        long todayReports = reportRepository.countTodayReports(today);
        long pendingReports = reportRepository.countByStatus("SUBMITTED");
        long approvedReports = reportRepository.countByStatus("APPROVED");
        long returnedReports = reportRepository.countByStatus("RETURNED");
        long draftReports = reportRepository.countByStatus("DRAFT");

        BigDecimal totalMeterDrilled = reportRepository.sumTotalProgressMeters();
        BigDecimal monthlyProgress = reportRepository.sumProgressMetersBetweenDates(firstDayOfMonth, today);
        BigDecimal yearlyProgress = reportRepository.sumProgressMetersBetweenDates(currentFyStartDate, today);
        BigDecimal dbPrevYear = reportRepository.sumProgressMetersBetweenDates(previousFyStartDate, previousFyEndDate);
        
        BigDecimal previousYearAchievement = (dbPrevYear != null && dbPrevYear.compareTo(BigDecimal.ZERO) > 0)
                ? dbPrevYear
                : new BigDecimal("80000.00");

        BigDecimal fyGrowthPercentage = BigDecimal.ZERO;
        if (previousYearAchievement.compareTo(BigDecimal.ZERO) > 0) {
            fyGrowthPercentage = yearlyProgress
                    .subtract(previousYearAchievement)
                    .multiply(new BigDecimal("100"))
                    .divide(previousYearAchievement, 1, java.math.RoundingMode.HALF_UP);
        }


        // Camp Progress Comparison List
        List<Object[]> campStats = reportRepository.findCampProgressComparison();
        List<Map<String, Object>> campComparison = new ArrayList<>();
        for (Object[] obj : campStats) {
            Map<String, Object> map = new HashMap<>();
            map.put("campName", obj[0]);
            map.put("totalMeters", obj[1]);
            campComparison.add(map);
        }

        return DashboardSummaryDTO.builder()
                .totalCamps(totalCamps)
                .todayReports(todayReports)
                .pendingReports(pendingReports)
                .approvedReports(approvedReports)
                .returnedReports(returnedReports)
                .draftReports(draftReports)
                .totalMeterDrilled(totalMeterDrilled)
                .monthlyProgress(monthlyProgress)
                .yearlyProgress(yearlyProgress)
                .previousYearAchievement(previousYearAchievement)
                .currentFyLabel(currentFyLabel)
                .previousFyLabel(previousFyLabel)
                .fyGrowthPercentage(fyGrowthPercentage)
                .campComparison(campComparison)
                .recentActivities(dailyReportService.getAllReports(null, null).stream().limit(5).toList())
                .pendingCorrections(dailyReportService.getAllReports(null, "RETURNED"))
                .build();
    }

}
