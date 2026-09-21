package in.gov.cmpdi.dams.service;

import in.gov.cmpdi.dams.dto.DrillingMachineDTO;
import in.gov.cmpdi.dams.dto.MachineTargetRequestDTO;
import in.gov.cmpdi.dams.entity.Camp;
import in.gov.cmpdi.dams.entity.DrillingMachine;
import in.gov.cmpdi.dams.entity.MachineTarget;
import in.gov.cmpdi.dams.exception.DuplicateEntryException;
import in.gov.cmpdi.dams.exception.ResourceNotFoundException;
import in.gov.cmpdi.dams.repository.CampRepository;
import in.gov.cmpdi.dams.repository.DrillingMachineRepository;
import in.gov.cmpdi.dams.repository.MachineTargetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DrillingMachineService {

    public static final List<String> MONTH_NAMES = List.of(
        "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
    );

    private final DrillingMachineRepository machineRepository;
    private final MachineTargetRepository targetRepository;
    private final CampRepository campRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<DrillingMachineDTO> getAllMachines(Long campId, Integer year) {
        int targetYear = (year != null && year > 2000) ? year : 2026;
        List<DrillingMachine> machines;
        if (campId != null) {
            machines = machineRepository.findByCampIdAndIsDeletedFalse(campId);
        } else {
            machines = machineRepository.findByIsDeletedFalse();
        }

        return machines.stream()
                .map(m -> mapToDTO(m, targetYear))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DrillingMachineDTO getMachineById(Long id, Integer year) {
        int targetYear = (year != null && year > 2000) ? year : 2026;
        DrillingMachine machine = machineRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drilling Machine not found with id: " + id));
        return mapToDTO(machine, targetYear);
    }

    @Transactional
    public DrillingMachineDTO createMachine(DrillingMachineDTO dto, String username) {
        String machineNum = dto.getMachineNumber().trim().toUpperCase();
        if (machineRepository.existsByMachineNumberIgnoreCaseAndIsDeletedFalse(machineNum)) {
            throw new DuplicateEntryException("A drilling machine with number '" + machineNum + "' already exists.");
        }

        Camp camp = campRepository.findByIdAndIsDeletedFalse(dto.getCampId())
                .orElseThrow(() -> new ResourceNotFoundException("Camp not found with id: " + dto.getCampId()));

        BigDecimal monthlyTarget = dto.getMonthlyTarget() != null ? dto.getMonthlyTarget() : BigDecimal.ZERO;
        BigDecimal yearlyTarget = dto.getYearlyTarget() != null ? dto.getYearlyTarget() : BigDecimal.ZERO;

        DrillingMachine machine = DrillingMachine.builder()
                .machineNumber(machineNum)
                .machineName(dto.getMachineName() != null && !dto.getMachineName().trim().isEmpty() ? dto.getMachineName() : machineNum)
                .machineType(dto.getMachineType() != null ? dto.getMachineType() : "Diamond Core Rig")
                .camp(camp)
                .status(dto.getStatus() != null ? dto.getStatus() : "ACTIVE")
                .operatorName(dto.getOperatorName())
                .monthlyTarget(monthlyTarget)
                .yearlyTarget(yearlyTarget)
                .build();

        DrillingMachine saved = machineRepository.save(machine);

        // Seed 12 monthwise targets if provided, or default from monthlyTarget
        int targetYear = dto.getTargetYear() != null ? dto.getTargetYear() : 2026;
        Map<String, BigDecimal> targets = dto.getMonthwiseTargets();
        if (targets == null || targets.isEmpty()) {
            targets = new LinkedHashMap<>();
            for (String m : MONTH_NAMES) {
                targets.put(m, monthlyTarget);
            }
        }
        saveMonthwiseTargets(saved, targetYear, targets, "Initial Target Setup");

        auditLogService.logAction(
            "DrillingMachine", 
            saved.getId().toString(), 
            "CREATE", 
            null, 
            "Created drilling machine: " + saved.getMachineNumber() + " at " + camp.getCampName(), 
            username, 
            "127.0.0.1"
        );

        return mapToDTO(saved, targetYear);
    }

    @Transactional
    public DrillingMachineDTO updateMachine(Long id, DrillingMachineDTO dto, String username) {
        DrillingMachine machine = machineRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drilling Machine not found with id: " + id));

        if (dto.getMachineNumber() != null && !dto.getMachineNumber().equalsIgnoreCase(machine.getMachineNumber())) {
            String newNum = dto.getMachineNumber().trim().toUpperCase();
            if (machineRepository.existsByMachineNumberIgnoreCaseAndIsDeletedFalse(newNum)) {
                throw new DuplicateEntryException("Machine number already taken: " + newNum);
            }
            machine.setMachineNumber(newNum);
        }

        if (dto.getCampId() != null && !dto.getCampId().equals(machine.getCamp().getId())) {
            Camp newCamp = campRepository.findByIdAndIsDeletedFalse(dto.getCampId())
                    .orElseThrow(() -> new ResourceNotFoundException("Camp not found with id: " + dto.getCampId()));
            machine.setCamp(newCamp);
        }

        if (dto.getMachineName() != null) machine.setMachineName(dto.getMachineName());
        if (dto.getMachineType() != null) machine.setMachineType(dto.getMachineType());
        if (dto.getStatus() != null) machine.setStatus(dto.getStatus());
        if (dto.getOperatorName() != null) machine.setOperatorName(dto.getOperatorName());
        if (dto.getMonthlyTarget() != null) machine.setMonthlyTarget(dto.getMonthlyTarget());
        if (dto.getYearlyTarget() != null) machine.setYearlyTarget(dto.getYearlyTarget());

        DrillingMachine updated = machineRepository.save(machine);

        int targetYear = dto.getTargetYear() != null ? dto.getTargetYear() : 2026;
        if (dto.getMonthwiseTargets() != null && !dto.getMonthwiseTargets().isEmpty()) {
            saveMonthwiseTargets(updated, targetYear, dto.getMonthwiseTargets(), "Updated monthly targets");
        }

        auditLogService.logAction(
            "DrillingMachine", 
            updated.getId().toString(), 
            "UPDATE", 
            null, 
            "Updated machine details for: " + updated.getMachineNumber(), 
            username, 
            "127.0.0.1"
        );

        return mapToDTO(updated, targetYear);
    }

    @Transactional
    public void deleteMachine(Long id, String username) {
        DrillingMachine machine = machineRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drilling Machine not found with id: " + id));

        machine.setDeleted(true);
        machineRepository.save(machine);

        auditLogService.logAction(
            "DrillingMachine", 
            id.toString(), 
            "DELETE", 
            "Status: " + machine.getStatus(), 
            "Deleted machine: " + machine.getMachineNumber(), 
            username, 
            "127.0.0.1"
        );
    }

    @Transactional(readOnly = true)
    public Map<String, BigDecimal> getMachineTargets(Long machineId, Integer year) {
        int targetYear = (year != null && year > 2000) ? year : 2026;
        List<MachineTarget> list = targetRepository.findByMachineIdAndTargetYearOrderByMonthIndexAsc(machineId, targetYear);
        Map<String, BigDecimal> result = new LinkedHashMap<>();
        for (String month : MONTH_NAMES) {
            result.put(month, BigDecimal.ZERO);
        }
        for (MachineTarget t : list) {
            result.put(t.getMonthName(), t.getTargetMeters());
        }
        return result;
    }

    @Transactional
    public DrillingMachineDTO setMachineTargets(Long machineId, MachineTargetRequestDTO req, String username) {
        DrillingMachine machine = machineRepository.findByIdAndIsDeletedFalse(machineId)
                .orElseThrow(() -> new ResourceNotFoundException("Drilling Machine not found with id: " + machineId));

        int targetYear = req.getTargetYear() != null ? req.getTargetYear() : 2026;
        saveMonthwiseTargets(machine, targetYear, req.getTargets(), req.getNotes());

        auditLogService.logAction(
            "MachineTarget", 
            machine.getId().toString(), 
            "UPDATE_TARGETS", 
            null, 
            "Updated " + targetYear + " monthwise targets for " + machine.getMachineNumber(), 
            username, 
            "127.0.0.1"
        );

        return mapToDTO(machine, targetYear);
    }

    private void saveMonthwiseTargets(DrillingMachine machine, int targetYear, Map<String, BigDecimal> targets, String notes) {
        if (targets == null) return;

        BigDecimal totalSum = BigDecimal.ZERO;
        int count = 0;

        for (int i = 0; i < MONTH_NAMES.size(); i++) {
            String month = MONTH_NAMES.get(i);
            BigDecimal val = targets.getOrDefault(month, machine.getMonthlyTarget() != null ? machine.getMonthlyTarget() : BigDecimal.ZERO);
            if (val == null || val.compareTo(BigDecimal.ZERO) < 0) val = BigDecimal.ZERO;

            totalSum = totalSum.add(val);
            count++;

            Optional<MachineTarget> existing = targetRepository.findByMachineIdAndTargetYearAndMonthName(
                machine.getId(), targetYear, month
            );

            if (existing.isPresent()) {
                MachineTarget t = existing.get();
                t.setTargetMeters(val);
                t.setNotes(notes);
                targetRepository.save(t);
            } else {
                MachineTarget t = MachineTarget.builder()
                        .machine(machine)
                        .targetYear(targetYear)
                        .monthName(month)
                        .monthIndex(i + 1)
                        .targetMeters(val)
                        .notes(notes)
                        .build();
                targetRepository.save(t);
            }
        }

        // Update total annual target on machine entity - exact sum of all months without dividing by 12
        machine.setYearlyTarget(totalSum);
        machineRepository.save(machine);
    }

    private DrillingMachineDTO mapToDTO(DrillingMachine m, int targetYear) {
        Map<String, BigDecimal> targets = getMachineTargets(m.getId(), targetYear);
        return DrillingMachineDTO.builder()
                .id(m.getId())
                .machineNumber(m.getMachineNumber())
                .machineName(m.getMachineName())
                .machineType(m.getMachineType())
                .campId(m.getCamp() != null ? m.getCamp().getId() : null)
                .campName(m.getCamp() != null ? m.getCamp().getCampName() : null)
                .campCode(m.getCamp() != null ? m.getCamp().getCampCode() : null)
                .status(m.getStatus())
                .operatorName(m.getOperatorName())
                .monthlyTarget(m.getMonthlyTarget())
                .yearlyTarget(m.getYearlyTarget())
                .targetYear(targetYear)
                .monthwiseTargets(targets)
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }
}
