package in.gov.cmpdi.dams.controller;

import in.gov.cmpdi.dams.dto.ApiResponse;
import in.gov.cmpdi.dams.dto.CampDTO;
import in.gov.cmpdi.dams.dto.DailyReportDTO;
import in.gov.cmpdi.dams.service.CampService;
import in.gov.cmpdi.dams.service.DailyReportService;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/gis")
@RequiredArgsConstructor
public class GisController {

    private final CampService campService;
    private final DailyReportService dailyReportService;

    @Getter
    @Builder
    public static class GisMapDataPayload {
        private List<CampDTO> camps;
        private List<GisRigMarker> rigs;
        private GisSummaryStats summary;
    }

    @Getter
    @Builder
    public static class GisRigMarker {
        private String id;
        private String machineNumber;
        private String drillHole;
        private Long campId;
        private String campName;
        private String blockName;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private BigDecimal currentDepth;
        private BigDecimal plannedDepth;
        private BigDecimal dailyProgress;
        private String status; // ACTIVE, MAINTENANCE, STANDBY
        private String lastUpdated;
    }

    @Getter
    @Builder
    public static class GisSummaryStats {
        private int totalCamps;
        private int totalActiveRigs;
        private double totalMappedMeters;
        private int activeBlocksCount;
    }

    @GetMapping("/map-data")
    public ResponseEntity<ApiResponse<GisMapDataPayload>> getMapData() {
        List<CampDTO> camps = campService.getAllCamps();
        List<DailyReportDTO> reports = dailyReportService.getAllReports(null, null, null, null);

        List<GisRigMarker> rigMarkers = new ArrayList<>();
        Set<String> blocks = new HashSet<>();
        double totalMeters = 0;

        // Coordinates offsets for machines per camp to scatter markers naturally in the block
        double[][] offsets = {
            {0.012, 0.015}, {-0.008, -0.012}, {0.021, -0.005}, {-0.015, 0.018}, {0.005, -0.022}
        };

        int index = 0;
        for (DailyReportDTO r : reports) {
            CampDTO camp = camps.stream().filter(c -> c.getId().equals(r.getCampId())).findFirst().orElse(null);
            
            double rigLat;
            double rigLng;
            if (r.getLatitude() != null && r.getLongitude() != null) {
                rigLat = r.getLatitude().doubleValue();
                rigLng = r.getLongitude().doubleValue();
            } else {
                double baseLat = camp != null && camp.getLatitude() != null ? camp.getLatitude().doubleValue() : 20.5937;
                double baseLng = camp != null && camp.getLongitude() != null ? camp.getLongitude().doubleValue() : 78.9629;
                double[] offset = offsets[index % offsets.length];
                rigLat = baseLat + offset[0];
                rigLng = baseLng + offset[1];
            }
            index++;

            String blockName = r.getCampName() != null ? r.getCampName() + " Sector" : "Exploration Block A";
            blocks.add(blockName);

            if (r.getDailyProgress() != null) {
                totalMeters += r.getDailyProgress().doubleValue();
            }

            rigMarkers.add(GisRigMarker.builder()
                    .id("RIG-" + r.getReportId())
                    .machineNumber(r.getMachineNumber())
                    .drillHole(r.getDrillHole())
                    .campId(r.getCampId())
                    .campName(r.getCampName())
                    .blockName(blockName)
                    .latitude(BigDecimal.valueOf(rigLat))
                    .longitude(BigDecimal.valueOf(rigLng))
                    .currentDepth(r.getClosingDepth() != null ? r.getClosingDepth() : BigDecimal.ZERO)
                    .plannedDepth(r.getPlannedDepth() != null ? r.getPlannedDepth() : BigDecimal.valueOf(500))
                    .dailyProgress(r.getDailyProgress() != null ? r.getDailyProgress() : BigDecimal.ZERO)
                    .status("APPROVED".equalsIgnoreCase(r.getReportStatus()) ? "ACTIVE" : "STANDBY")
                    .lastUpdated(r.getReportDate() != null ? r.getReportDate().toString() : "Recently")
                    .build());
        }

        // If no reports exist yet, seed demo rig markers for active camps
        if (rigMarkers.isEmpty()) {
            int rigId = 1;
            for (CampDTO camp : camps) {
                double baseLat = camp.getLatitude() != null ? camp.getLatitude().doubleValue() : 20.5937;
                double baseLng = camp.getLongitude() != null ? camp.getLongitude().doubleValue() : 78.9629;

                for (int i = 1; i <= 2; i++) {
                    double[] offset = offsets[(rigId - 1) % offsets.length];
                    rigMarkers.add(GisRigMarker.builder()
                            .id("RIG-SEED-" + rigId)
                            .machineNumber("RIG-" + camp.getCampCode() + "-0" + i)
                            .drillHole("BH-" + (100 + rigId))
                            .campId(camp.getId())
                            .campName(camp.getCampName())
                            .blockName(camp.getCampName() + " Sector " + i)
                            .latitude(BigDecimal.valueOf(baseLat + offset[0]))
                            .longitude(BigDecimal.valueOf(baseLng + offset[1]))
                            .currentDepth(BigDecimal.valueOf(120.5 + (i * 15)))
                            .plannedDepth(BigDecimal.valueOf(450.0))
                            .dailyProgress(BigDecimal.valueOf(18.5 + i))
                            .status(i == 1 ? "ACTIVE" : "MAINTENANCE")
                            .lastUpdated("Today")
                            .build());
                    blocks.add(camp.getCampName() + " Sector " + i);
                    totalMeters += 120.5 + (i * 15);
                    rigId++;
                }
            }
        }

        GisSummaryStats summary = GisSummaryStats.builder()
                .totalCamps(camps.size())
                .totalActiveRigs(rigMarkers.size())
                .totalMappedMeters(Math.round(totalMeters * 100.0) / 100.0)
                .activeBlocksCount(Math.max(blocks.size(), 3))
                .build();

        GisMapDataPayload payload = GisMapDataPayload.builder()
                .camps(camps)
                .rigs(rigMarkers)
                .summary(summary)
                .build();

        return ResponseEntity.ok(ApiResponse.ok("GIS map data fetched successfully", payload));
    }
}
