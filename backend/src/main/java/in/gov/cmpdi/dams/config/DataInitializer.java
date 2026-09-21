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
        if (machineRepository.countByIsDeletedFalse() == 0) {
            log.info("Seeding initial drilling machines fleet and monthwise targets...");
            List<Camp> camps = campRepository.findAll();
            Camp anandwanCamp = camps.stream().filter(c -> "CMPDI-AND-01".equals(c.getCampCode())).findFirst().orElse(null);
            Camp murparCamp = camps.stream().filter(c -> "CMPDI-MRP-02".equals(c.getCampCode())).findFirst().orElse(null);
            Camp durgapurCamp = camps.stream().filter(c -> "CMPDI-DGP-03".equals(c.getCampCode())).findFirst().orElse(null);

            List<String> months = List.of("Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar");

            if (anandwanCamp != null) {
                createSeedMachine("RIG-AND-101", "Atlas Copco Explorac 235", "Diamond Core Drill Rig", anandwanCamp, "ACTIVE", "R. K. Yadav", new BigDecimal("260.00"), months);
                createSeedMachine("RIG-AND-102", "Longyear 44 Rig", "Hydrostatic Core Rig", anandwanCamp, "ACTIVE", "S. K. Mondal", new BigDecimal("220.00"), months);
            }
            if (murparCamp != null) {
                createSeedMachine("RIG-MRP-201", "Voltas 90 Core Drill", "Heavy Duty Core Drill", murparCamp, "ACTIVE", "G. C. Tiwari", new BigDecimal("240.00"), months);
                createSeedMachine("RIG-MRP-202", "Kirloskar Rotary Rig", "Rotary Drilling Rig", murparCamp, "STANDBY", "M. P. Rao", new BigDecimal("180.00"), months);
            }
            if (durgapurCamp != null) {
                createSeedMachine("RIG-DGP-301", "Sandvik DE710", "Diamond Core Rig", durgapurCamp, "ACTIVE", "B. N. Ghosh", new BigDecimal("320.00"), months);
            }
            log.info("Successfully seeded CMPDI drilling machines fleet with monthwise targets.");
        }
    }

    private void createSeedMachine(String machineNum, String name, String type, Camp camp, String status, String operator, BigDecimal monthlyTarget, List<String> months) {
        BigDecimal yearlyTarget = monthlyTarget.multiply(BigDecimal.valueOf(12));
        in.gov.cmpdi.dams.entity.DrillingMachine machine = in.gov.cmpdi.dams.entity.DrillingMachine.builder()
                .machineNumber(machineNum)
                .machineName(name)
                .machineType(type)
                .camp(camp)
                .status(status)
                .operatorName(operator)
                .monthlyTarget(monthlyTarget)
                .yearlyTarget(yearlyTarget)
                .build();
        in.gov.cmpdi.dams.entity.DrillingMachine saved = machineRepository.save(machine);

        for (int i = 0; i < months.size(); i++) {
            in.gov.cmpdi.dams.entity.MachineTarget target = in.gov.cmpdi.dams.entity.MachineTarget.builder()
                    .machine(saved)
                    .targetYear(2026)
                    .monthName(months.get(i))
                    .monthIndex(i + 1)
                    .targetMeters(monthlyTarget)
                    .notes("Annual planned drilling program")
                    .build();
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
                createSeedBit("BIT-NX-98472", "Diamond Core Bit", "NX (75.7mm)", "Boart Longyear", andCamp, "RIG-AND-101", "IN_USE", new BigDecimal("412.50"), "Primary core bit for Block A coal exploration");
                createSeedBit("BIT-NX-98473", "Surface Set Diamond", "NX (75.7mm)", "Christensen", andCamp, "RIG-AND-102", "IN_USE", new BigDecimal("285.00"), "Operational in Block B");
                createSeedBit("BIT-HQ-55102", "Impregnated Diamond", "HQ (96mm)", "Boart Longyear", andCamp, "", "AVAILABLE", BigDecimal.ZERO, "New stock reserved for deep overburden coring");
            }
            if (mrpCamp != null) {
                createSeedBit("BIT-BX-44120", "TC Carbide Bit", "BX (60mm)", "Sandvik", mrpCamp, "RIG-MRP-201", "IN_USE", new BigDecimal("360.20"), "Used in Murpar central sector");
                createSeedBit("BIT-TRC-7701", "Tricone Roller Bit", "150mm", "Atlas Copco", mrpCamp, "RIG-MRP-202", "MAINTENANCE", new BigDecimal("198.40"), "Sent for gauge retipping");
            }
            if (dgpCamp != null) {
                createSeedBit("BIT-PDC-3011", "PDC Core Bit", "NQ (75.7mm)", "DCI Drilling", dgpCamp, "RIG-DGP-301", "IN_USE", new BigDecimal("520.80"), "High penetration bit in Raniganj sandstone");
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
