package in.gov.cmpdi.dams.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "machine_targets",
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_machine_year_month", columnNames = {"machine_id", "target_year", "month_name"})
       },
       indexes = {
           @Index(name = "idx_machine_year", columnList = "machine_id, target_year")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MachineTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id", nullable = false)
    private DrillingMachine machine;

    @Column(name = "target_year", nullable = false)
    private Integer targetYear;

    @Column(name = "month_name", nullable = false, length = 10)
    private String monthName; // "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"

    @Column(name = "month_index", nullable = false)
    private Integer monthIndex; // 1 to 12

    @Column(name = "target_meters", nullable = false, precision = 10, scale = 2)
    private BigDecimal targetMeters;

    @Column(name = "notes", length = 255)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (targetMeters == null) targetMeters = BigDecimal.ZERO;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
