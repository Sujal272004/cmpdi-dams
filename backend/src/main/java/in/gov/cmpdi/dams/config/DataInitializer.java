package in.gov.cmpdi.dams.config;

import in.gov.cmpdi.dams.entity.Camp;
import in.gov.cmpdi.dams.entity.User;
import in.gov.cmpdi.dams.repository.CampRepository;
import in.gov.cmpdi.dams.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final CampRepository campRepository;
    private final UserRepository userRepository;
    private final in.gov.cmpdi.dams.repository.DrillingMachineRepository machineRepository;
    private final in.gov.cmpdi.dams.repository.MachineTargetRepository targetRepository;
    private final in.gov.cmpdi.dams.repository.DrillBitRepository bitRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedCampsIfEmpty();
        seedUsersIfEmpty();
        seedMachinesIfEmpty();
        seedBitsIfEmpty();
    }

    private void seedCampsIfEmpty() {
        if (campRepository.count() == 0) {
            log.info("Seeding initial CMPDI exploration camps...");
            Camp camp1 = Camp.builder()
                    .campCode("CMPDI-AND-01")
                    .campName("Anandwan Camp")
                    .location("Chandrapur District, Maharashtra")
                    .latitude(new BigDecimal("19.961500"))
                    .longitude(new BigDecimal("79.296100"))
                    .status("ACTIVE")
                    .dailyTarget(new BigDecimal("25.00"))
                    .weeklyTarget(new BigDecimal("150.00"))
                    .monthlyTarget(new BigDecimal("600.00"))
                    .yearlyTarget(new BigDecimal("4800.00"))
                    .build();

            Camp camp2 = Camp.builder()
                    .campCode("CMPDI-MRP-02")
                    .campName("Murpar Camp")
                    .location("Nagpur District, Maharashtra")
                    .latitude(new BigDecimal("20.852400"))
                    .longitude(new BigDecimal("78.985600"))
                    .status("ACTIVE")
                    .dailyTarget(new BigDecimal("20.00"))
                    .weeklyTarget(new BigDecimal("120.00"))
                    .monthlyTarget(new BigDecimal("450.00"))
                    .yearlyTarget(new BigDecimal("3600.00"))
                    .build();

            Camp camp3 = Camp.builder()
                    .campCode("CMPDI-DGP-03")
                    .campName("Durgapur Camp")
                    .location("Paschim Bardhaman, West Bengal")
                    .latitude(new BigDecimal("23.520400"))
                    .longitude(new BigDecimal("87.311900"))
                    .status("ACTIVE")
                    .dailyTarget(new BigDecimal("30.00"))
                    .weeklyTarget(new BigDecimal("180.00"))
                    .monthlyTarget(new BigDecimal("700.00"))
                    .yearlyTarget(new BigDecimal("5000.00"))
                    .build();

            campRepository.saveAll(List.of(camp1, camp2, camp3));
            log.info("Successfully seeded 3 CMPDI camps.");
        }
    }

    private void seedUsersIfEmpty() {
        if (userRepository.count() == 0) {
            log.info("Seeding initial CMPDI user accounts...");
            String encodedPass = passwordEncoder.encode("password123");

            List<Camp> camps = campRepository.findAll();
            Camp anandwanCamp = camps.stream().filter(c -> "CMPDI-AND-01".equals(c.getCampCode())).findFirst().orElse(null);
            Camp murparCamp = camps.stream().filter(c -> "CMPDI-MRP-02".equals(c.getCampCode())).findFirst().orElse(null);

            User admin = User.builder()
                    .employeeId("EMP001")
                    .name("System Administrator")
                    .designation("Chief Mining Engineer / Admin")
                    .email("admin@cmpdi.co.in")
                    .password(encodedPass)
                    .role("ROLE_ADMIN")
                    .status("ACTIVE")
                    .build();

            User exec1 = User.builder()
                    .employeeId("EMP002")
                    .name("Rajesh Sharma")
                    .designation("Camp Executive - Anandwan")
                    .email("exec.anandwan@cmpdi.co.in")
                    .password(encodedPass)
                    .role("ROLE_CAMP_EXEC")
                    .camp(anandwanCamp)
                    .status("ACTIVE")
                    .build();

            User exec2 = User.builder()
                    .employeeId("EMP003")
                    .name("Amit Patel")
                    .designation("Camp Executive - Murpar")
                    .email("exec.murpar@cmpdi.co.in")
                    .password(encodedPass)
                    .role("ROLE_CAMP_EXEC")
                    .camp(murparCamp)
                    .status("ACTIVE")
                    .build();

            User deptHead = User.builder()
                    .employeeId("EMP004")
                    .name("Dr. Sunita Deshmukh")
                    .designation("General Manager (Exploration)")
                    .email("dept.head@cmpdi.co.in")
                    .password(encodedPass)
                    .role("ROLE_DEPT_EXEC")
                    .status("ACTIVE")
                    .build();

            userRepository.saveAll(List.of(admin, exec1, exec2, deptHead));
            log.info("Successfully seeded 4 default user accounts (Password: password123).");
        } else {
            // Guarantee admin@cmpdi.co.in exists with password123 if missing
            if (!userRepository.existsByEmailAndIsDeletedFalse("admin@cmpdi.co.in")) {
                String encodedPass = passwordEncoder.encode("password123");
                User admin = User.builder()
                        .employeeId("EMP001")
                        .name("System Administrator")
                        .designation("Chief Mining Engineer / Admin")
                        .email("admin@cmpdi.co.in")
                        .password(encodedPass)
                        .role("ROLE_ADMIN")
                        .status("ACTIVE")
                        .build();
                userRepository.save(admin);
                log.info("Restored admin@cmpdi.co.in user account.");
            }
        }
    }

    private void seedMachinesIfEmpty() {
        log.info("Synchronizing drilling machines fleet with active operational machines...");
        List<Camp> camps = campRepository.findAll();
        Camp anandwanCamp = camps.stream().filter(c -> "CMPDI-AND-01".equals(c.getCampCode())).findFirst().orElse(null);
        Camp murparCamp = camps.stream().filter(c -> "CMPDI-MRP-02".equals(c.getCampCode())).findFirst().orElse(null);
        Camp durgapurCamp = camps.stream().filter(c -> "CMPDI-DGP-03".equals(c.getCampCode())).findFirst().orElse(null);

        // Retire obsolete sample machine numbers if they exist
        List<String> obsoleteNumbers = List.of("RIG-AND-101", "RIG-AND-102", "RIG-MRP-201", "RIG-MRP-202", "RIG-DGP-301");
        for (String obs : obsoleteNumbers) {
            machineRepository.findByMachineNumberIgnoreCaseAndIsDeletedFalse(obs).ifPresent(m -> {
                m.setDeleted(true);
                machineRepository.save(m);
                log.info("Retired obsolete sample machine: {}", obs);
            });
        }

        // DM-1000-13 (Anandwan Camp, Yearly: 6450.00)
        Map<String, BigDecimal> dm13Targets = Map.ofEntries(
            Map.entry("Apr", new BigDecimal("444.00")),
            Map.entry("May", new BigDecimal("444.00")),
            Map.entry("Jun", new BigDecimal("445.00")),
            Map.entry("Jul", new BigDecimal("340.00")),
            Map.entry("Aug", new BigDecimal("350.00")),
            Map.entry("Sep", new BigDecimal("360.00")),
            Map.entry("Oct", new BigDecimal("389.00")),
            Map.entry("Nov", new BigDecimal("445.00")),
            Map.entry("Dec", new BigDecimal("567.00")),
            Map.entry("Jan", new BigDecimal("778.00")),
            Map.entry("Feb", new BigDecimal("888.00")),
            Map.entry("Mar", new BigDecimal("1000.00"))
        );
        upsertMachineWithTargets("DM-1000-13", "DM-1000-13", "Diamond Core Rig", anandwanCamp, "ACTIVE", "", new BigDecimal("360.00"), new BigDecimal("6450.00"), dm13Targets);

        // DM-1000-15 (Anandwan Camp, Yearly: 6445.00)
        Map<String, BigDecimal> dm15Targets = Map.ofEntries(
            Map.entry("Apr", new BigDecimal("444.00")),
            Map.entry("May", new BigDecimal("445.00")),
            Map.entry("Jun", new BigDecimal("444.00")),
            Map.entry("Jul", new BigDecimal("340.00")),
            Map.entry("Aug", new BigDecimal("345.00")),
            Map.entry("Sep", new BigDecimal("360.00")),
            Map.entry("Oct", new BigDecimal("389.00")),
            Map.entry("Nov", new BigDecimal("445.00")),
            Map.entry("Dec", new BigDecimal("567.00")),
            Map.entry("Jan", new BigDecimal("778.00")),
            Map.entry("Feb", new BigDecimal("888.00")),
            Map.entry("Mar", new BigDecimal("1000.00"))
        );
        upsertMachineWithTargets("DM-1000-15", "DM-1000-15", "Diamond Core Rig", anandwanCamp, "ACTIVE", "", BigDecimal.ZERO, new BigDecimal("6445.00"), dm15Targets);

        // DM-1000-22 (Anandwan Camp, Yearly: 6445.00)
        Map<String, BigDecimal> dm22Targets = Map.ofEntries(
            Map.entry("Apr", new BigDecimal("445.00")),
            Map.entry("May", new BigDecimal("444.00")),
            Map.entry("Jun", new BigDecimal("445.00")),
            Map.entry("Jul", new BigDecimal("340.00")),
            Map.entry("Aug", new BigDecimal("345.00")),
            Map.entry("Sep", new BigDecimal("360.00")),
            Map.entry("Oct", new BigDecimal("389.00")),
            Map.entry("Nov", new BigDecimal("444.00")),
            Map.entry("Dec", new BigDecimal("566.00")),
            Map.entry("Jan", new BigDecimal("777.00")),
            Map.entry("Feb", new BigDecimal("890.00")),
            Map.entry("Mar", new BigDecimal("1000.00"))
        );
        upsertMachineWithTargets("DM-1000-22", "DM-1000-22", "Diamond Core Rig", anandwanCamp, "ACTIVE", "", BigDecimal.ZERO, new BigDecimal("6445.00"), dm22Targets);

        // KME-1000-06 (Durgapur Camp, Yearly: 6441.00)
        Map<String, BigDecimal> kme06Targets = Map.ofEntries(
            Map.entry("Apr", new BigDecimal("445.00")),
            Map.entry("May", new BigDecimal("445.00")),
            Map.entry("Jun", new BigDecimal("445.00")),
            Map.entry("Jul", new BigDecimal("340.00")),
            Map.entry("Aug", new BigDecimal("340.00")),
            Map.entry("Sep", new BigDecimal("360.00")),
            Map.entry("Oct", new BigDecimal("388.00")),
            Map.entry("Nov", new BigDecimal("444.00")),
            Map.entry("Dec", new BigDecimal("567.00")),
            Map.entry("Jan", new BigDecimal("778.00")),
            Map.entry("Feb", new BigDecimal("889.00")),
            Map.entry("Mar", new BigDecimal("1000.00"))
        );
        upsertMachineWithTargets("KME-1000-06", "KME-1000-06", "Diamond Core Rig", durgapurCamp, "ACTIVE", "", new BigDecimal("250.00"), new BigDecimal("6441.00"), kme06Targets);

        log.info("Successfully synchronized CMPDI drilling machines fleet with active operational machines.");
    }

    private void upsertMachineWithTargets(String machineNum, String name, String type, Camp camp, String status, String operator, BigDecimal monthlyTarget, BigDecimal yearlyTarget, Map<String, BigDecimal> monthwise) {
        if (camp == null) return;
        List<String> months = List.of("Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar");

        in.gov.cmpdi.dams.entity.DrillingMachine machine = machineRepository.findByMachineNumberIgnoreCaseAndIsDeletedFalse(machineNum)
                .orElse(null);

        if (machine == null) {
            machine = in.gov.cmpdi.dams.entity.DrillingMachine.builder()
                    .machineNumber(machineNum)
                    .machineName(name)
                    .machineType(type)
                    .camp(camp)
                    .status(status)
                    .operatorName(operator)
                    .monthlyTarget(monthlyTarget)
                    .yearlyTarget(yearlyTarget)
                    .build();
            machine = machineRepository.save(machine);
        } else {
            machine.setMachineName(name);
            machine.setMachineType(type);
            machine.setCamp(camp);
            machine.setStatus(status);
            machine.setMonthlyTarget(monthlyTarget);
            machine.setYearlyTarget(yearlyTarget);
            machine = machineRepository.save(machine);
        }

        // Save / update monthwise targets
        for (int i = 0; i < months.size(); i++) {
            String mName = months.get(i);
            BigDecimal tgt = monthwise.getOrDefault(mName, monthlyTarget);
            final in.gov.cmpdi.dams.entity.DrillingMachine targetMachine = machine;
            final int mIdx = i + 1;

            in.gov.cmpdi.dams.entity.MachineTarget target = targetRepository
                    .findByMachineIdAndTargetYearAndMonthName(machine.getId(), 2026, mName)
                    .orElseGet(() -> in.gov.cmpdi.dams.entity.MachineTarget.builder()
                            .machine(targetMachine)
                            .targetYear(2026)
                            .monthName(mName)
                            .monthIndex(mIdx)
                            .notes("Annual planned drilling program")
                            .build()
                    );
            target.setTargetMeters(tgt);
            targetRepository.save(target);
        }
    }

    private void seedBitsIfEmpty() {
        if (bitRepository.countByIsDeletedFalse() == 0) {
            log.info("Seeding initial CMPDI drill bits inventory...");
            List<Camp> camps = campRepository.findAll();
            Camp andCamp = camps.stream().filter(c -> "CMPDI-AND-01".equals(c.getCampCode())).findFirst().orElse(null);
            Camp mrpCamp = camps.stream().filter(c -> "CMPDI-MRP-02".equals(c.getCampCode())).findFirst().orElse(null);
            Camp dgpCamp = camps.stream().filter(c -> "CMPDI-DGP-03".equals(c.getCampCode())).findFirst().orElse(null);

            if (andCamp != null) {
                createSeedBit("BIT-NX-98472", "Diamond Core Bit", "NX (75.7mm)", "Boart Longyear", andCamp, "DM-1000-13", "IN_USE", new BigDecimal("412.50"), "Primary core bit for Block A coal exploration");
                createSeedBit("BIT-NX-98473", "Surface Set Diamond", "NX (75.7mm)", "Christensen", andCamp, "DM-1000-15", "IN_USE", new BigDecimal("285.00"), "Operational in Block B");
                createSeedBit("BIT-HQ-55102", "Impregnated Diamond", "HQ (96mm)", "Boart Longyear", andCamp, "DM-1000-22", "AVAILABLE", BigDecimal.ZERO, "New stock reserved for deep overburden coring");
            }
            if (mrpCamp != null) {
                createSeedBit("BIT-BX-44120", "TC Carbide Bit", "BX (60mm)", "Sandvik", mrpCamp, "", "AVAILABLE", new BigDecimal("360.20"), "Used in Murpar central sector");
                createSeedBit("BIT-TRC-7701", "Tricone Roller Bit", "150mm", "Atlas Copco", mrpCamp, "", "MAINTENANCE", new BigDecimal("198.40"), "Sent for gauge retipping");
            }
            if (dgpCamp != null) {
                createSeedBit("BIT-PDC-3011", "PDC Core Bit", "NQ (75.7mm)", "DCI Drilling", dgpCamp, "KME-1000-06", "IN_USE", new BigDecimal("520.80"), "High penetration bit in Raniganj sandstone");
                createSeedBit("BIT-NX-88210", "Diamond Core Bit", "NX (75.7mm)", "Christensen", dgpCamp, "", "WORN_OUT", new BigDecimal("680.50"), "Completed 680m drilling run; retired");
            }
            log.info("Successfully seeded CMPDI drill bits inventory.");
        }
    }

    private void createSeedBit(String bitNo, String type, String size, String mfg, Camp camp, String rig, String status, BigDecimal meters, String remarks) {
        in.gov.cmpdi.dams.entity.DrillBit bit = in.gov.cmpdi.dams.entity.DrillBit.builder()
                .bitNumber(bitNo)
                .bitType(type)
                .size(size)
                .manufacturer(mfg)
                .camp(camp)
                .assignedMachineNumber(rig)
                .status(status)
                .totalMetersDrilled(meters)
                .remarks(remarks)
                .issueDate(java.time.LocalDate.now().minusMonths(1))
                .build();
        bitRepository.save(bit);
    }
}
