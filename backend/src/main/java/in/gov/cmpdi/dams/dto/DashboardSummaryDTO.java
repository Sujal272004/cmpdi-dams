package in.gov.cmpdi.dams.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryDTO {
    private long totalCamps;
    private long todayReports;
    private long pendingReports;
    private long approvedReports;
    private long returnedReports;
    private long draftReports;

    private BigDecimal totalMeterDrilled;
    private BigDecimal monthlyProgress;
    private BigDecimal yearlyProgress;
    private BigDecimal previousYearAchievement;
    private String currentFyLabel;
    private String previousFyLabel;
    private BigDecimal fyGrowthPercentage;

    
    private List<Map<String, Object>> campComparison;
    private List<Map<String, Object>> monthlyProgressTrend;
    private List<DailyReportDTO> recentActivities;
    private List<DailyReportDTO> pendingCorrections;
}
