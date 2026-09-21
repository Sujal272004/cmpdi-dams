package in.gov.cmpdi.dams.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "drill_bits", indexes = {
    @Index(name = "idx_bit_number", columnList = "bit_number"),
    @Index(name = "idx_bit_camp", columnList = "camp_id"),
    @Index(name = "idx_bit_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrillBit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bit_number", nullable = false, length = 50)
    private String bitNumber;

    @Column(name = "bit_type", length = 50)
    private String bitType; // Diamond Core Bit, PDC Bit, Tricone Roller Bit, TC Carbide Bit, etc.

    @Column(name = "size", length = 50)
    private String size; // NX (75.7mm), BX (60mm), NQ, HQ, PQ, etc.

    @Column(name = "manufacturer", length = 100)
    private String manufacturer; // Christensen, Boart Longyear, Sandvik, etc.

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "camp_id", nullable = false)
    private Camp camp;

    @Column(name = "assigned_machine_number", length = 50)
    private String assignedMachineNumber; // e.g. RIG-AND-101

    @Column(name = "status", nullable = false, length = 20)
    private String status; // AVAILABLE, IN_USE, WORN_OUT, MAINTENANCE, SCRAPPED

    @Column(name = "total_meters_drilled", precision = 10, scale = 2)
    private BigDecimal totalMetersDrilled;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "remarks", length = 500)
    private String remarks;

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
        if (status == null) status = "AVAILABLE";
        if (totalMetersDrilled == null) totalMetersDrilled = BigDecimal.ZERO;
        if (issueDate == null) issueDate = LocalDate.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
