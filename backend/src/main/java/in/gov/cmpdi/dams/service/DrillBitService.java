package in.gov.cmpdi.dams.service;

import in.gov.cmpdi.dams.dto.DrillBitDTO;
import in.gov.cmpdi.dams.entity.Camp;
import in.gov.cmpdi.dams.entity.DrillBit;
import in.gov.cmpdi.dams.exception.DuplicateEntryException;
import in.gov.cmpdi.dams.exception.ResourceNotFoundException;
import in.gov.cmpdi.dams.repository.CampRepository;
import in.gov.cmpdi.dams.repository.DrillBitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DrillBitService {

    private final DrillBitRepository drillBitRepository;
    private final CampRepository campRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<DrillBitDTO> getAllBits(Long campId, String status) {
        List<DrillBit> bits;
        if (campId != null && status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            bits = drillBitRepository.findByCampIdAndStatusAndIsDeletedFalseOrderByIdDesc(campId, status.toUpperCase());
        } else if (campId != null) {
            bits = drillBitRepository.findByCampIdAndIsDeletedFalseOrderByIdDesc(campId);
        } else if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            bits = drillBitRepository.findByStatusAndIsDeletedFalseOrderByIdDesc(status.toUpperCase());
        } else {
            bits = drillBitRepository.findAllByIsDeletedFalseOrderByIdDesc();
        }

        return bits.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DrillBitDTO getBitById(Long id) {
        DrillBit bit = drillBitRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drill Bit not found with id: " + id));
        return mapToDTO(bit);
    }

    @Transactional
    public DrillBitDTO createBit(DrillBitDTO dto, String username) {
        String bitNum = dto.getBitNumber() != null ? dto.getBitNumber().trim().toUpperCase() : null;
        if (bitNum == null || bitNum.isBlank()) {
            throw new IllegalArgumentException("Bit Number / Serial is required");
        }

        if (drillBitRepository.existsByBitNumberIgnoreCaseAndIsDeletedFalse(bitNum)) {
            throw new DuplicateEntryException("A drill bit with number " + bitNum + " already exists");
        }

        if (dto.getCampId() == null) {
            throw new IllegalArgumentException("Assigned camp is required");
        }

        Camp camp = campRepository.findById(dto.getCampId())
                .orElseThrow(() -> new ResourceNotFoundException("Camp not found with id: " + dto.getCampId()));

        DrillBit bit = DrillBit.builder()
                .bitNumber(bitNum)
                .bitType(dto.getBitType() != null && !dto.getBitType().isBlank() ? dto.getBitType().trim() : "Diamond Core Bit")
                .size(dto.getSize() != null ? dto.getSize().trim() : "NX (75.7mm)")
                .manufacturer(dto.getManufacturer() != null ? dto.getManufacturer().trim() : "")
                .camp(camp)
                .assignedMachineNumber(dto.getAssignedMachineNumber() != null ? dto.getAssignedMachineNumber().trim().toUpperCase() : "")
                .status(dto.getStatus() != null ? dto.getStatus().trim().toUpperCase() : "AVAILABLE")
                .totalMetersDrilled(dto.getTotalMetersDrilled() != null ? dto.getTotalMetersDrilled() : BigDecimal.ZERO)
                .issueDate(dto.getIssueDate() != null ? dto.getIssueDate() : LocalDate.now())
                .remarks(dto.getRemarks())
                .build();

        DrillBit saved = drillBitRepository.save(bit);

        auditLogService.logAction(
                "DRILL_BIT",
                saved.getId().toString(),
                "CREATE",
                null,
                "Created bit " + saved.getBitNumber() + " at " + camp.getCampName(),
                username,
                null
        );

        return mapToDTO(saved);
    }

    @Transactional
    public DrillBitDTO updateBit(Long id, DrillBitDTO dto, String username) {
        DrillBit bit = drillBitRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drill Bit not found with id: " + id));

        String oldStatus = bit.getStatus();
        String oldMeters = bit.getTotalMetersDrilled() != null ? bit.getTotalMetersDrilled().toString() : "0";

        if (dto.getBitNumber() != null && !dto.getBitNumber().isBlank()) {
            String newBitNum = dto.getBitNumber().trim().toUpperCase();
            if (drillBitRepository.existsByBitNumberIgnoreCaseAndIdNotAndIsDeletedFalse(newBitNum, id)) {
                throw new DuplicateEntryException("Another drill bit with number " + newBitNum + " already exists");
            }
            bit.setBitNumber(newBitNum);
        }

        if (dto.getCampId() != null && (bit.getCamp() == null || !bit.getCamp().getId().equals(dto.getCampId()))) {
            Camp camp = campRepository.findById(dto.getCampId())
                    .orElseThrow(() -> new ResourceNotFoundException("Camp not found with id: " + dto.getCampId()));
            bit.setCamp(camp);
        }

        if (dto.getBitType() != null) bit.setBitType(dto.getBitType().trim());
        if (dto.getSize() != null) bit.setSize(dto.getSize().trim());
        if (dto.getManufacturer() != null) bit.setManufacturer(dto.getManufacturer().trim());
        if (dto.getAssignedMachineNumber() != null) bit.setAssignedMachineNumber(dto.getAssignedMachineNumber().trim().toUpperCase());
        if (dto.getStatus() != null) bit.setStatus(dto.getStatus().trim().toUpperCase());
        if (dto.getTotalMetersDrilled() != null) bit.setTotalMetersDrilled(dto.getTotalMetersDrilled());
        if (dto.getIssueDate() != null) bit.setIssueDate(dto.getIssueDate());
        if (dto.getRemarks() != null) bit.setRemarks(dto.getRemarks());

        DrillBit updated = drillBitRepository.save(bit);

        auditLogService.logAction(
                "DRILL_BIT",
                updated.getId().toString(),
                "UPDATE",
                "Status: " + oldStatus + ", Meters: " + oldMeters,
                "Status: " + updated.getStatus() + ", Meters: " + updated.getTotalMetersDrilled(),
                username,
                null
        );

        return mapToDTO(updated);
    }

    @Transactional
    public void deleteBit(Long id, String username) {
        DrillBit bit = drillBitRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drill Bit not found with id: " + id));

        bit.setDeleted(true);
        drillBitRepository.save(bit);

        auditLogService.logAction(
                "DRILL_BIT",
                bit.getId().toString(),
                "DELETE",
                "Bit: " + bit.getBitNumber(),
                "Soft deleted",
                username,
                null
        );
    }

    public DrillBitDTO mapToDTO(DrillBit bit) {
        return DrillBitDTO.builder()
                .id(bit.getId())
                .bitNumber(bit.getBitNumber())
                .bitType(bit.getBitType())
                .size(bit.getSize())
                .manufacturer(bit.getManufacturer())
                .campId(bit.getCamp() != null ? bit.getCamp().getId() : null)
                .campName(bit.getCamp() != null ? bit.getCamp().getCampName() : null)
                .campCode(bit.getCamp() != null ? bit.getCamp().getCampCode() : null)
                .assignedMachineNumber(bit.getAssignedMachineNumber())
                .status(bit.getStatus())
                .totalMetersDrilled(bit.getTotalMetersDrilled())
                .issueDate(bit.getIssueDate())
                .remarks(bit.getRemarks())
                .createdAt(bit.getCreatedAt())
                .updatedAt(bit.getUpdatedAt())
                .build();
    }
}
