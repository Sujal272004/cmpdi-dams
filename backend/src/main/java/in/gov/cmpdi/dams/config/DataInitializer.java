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
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedCampsIfEmpty();
        seedUsersIfEmpty();
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
}
