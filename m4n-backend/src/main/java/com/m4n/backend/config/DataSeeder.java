package com.m4n.backend.config;

import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seed data runner for development and testing environments.
 * Idempotently initializes default roles and diverse test accounts.
 */
@Slf4j
@Component
public class DataSeeder implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${m4n.seed.dev-accounts:true}")
    private boolean seedDevAccounts;

    @Value("${M4N_DEFAULT_TEST_PASSWORD:Password123!}")
    private String defaultPassword;

    public DataSeeder(
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initRoles();
        if (seedDevAccounts) {
            initDevAccounts();
            printTestAccountsSummary();
        }
    }

    private void initRoles() {
        for (RoleName roleName : RoleName.values()) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                String description = switch (roleName) {
                    case ADMIN -> "Quản trị viên hệ thống M4N";
                    case ONLINE_STAFF -> "Nhân viên xử lý đơn hàng trực tuyến";
                    case POS_STAFF -> "Nhân viên bán hàng tại showroom POS";
                    case CUSTOMER -> "Khách hàng mua sắm nhạc cụ truyền thống";
                };

                Role role = Role.builder()
                        .name(roleName)
                        .description(description)
                        .build();
                roleRepository.save(role);
                log.info("Initialized system role: {}", roleName);
            }
        }
    }

    private void initDevAccounts() {
        // 1. Quản trị viên (ADMIN)
        seedAccountIfNotExists(
                "admin@m4n.vn",
                defaultPassword,
                "Quản Trị Viên Hệ Thống",
                "0900000001",
                "12 Phố Tràng Tiền, Hoàn Kiếm, Hà Nội",
                RoleName.ADMIN,
                true
        );

        // 2. Nhân viên bán hàng Online chính (ONLINE_STAFF)
        seedAccountIfNotExists(
                "staff@m4n.vn",
                defaultPassword,
                "Nhân Viên Bán Hàng Online",
                "0900000002",
                "88 Đường Bạch Đằng, Hải Châu, Đà Nẵng",
                RoleName.ONLINE_STAFF,
                true
        );

        // 3. Nhân viên bán hàng Online phụ (ONLINE_STAFF)
        seedAccountIfNotExists(
                "staff2@m4n.vn",
                defaultPassword,
                "Lê Thu Hà (Online Staff)",
                "0900000022",
                "45 Đường Nguyễn Văn Linh, Đà Nẵng",
                RoleName.ONLINE_STAFF,
                true
        );

        // 4. Nhân viên Showroom POS chính (POS_STAFF)
        seedAccountIfNotExists(
                "pos@m4n.vn",
                defaultPassword,
                "Nhân Viên Showroom POS",
                "0900000003",
                "150 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh",
                RoleName.POS_STAFF,
                true
        );

        // 5. Nhân viên Showroom POS phụ (POS_STAFF)
        seedAccountIfNotExists(
                "pos2@m4n.vn",
                defaultPassword,
                "Trần Quốc Bảo (POS Staff)",
                "0900000033",
                "22 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
                RoleName.POS_STAFF,
                true
        );

        // 6. Khách hàng mẫu 1 (CUSTOMER - đầy đủ thông tin)
        seedAccountIfNotExists(
                "customer@m4n.vn",
                defaultPassword,
                "Nguyễn Văn Khách",
                "0900000004",
                "68 Đường Lê Lợi, TP. Huế, Thừa Thiên Huế",
                RoleName.CUSTOMER,
                true
        );

        // 7. Khách hàng mẫu 2 (CUSTOMER - Hà Nội)
        seedAccountIfNotExists(
                "customer2@m4n.vn",
                defaultPassword,
                "Trần Thị Mai Phương",
                "0987654321",
                "45 Phố Hàng Gai, Hoàn Kiếm, Hà Nội",
                RoleName.CUSTOMER,
                true
        );

        // 8. Tài khoản bị khóa (CUSTOMER - isActive = false để test kiểm tra 403 Forbidden)
        seedAccountIfNotExists(
                "locked@m4n.vn",
                defaultPassword,
                "Tài Khoản Bị Khóa (Testing 403)",
                "0911223344",
                "10 Đường Lạch Tray, Ngô Quyền, Hải Phòng",
                RoleName.CUSTOMER,
                false
        );
    }

    private void seedAccountIfNotExists(
            String email,
            String password,
            String fullName,
            String phone,
            String address,
            RoleName roleName,
            boolean isActive
    ) {
        String normalizedEmail = email.trim().toLowerCase();
        if (!userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalStateException("Role not found: " + roleName));

            User user = User.builder()
                    .email(normalizedEmail)
                    .password(passwordEncoder.encode(password))
                    .fullName(fullName)
                    .phone(phone)
                    .address(address)
                    .isActive(isActive)
                    .role(role)
                    .build();

            userRepository.save(user);
            log.info("Seeded test account: {} [Role: {}, Active: {}]", normalizedEmail, roleName, isActive);
        }
    }

    private void printTestAccountsSummary() {
        String summary = """
                \n========================================================================================
                [M4N DEV & TEST SEED DATA INITIALIZED]
                Default Password: %s
                ----------------------------------------------------------------------------------------
                Role           | Email              | Status   | Full Name
                ----------------------------------------------------------------------------------------
                ADMIN          | admin@m4n.vn       | ACTIVE   | Quản Trị Viên Hệ Thống
                ONLINE_STAFF   | staff@m4n.vn       | ACTIVE   | Nhân Viên Bán Hàng Online
                ONLINE_STAFF   | staff2@m4n.vn      | ACTIVE   | Lê Thu Hà (Online Staff)
                POS_STAFF      | pos@m4n.vn         | ACTIVE   | Nhân Viên Showroom POS
                POS_STAFF      | pos2@m4n.vn        | ACTIVE   | Trần Quốc Bảo (POS Staff)
                CUSTOMER       | customer@m4n.vn    | ACTIVE   | Nguyễn Văn Khách
                CUSTOMER       | customer2@m4n.vn   | ACTIVE   | Trần Thị Mai Phương
                CUSTOMER       | locked@m4n.vn      | LOCKED   | Tài Khoản Bị Khóa (Testing 403)
                ========================================================================================
                """.formatted(defaultPassword);
        log.info("{}", summary);
    }
}
