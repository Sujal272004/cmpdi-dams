package in.gov.cmpdi.dams.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "drilling_machines", indexes = {
    @Index(name = "idx_machine_number", columnList = "machine_number"),
    @Index(name = "idx_machine_camp", columnList = "camp_id"),
    @Index(name = "idx_machine_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrillingMachine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "machine_number", nullable = false, length = 50)
    private String machineNumber;

    @Column(name = "machine_name", length = 100)
    private String machineName;

    @Column(name = "machine_type", length = 50)
    private String machineType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "camp_id", nullable = false)
    private Camp camp;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // ACTIVE, MAINTENANCE, STANDBY, INACTIVE

    @Column(name = "operator_name", length = 100)
    private String operatorName;

    @Column(name = "monthly_target", precision = 10, scale = 2)
    private BigDecimal monthlyTarget;

    @Column(name = "yearly_target", precision = 10, scale = 2)
    private BigDecimal yearlyTarget;

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
        if (status == null) status = "ACTIVE";
        if (monthlyTarget == null) monthlyTarget = new BigDecimal("250.00");
        if (yearlyTarget == null) yearlyTarget = monthlyTarget.multiply(new BigDecimal("12"));
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
