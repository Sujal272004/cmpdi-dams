package in.gov.cmpdi.dams.repository;

import in.gov.cmpdi.dams.entity.DailyDrillingReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailyDrillingReportRepository extends JpaRepository<DailyDrillingReport, Long>, JpaSpecificationExecutor<DailyDrillingReport> {

    List<DailyDrillingReport> findByIsDeletedFalseOrderByReportDateDescReportIdDesc();
    
    List<DailyDrillingReport> findByCampIdAndIsDeletedFalseOrderByReportDateDescReportIdDesc(Long campId);

    List<DailyDrillingReport> findByReportStatusAndIsDeletedFalseOrderByReportDateDesc(String reportStatus);

    boolean existsByCampIdAndMachineNumberAndDrillHoleAndShiftAndReportDateAndIsDeletedFalse(
            Long campId, String machineNumber, String drillHole, String shift, LocalDate reportDate);

    @Query("SELECT COUNT(r) FROM DailyDrillingReport r WHERE r.isDeleted = false AND r.reportDate = :today")
    long countTodayReports(@Param("today") LocalDate today);

    @Query("SELECT COUNT(r) FROM DailyDrillingReport r WHERE r.isDeleted = false AND r.reportStatus = :status")
    long countByStatus(@Param("status") String status);

    @Query("SELECT COALESCE(SUM(r.dailyProgress), 0) FROM DailyDrillingReport r WHERE r.isDeleted = false")
    BigDecimal sumTotalProgressMeters();

    @Query("SELECT COALESCE(SUM(r.dailyProgress), 0) FROM DailyDrillingReport r WHERE r.isDeleted = false AND r.reportDate >= :startDate AND r.reportDate <= :endDate")
    BigDecimal sumProgressMetersBetweenDates(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);


    @Query("SELECT r.camp.campName as campName, COALESCE(SUM(r.dailyProgress), 0) as totalMeters FROM DailyDrillingReport r WHERE r.isDeleted = false GROUP BY r.camp.campName")
    List<Object[]> findCampProgressComparison();
}
