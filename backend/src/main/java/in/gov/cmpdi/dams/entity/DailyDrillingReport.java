package in.gov.cmpdi.dams.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_drilling_reports",
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_camp_machine_hole_shift_date", 
                            columnNames = {"camp_id", "machine_number", "drill_hole", "shift", "report_date"})
       },
       indexes = {
           @Index(name = "idx_reports_camp_date", columnList = "camp_id, report_date"),
           @Index(name = "idx_reports_status", columnList = "report_status"),
           @Index(name = "idx_reports_date", columnList = "report_date"),
           @Index(name = "idx_reports_created", columnList = "created_at DESC")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyDrillingReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long reportId;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "camp_id", nullable = false)
    private Camp camp;

    @Column(name = "machine_number", nullable = false, length = 50)
    private String machineNumber;

    @Column(name = "drill_hole", nullable = false, length = 50)
    private String drillHole;

    @Column(name = "shift", nullable = false, length = 20)
    private String shift; // SHIFT_A, SHIFT_B, SHIFT_C

    @Column(name = "planned_depth", precision = 10, scale = 2)
    private BigDecimal plannedDepth;

    @Column(name = "opening_depth", nullable = false, precision = 10, scale = 2)
    private BigDecimal openingDepth;

    @Column(name = "closing_depth", nullable = false, precision = 10, scale = 2)
    private BigDecimal closingDepth;

    @Column(name = "daily_progress", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyProgress;

    @Column(name = "cumulative_depth", precision = 10, scale = 2)
    private BigDecimal cumulativeDepth;

    @Column(name = "drilling_start_time", length = 10)
    private String drillingStartTime;

    @Column(name = "drilling_end_time", length = 10)
    private String drillingEndTime;

    @Column(name = "formation", length = 150)
    private String formation;

    @Column(name = "core_recovery", precision = 5, scale = 2)
    private BigDecimal coreRecovery; // percentage

    @Column(name = "water_level", precision = 6, scale = 2)
    private BigDecimal waterLevel;

    @Column(name = "remarks", length = 1000)
    private String remarks;

    @Column(name = "block_name", length = 100)
    private String blockName;

    @Column(name = "borehole_id", length = 50)
    private String boreholeId;

    @Column(name = "bit_no", length = 100)
    private String bitNo;


    @Column(name = "borehole_depth", precision = 10, scale = 2)
    private BigDecimal boreholeDepth;

    @Column(name = "borehole_start_date")
    private LocalDate boreholeStartDate;

    @Column(name = "working_hours", precision = 5, scale = 2)
    private BigDecimal workingHours;

    @Column(name = "diesel_pump", precision = 8, scale = 2)
    private BigDecimal dieselPump;

    @Column(name = "diesel_rig", precision = 8, scale = 2)
    private BigDecimal dieselRig;

    @Column(name = "latitude", precision = 10, scale = 6)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 6)
    private BigDecimal longitude;

    @Column(name = "report_status", nullable = false, length = 20)
    private String reportStatus; // DRAFT, SUBMITTED, APPROVED, RETURNED

    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;

    @Version
    @Column(name = "version")
    private Long version;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (reportStatus == null) reportStatus = "DRAFT";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
