package in.gov.cmpdi.dams.service;

import in.gov.cmpdi.dams.dto.CampDTO;
import in.gov.cmpdi.dams.entity.Camp;
import in.gov.cmpdi.dams.exception.DuplicateEntryException;
import in.gov.cmpdi.dams.exception.ResourceNotFoundException;
import in.gov.cmpdi.dams.repository.CampRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampService {

    private final CampRepository campRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<CampDTO> getAllCamps() {
        return campRepository.findByIsDeletedFalse().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CampDTO getCampById(Long id) {
        Camp camp = campRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Camp not found with id: " + id));
        return mapToDTO(camp);
    }

    @Transactional
    public CampDTO createCamp(CampDTO dto, String adminUsername) {
        if (campRepository.existsByCampCodeAndIsDeletedFalse(dto.getCampCode())) {
            throw new DuplicateEntryException("Camp code already exists: " + dto.getCampCode());
        }

        Camp camp = Camp.builder()
                .campCode(dto.getCampCode())
                .campName(dto.getCampName())
                .location(dto.getLocation())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .status(dto.getStatus() != null ? dto.getStatus() : "ACTIVE")
                .build();

        Camp saved = campRepository.save(camp);
        auditLogService.logAction("Camp", saved.getId().toString(), "CREATE", null, "Created camp: " + saved.getCampName(), adminUsername, "127.0.0.1");

        return mapToDTO(saved);
    }

    @Transactional
    public CampDTO updateCamp(Long id, CampDTO dto, String adminUsername) {
        Camp camp = campRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Camp not found with id: " + id));

        if (dto.getCampName() != null) camp.setCampName(dto.getCampName());
        if (dto.getLocation() != null) camp.setLocation(dto.getLocation());
        if (dto.getLatitude() != null) camp.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) camp.setLongitude(dto.getLongitude());
        if (dto.getStatus() != null) camp.setStatus(dto.getStatus());
        if (dto.getDailyTarget() != null) camp.setDailyTarget(dto.getDailyTarget());
        if (dto.getWeeklyTarget() != null) camp.setWeeklyTarget(dto.getWeeklyTarget());
        if (dto.getMonthlyTarget() != null) camp.setMonthlyTarget(dto.getMonthlyTarget());
        if (dto.getYearlyTarget() != null) camp.setYearlyTarget(dto.getYearlyTarget());

        Camp updated = campRepository.save(camp);
        auditLogService.logAction("Camp", id.toString(), "UPDATE", null, "Updated camp: " + updated.getCampName(), adminUsername, "127.0.0.1");

        return mapToDTO(updated);
    }

    @Transactional
    public CampDTO updateCampTargets(Long id, CampDTO dto, String adminUsername) {
        Camp camp = campRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Camp not found with id: " + id));

        if (dto.getDailyTarget() != null) camp.setDailyTarget(dto.getDailyTarget());
        if (dto.getWeeklyTarget() != null) camp.setWeeklyTarget(dto.getWeeklyTarget());
        if (dto.getMonthlyTarget() != null) camp.setMonthlyTarget(dto.getMonthlyTarget());
        if (dto.getYearlyTarget() != null) camp.setYearlyTarget(dto.getYearlyTarget());

        Camp updated = campRepository.save(camp);
        auditLogService.logAction("Camp", id.toString(), "UPDATE_TARGETS", null,
                String.format("Updated targets for %s: Day=%s, Wk=%s, Mo=%s, Yr=%s",
                        updated.getCampName(), updated.getDailyTarget(), updated.getWeeklyTarget(),
                        updated.getMonthlyTarget(), updated.getYearlyTarget()),
                adminUsername, "127.0.0.1");

        return mapToDTO(updated);
    }

    @Transactional
    public void deleteCamp(Long id, String adminUsername) {
        Camp camp = campRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Camp not found with id: " + id));

        camp.setDeleted(true);
        campRepository.save(camp);
        auditLogService.logAction("Camp", id.toString(), "DELETE", "Camp: " + camp.getCampName(), "Soft Deleted", adminUsername, "127.0.0.1");
    }

    private CampDTO mapToDTO(Camp c) {
        return CampDTO.builder()
                .id(c.getId())
                .campCode(c.getCampCode())
                .campName(c.getCampName())
                .location(c.getLocation())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .status(c.getStatus())
                .dailyTarget(c.getDailyTarget() != null ? c.getDailyTarget() : new java.math.BigDecimal("20.00"))
                .weeklyTarget(c.getWeeklyTarget() != null ? c.getWeeklyTarget() : new java.math.BigDecimal("120.00"))
                .monthlyTarget(c.getMonthlyTarget() != null ? c.getMonthlyTarget() : new java.math.BigDecimal("450.00"))
                .yearlyTarget(c.getYearlyTarget() != null ? c.getYearlyTarget() : new java.math.BigDecimal("3600.00"))
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
