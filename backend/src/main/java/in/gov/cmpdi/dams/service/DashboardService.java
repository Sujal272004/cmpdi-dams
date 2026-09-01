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
        LocalDate firstDayOfYear = today.withDayOfYear(1);

        long totalCamps = campRepository.findByIsDeletedFalse().size();
        long todayReports = reportRepository.countTodayReports(today);
        long pendingReports = reportRepository.countByStatus("SUBMITTED");
        long approvedReports = reportRepository.countByStatus("APPROVED");
        long returnedReports = reportRepository.countByStatus("RETURNED");
        long draftReports = reportRepository.countByStatus("DRAFT");

        BigDecimal totalMeterDrilled = reportRepository.sumTotalProgressMeters();
        BigDecimal monthlyProgress = reportRepository.sumProgressMetersBetweenDates(firstDayOfMonth, today);
        BigDecimal yearlyProgress = reportRepository.sumProgressMetersBetweenDates(firstDayOfYear, today);

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
                .campComparison(campComparison)
                .recentActivities(dailyReportService.getAllReports(null, null).stream().limit(5).toList())
                .pendingCorrections(dailyReportService.getAllReports(null, "RETURNED"))
                .build();
    }
}
