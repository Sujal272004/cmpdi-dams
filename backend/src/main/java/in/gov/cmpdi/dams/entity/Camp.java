package in.gov.cmpdi.dams.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "camps", indexes = {
    @Index(name = "idx_camp_code", columnList = "camp_code"),
    @Index(name = "idx_camp_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Camp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "camp_code", nullable = false, unique = true, length = 50)
    private String campCode;

    @Column(name = "camp_name", nullable = false, length = 100)
    private String campName;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "latitude", precision = 10, scale = 6)
    private java.math.BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 6)
    private java.math.BigDecimal longitude;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // ACTIVE, INACTIVE

    @Column(name = "daily_target", precision = 10, scale = 2)
    private java.math.BigDecimal dailyTarget;

    @Column(name = "weekly_target", precision = 10, scale = 2)
    private java.math.BigDecimal weeklyTarget;

    @Column(name = "monthly_target", precision = 10, scale = 2)
    private java.math.BigDecimal monthlyTarget;

    @Column(name = "yearly_target", precision = 10, scale = 2)
    private java.math.BigDecimal yearlyTarget;

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
        if (dailyTarget == null) dailyTarget = new java.math.BigDecimal("20.00");
        if (weeklyTarget == null) weeklyTarget = new java.math.BigDecimal("120.00");
        if (monthlyTarget == null) monthlyTarget = new java.math.BigDecimal("450.00");
        if (yearlyTarget == null) yearlyTarget = new java.math.BigDecimal("3600.00");
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
