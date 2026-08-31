package in.gov.cmpdi.dams.service;

import in.gov.cmpdi.dams.dto.*;
import in.gov.cmpdi.dams.entity.Camp;
import in.gov.cmpdi.dams.entity.CorrectionRemark;
import in.gov.cmpdi.dams.entity.DailyDrillingReport;
import in.gov.cmpdi.dams.exception.DuplicateEntryException;
import in.gov.cmpdi.dams.exception.ResourceNotFoundException;
import in.gov.cmpdi.dams.exception.UnauthorizedAccessException;
import in.gov.cmpdi.dams.repository.CampRepository;
import in.gov.cmpdi.dams.repository.CorrectionRemarkRepository;
import in.gov.cmpdi.dams.repository.DailyDrillingReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailyReportService {

    private final DailyDrillingReportRepository reportRepository;
    private final CampRepository campRepository;
    private final CorrectionRemarkRepository correctionRemarkRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<DailyReportDTO> getAllReports(Long campIdFilter, String statusFilter, java.time.LocalDate fromDate, java.time.LocalDate toDate) {
        List<DailyDrillingReport> reports = reportRepository.findByIsDeletedFalseOrderByReportDateDescReportIdDesc();

        return reports.stream()
                .filter(r -> campIdFilter == null || (r.getCamp() != null && campIdFilter.equals(r.getCamp().getId())))
                .filter(r -> statusFilter == null || statusFilter.isEmpty() || (r.getReportStatus() != null && statusFilter.equalsIgnoreCase(r.getReportStatus())))
                .filter(r -> fromDate == null || (r.getReportDate() != null && !r.getReportDate().isBefore(fromDate)))
                .filter(r -> toDate == null || (r.getReportDate() != null && !r.getReportDate().isAfter(toDate)))
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DailyReportDTO> getAllReports(Long campIdFilter, String statusFilter) {
        return getAllReports(campIdFilter, statusFilter, null, null);
    }

    @Transactional(readOnly = true)
    public DailyReportDTO getReportById(Long id) {
        DailyDrillingReport report = reportRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Daily drilling report not found with id: " + id));

        return mapToDTO(report);
    }

    @Transactional
    public DailyReportDTO createReport(DailyReportDTO dto, String username) {
        Camp camp = campRepository.findByIdAndIsDeletedFalse(dto.getCampId())
                .orElseThrow(() -> new ResourceNotFoundException("Camp not found with id: " + dto.getCampId()));

        // Check duplicate entry for same camp, machine, hole, shift, date
        boolean exists = reportRepository.existsByCampIdAndMachineNumberAndDrillHoleAndShiftAndReportDateAndIsDeletedFalse(
                dto.getCampId(), dto.getMachineNumber(), dto.getDrillHole(), dto.getShift(), dto.getReportDate()
        );
        if (exists) {
            throw new DuplicateEntryException(String.format("Report already exists for Camp: %s, Machine: %s, Drill Hole: %s, Shift: %s on Date: %s",
                    camp.getCampName(), dto.getMachineNumber(), dto.getDrillHole(), dto.getShift(), dto.getReportDate()));
        }

        BigDecimal dailyProgress = dto.getClosingDepth().subtract(dto.getOpeningDepth());
        if (dailyProgress.compareTo(BigDecimal.ZERO) < 0) {
            dailyProgress = BigDecimal.ZERO;
        }

        DailyDrillingReport report = DailyDrillingReport.builder()
                .reportDate(dto.getReportDate())
                .camp(camp)
                .machineNumber(dto.getMachineNumber())
                .drillHole(dto.getDrillHole())
                .shift(dto.getShift())
                .plannedDepth(dto.getPlannedDepth())
                .openingDepth(dto.getOpeningDepth())
                .closingDepth(dto.getClosingDepth())
                .dailyProgress(dailyProgress)
                .cumulativeDepth(dto.getCumulativeDepth() != null ? dto.getCumulativeDepth() : dto.getClosingDepth())
                .drillingStartTime(dto.getDrillingStartTime())
                .drillingEndTime(dto.getDrillingEndTime())
                .formation(dto.getFormation())
                .coreRecovery(dto.getCoreRecovery())
                .waterLevel(dto.getWaterLevel())
                .remarks(dto.getRemarks())
                .blockName(dto.getBlockName())
                .boreholeId(dto.getBoreholeId())
                .bitNo(dto.getBitNo())
                .boreholeDepth(dto.getBoreholeDepth())
                .boreholeStartDate(dto.getBoreholeStartDate())
                .workingHours(dto.getWorkingHours())
                .dieselPump(dto.getDieselPump())
                .dieselRig(dto.getDieselRig())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .reportStatus(dto.getReportStatus() != null ? dto.getReportStatus() : "DRAFT")
                .createdBy(username)
                .build();

        DailyDrillingReport saved = reportRepository.save(report);

        auditLogService.logAction("DailyDrillingReport", saved.getReportId().toString(), "CREATE", null,
                "Created report with status: " + saved.getReportStatus(), username, "127.0.0.1");

        return mapToDTO(saved);
    }

    @Transactional
    public DailyReportDTO updateReport(Long id, DailyReportDTO dto, String username) {
        DailyDrillingReport report = reportRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));

        if ("APPROVED".equalsIgnoreCase(report.getReportStatus())) {
            throw new UnauthorizedAccessException("Approved reports are permanently locked and cannot be edited.");
        }

        String oldState = String.format("Status: %s, Closing: %s", report.getReportStatus(), report.getClosingDepth());

        BigDecimal dailyProgress = dto.getClosingDepth().subtract(dto.getOpeningDepth());

        report.setReportDate(dto.getReportDate());
        report.setMachineNumber(dto.getMachineNumber());
        report.setDrillHole(dto.getDrillHole());
        report.setShift(dto.getShift());
        report.setPlannedDepth(dto.getPlannedDepth());
        report.setOpeningDepth(dto.getOpeningDepth());
        report.setClosingDepth(dto.getClosingDepth());
        report.setDailyProgress(dailyProgress);
        report.setCumulativeDepth(dto.getCumulativeDepth() != null ? dto.getCumulativeDepth() : dto.getClosingDepth());
        report.setDrillingStartTime(dto.getDrillingStartTime());
        report.setDrillingEndTime(dto.getDrillingEndTime());
        report.setFormation(dto.getFormation());
        report.setCoreRecovery(dto.getCoreRecovery());
        report.setWaterLevel(dto.getWaterLevel());
        report.setRemarks(dto.getRemarks());
        report.setBlockName(dto.getBlockName());
        report.setBoreholeId(dto.getBoreholeId());
        report.setBitNo(dto.getBitNo());
        report.setBoreholeDepth(dto.getBoreholeDepth());
        report.setBoreholeStartDate(dto.getBoreholeStartDate());
        report.setWorkingHours(dto.getWorkingHours());
        report.setDieselPump(dto.getDieselPump());
        report.setDieselRig(dto.getDieselRig());
        report.setLatitude(dto.getLatitude());
        report.setLongitude(dto.getLongitude());

        if (dto.getReportStatus() != null) {
            report.setReportStatus(dto.getReportStatus());
        }

        DailyDrillingReport updated = reportRepository.save(report);

        auditLogService.logAction("DailyDrillingReport", updated.getReportId().toString(), "UPDATE", oldState,
                String.format("Status: %s, Closing: %s", updated.getReportStatus(), updated.getClosingDepth()), username, "127.0.0.1");

        return mapToDTO(updated);
    }

    @Transactional
    public DailyReportDTO approveReport(Long id, String approverName) {
        DailyDrillingReport report = reportRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));

        report.setReportStatus("APPROVED");
        report.setApprovedBy(approverName);
        report.setApprovedDate(LocalDateTime.now());

        DailyDrillingReport saved = reportRepository.save(report);

        auditLogService.logAction("DailyDrillingReport", id.toString(), "APPROVE", "Status: " + report.getReportStatus(),
                "Status: APPROVED by " + approverName, approverName, "127.0.0.1");

        return mapToDTO(saved);
    }

    @Transactional
    public DailyReportDTO returnReport(Long id, String remarks, String executiveName) {
        DailyDrillingReport report = reportRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));

        report.setReportStatus("RETURNED");
        DailyDrillingReport saved = reportRepository.save(report);

        // Save correction remark
        CorrectionRemark remark = CorrectionRemark.builder()
                .reportId(id)
                .remarks(remarks)
                .createdBy(executiveName)
                .build();
        correctionRemarkRepository.save(remark);

        auditLogService.logAction("DailyDrillingReport", id.toString(), "RETURN", "Status: " + report.getReportStatus(),
                "Status: RETURNED. Remarks: " + remarks, executiveName, "127.0.0.1");

        return mapToDTO(saved);
    }

    @Transactional
    public void deleteReport(Long id, String username) {
        DailyDrillingReport report = reportRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));

        report.setDeleted(true);
        reportRepository.save(report);

        auditLogService.logAction("DailyDrillingReport", id.toString(), "DELETE",
                "Status: " + report.getReportStatus(), "Deleted report by Admin", username, "127.0.0.1");
    }

    public DailyReportDTO mapToDTO(DailyDrillingReport r) {
        List<CorrectionRemarkDTO> remarks = correctionRemarkRepository.findByReportIdOrderByIdDesc(r.getReportId())
                .stream()
                .map(c -> CorrectionRemarkDTO.builder()
                        .id(c.getId())
                        .reportId(c.getReportId())
                        .remarks(c.getRemarks())
                        .createdBy(c.getCreatedBy())
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return DailyReportDTO.builder()
                .reportId(r.getReportId())
                .reportDate(r.getReportDate())
                .campId(r.getCamp().getId())
                .campName(r.getCamp().getCampName())
                .campCode(r.getCamp().getCampCode())
                .machineNumber(r.getMachineNumber())
                .drillHole(r.getDrillHole())
                .shift(r.getShift())
                .plannedDepth(r.getPlannedDepth())
                .openingDepth(r.getOpeningDepth())
                .closingDepth(r.getClosingDepth())
                .dailyProgress(r.getDailyProgress())
                .cumulativeDepth(r.getCumulativeDepth())
                .drillingStartTime(r.getDrillingStartTime())
                .drillingEndTime(r.getDrillingEndTime())
                .formation(r.getFormation())
                .coreRecovery(r.getCoreRecovery())
                .waterLevel(r.getWaterLevel())
                .remarks(r.getRemarks())
                .blockName(r.getBlockName())
                .boreholeId(r.getBoreholeId())
                .bitNo(r.getBitNo())
                .boreholeDepth(r.getBoreholeDepth())
                .boreholeStartDate(r.getBoreholeStartDate())
                .workingHours(r.getWorkingHours())
                .dieselPump(r.getDieselPump())
                .dieselRig(r.getDieselRig())
                .latitude(r.getLatitude())
                .longitude(r.getLongitude())
                .reportStatus(r.getReportStatus())
                .createdBy(r.getCreatedBy())
                .approvedBy(r.getApprovedBy())
                .approvedDate(r.getApprovedDate())
                .version(r.getVersion())
                .correctionHistory(remarks)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
