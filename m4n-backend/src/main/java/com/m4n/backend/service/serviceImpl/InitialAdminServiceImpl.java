package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.InitialAdminService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class InitialAdminServiceImpl implements InitialAdminService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public InitialAdminServiceImpl(UserRepository userRepository, RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void initialize(String email, String fullName, String password) {
        var role = roleRepository.findByNameWithLock(RoleName.SUPER_ADMIN)
                .orElseThrow(() -> new IllegalStateException("SUPER_ADMIN role must exist before bootstrap."));
        // Serialize empty-database bootstrap across instances; never modify an existing privileged account.
        if (userRepository.existsByRoleName(RoleName.SUPER_ADMIN)) return;
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        String normalizedName = fullName == null ? "" : fullName.trim();
        if (!normalizedEmail.matches("[^\\s<>@]+@[^\\s<>@]+\\.[^\\s<>@]+") || normalizedEmail.length() > 255
                || normalizedName.isBlank() || normalizedName.length() > 150 || password == null
                || password.isBlank() || password.length() < 8 || password.length() > 72
                || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalStateException("Initial administrator requires valid external email, name and an 8–72 character password within 72 UTF-8 bytes.");
        }
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalStateException("Initial administrator email belongs to an existing account; bootstrap cannot elevate or overwrite it.");
        }
        userRepository.saveAndFlush(User.builder().email(normalizedEmail).fullName(normalizedName)
                .password(passwordEncoder.encode(password)).role(role).isActive(true).build());
    }
}
