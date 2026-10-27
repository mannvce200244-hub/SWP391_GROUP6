package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.request.ChangeUserRoleRequest;
import com.m4n.backend.dto.request.CreateStaffRequest;
import com.m4n.backend.dto.request.UpdateUserRequest;
import com.m4n.backend.dto.response.UserDetailResponse;
import com.m4n.backend.dto.response.UserSummaryResponse;
import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.DuplicateResourceException;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.exception.StaleVersionException;
import com.m4n.backend.mapper.UserMapper;
import com.m4n.backend.repository.ConversationRepository;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.AdminUserService;
import com.m4n.backend.service.RefreshTokenService;
import com.m4n.backend.specification.UserSpecification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Slf4j
@Service
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final RefreshTokenService refreshTokenService;
    private final ConversationRepository conversationRepository;

    public AdminUserServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            UserMapper userMapper,
            RefreshTokenService refreshTokenService,
            ConversationRepository conversationRepository
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
        this.refreshTokenService = refreshTokenService;
        this.conversationRepository = conversationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserSummaryResponse> listUsers(String keyword, RoleName role, Boolean isActive, Pageable pageable) {
        var allowed = java.util.Set.of("id", "fullName", "email", "isActive", "createdAt");
        if (pageable.getSort().stream().anyMatch(order -> !allowed.contains(order.getProperty()))) {
            throw new IllegalArgumentException("Trường sắp xếp tài khoản không hợp lệ.");
        }
        Specification<User> spec = UserSpecification.withFilters(keyword, role, isActive);
        return userRepository.findAll(spec, pageable).map(userMapper::toSummaryResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetailResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return userMapper.toDetailResponse(user);
    }

    @Override
    @Transactional
    public UserDetailResponse createStaff(CreateStaffRequest request, String currentOperatorEmail) {
        User operator = getOperator(currentOperatorEmail);
        if (request.initialPassword().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("Mật khẩu tối đa 72 byte UTF-8; ký tự có dấu có thể chiếm nhiều byte.");
        }
        RoleName operatorRole = operator.getRole().getName();

        RoleName targetRole = request.role();
        if (targetRole == RoleName.CUSTOMER) {
            throw new IllegalArgumentException("API quản lý nhân sự không được sử dụng để tạo tài khoản Khách hàng.");
        }

        // Authority evaluation: Regular ADMIN can only create ONLINE_STAFF and POS_STAFF
        if (operatorRole != RoleName.SUPER_ADMIN) {
            if (targetRole == RoleName.ADMIN || targetRole == RoleName.SUPER_ADMIN) {
                throw new AccessDeniedException("Chỉ Super Admin mới có quyền tạo tài khoản Quản trị viên (ADMIN) hoặc Super Admin.");
            }
        }

        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException("Email này đã được sử dụng trong hệ thống: " + normalizedEmail);
        }

        Role roleEntity = roleRepository.findByName(targetRole)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + targetRole));

        User user = User.builder()
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.initialPassword()))
                .fullName(request.fullName().trim())
                .phone(request.phone() != null ? request.phone().trim() : null)
                .address(request.address() != null ? request.address().trim() : null)
                .isActive(true)
                .role(roleEntity)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Operator {} created staff account {} with role {}", currentOperatorEmail, normalizedEmail, targetRole);
        return userMapper.toDetailResponse(savedUser);
    }

    @Override
    @Transactional
    public UserDetailResponse updateUser(Long id, UpdateUserRequest request, String currentOperatorEmail) {
        User operator = getOperator(currentOperatorEmail);
        RoleName operatorRole = operator.getRole().getName();

        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Optimistic locking check
        if (!Objects.equals(targetUser.getVersion(), request.expectedVersion())) {
            throw new StaleVersionException("Thông tin người dùng đã được thay đổi bởi quản trị viên khác. Dữ liệu mới nhất đã được tải lại. Vui lòng kiểm tra trước khi lưu lại.");
        }

        // Regular ADMIN cannot modify peer ADMIN or SUPER_ADMIN accounts.
        if (operatorRole != RoleName.SUPER_ADMIN
                && (targetUser.getRole().getName() == RoleName.ADMIN
                || targetUser.getRole().getName() == RoleName.SUPER_ADMIN)) {
            throw new AccessDeniedException("Chỉ Super Admin mới có quyền chỉnh sửa tài khoản quản trị viên.");
        }

        targetUser.setFullName(request.fullName().trim());
        targetUser.setPhone(request.phone() != null ? request.phone().trim() : null);
        targetUser.setAddress(request.address() != null ? request.address().trim() : null);

        User updatedUser = userRepository.save(targetUser);
        userRepository.flush();
        log.info("Operator {} updated user id {} contact info", currentOperatorEmail, id);
        return userMapper.toDetailResponse(updatedUser);
    }

    @Override
    @Transactional
    public UserDetailResponse changeRole(Long id, ChangeUserRoleRequest request, String currentOperatorEmail) {
        // Privileged transitions share one deterministic lock order before locking their target.
        List<User> activeSuperAdmins = userRepository.findActiveByRoleNameWithLock(RoleName.SUPER_ADMIN);
        User targetUser = userRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        User operator = getOperator(currentOperatorEmail);
        RoleName operatorRole = operator.getRole().getName();

        // Optimistic locking check
        if (!Objects.equals(targetUser.getVersion(), request.expectedVersion())) {
            throw new StaleVersionException("Thông tin người dùng đã được thay đổi bởi quản trị viên khác. Vui lòng tải lại trước khi thay đổi vai trò.");
        }

        RoleName currentRole = targetUser.getRole().getName();
        RoleName requestedRole = request.newRole();

        if (currentRole == requestedRole) {
            return userMapper.toDetailResponse(targetUser);
        }

        // Strict Actor-Target Matrix
        if (operatorRole != RoleName.SUPER_ADMIN) {
            // Regular ADMIN cannot modify ADMIN or SUPER_ADMIN
            if (currentRole == RoleName.ADMIN || currentRole == RoleName.SUPER_ADMIN) {
                throw new AccessDeniedException("Quản trị viên thường không có quyền thay đổi vai trò của Quản trị viên hoặc Super Admin.");
            }
            // Regular ADMIN cannot promote anyone to ADMIN or SUPER_ADMIN
            if (requestedRole == RoleName.ADMIN || requestedRole == RoleName.SUPER_ADMIN) {
                throw new AccessDeniedException("Quản trị viên thường không có quyền thăng cấp tài khoản lên Quản trị viên hoặc Super Admin.");
            }
        }

        // Last active SUPER_ADMIN protection invariant.
        // Lock all active SUPER_ADMIN rows first so two concurrent privileged transitions
        // serialize here and can never race the active count down to zero (BR-AUTH-06).
        if (targetUser.isActive() && currentRole == RoleName.SUPER_ADMIN && requestedRole != RoleName.SUPER_ADMIN) {
            if (activeSuperAdmins.size() <= 1) {
                throw new IllegalStateException("Hệ thống phải luôn duy trì ít nhất 1 tài khoản Super Admin hoạt động. Không thể giáng cấp Super Admin duy nhất.");
            }
        }

        Role newRoleEntity = roleRepository.findByName(requestedRole)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + requestedRole));

        if (currentRole == RoleName.ONLINE_STAFF) {
            releaseOpenConversations(targetUser.getId());
        }
        targetUser.setRole(newRoleEntity);
        User updatedUser = userRepository.save(targetUser);
        // Security requirement: Role changes must immediately revoke target user's active sessions
        refreshTokenService.revokeAllUserSessions(targetUser.getId());
        userRepository.flush();
        log.info("Operator {} changed role of user id {} from {} to {}. All active sessions revoked.",
                currentOperatorEmail, id, currentRole, requestedRole);

        return userMapper.toDetailResponse(updatedUser);
    }

    @Override
    @Transactional
    public UserDetailResponse disableUser(Long id, Long expectedVersion, String currentOperatorEmail) {
        List<User> activeSuperAdmins = userRepository.findActiveByRoleNameWithLock(RoleName.SUPER_ADMIN);
        User targetUser = userRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        User operator = getOperator(currentOperatorEmail);
        RoleName operatorRole = operator.getRole().getName();

        // Optimistic locking check
        if (expectedVersion == null) {
            throw new IllegalArgumentException("Phiên bản dữ liệu (version) không được để trống.");
        }
        if (!Objects.equals(targetUser.getVersion(), expectedVersion)) {
            throw new StaleVersionException("Dữ liệu người dùng đã được thay đổi bởi quản trị viên khác. Vui lòng tải lại trước khi vô hiệu hóa.");
        }

        // Self-disable protection
        if (targetUser.getId().equals(operator.getId())) {
            throw new IllegalArgumentException("Không thể tự vô hiệu hóa tài khoản đang đăng nhập.");
        }

        // Regular ADMIN cannot disable ADMIN or SUPER_ADMIN
        if (operatorRole != RoleName.SUPER_ADMIN) {
            if (targetUser.getRole().getName() == RoleName.ADMIN || targetUser.getRole().getName() == RoleName.SUPER_ADMIN) {
                throw new AccessDeniedException("Quản trị viên thường không có quyền vô hiệu hóa tài khoản Quản trị viên hoặc Super Admin.");
            }
        }

        // Last active SUPER_ADMIN protection invariant (same locked check as changeRole, BR-AUTH-06)
        if (targetUser.isActive() && targetUser.getRole().getName() == RoleName.SUPER_ADMIN) {
            if (activeSuperAdmins.size() <= 1) {
                throw new IllegalStateException("Không thể vô hiệu hóa Super Admin duy nhất của hệ thống.");
            }
        }

        if (targetUser.getRole().getName() == RoleName.ONLINE_STAFF) {
            releaseOpenConversations(targetUser.getId());
        }
        targetUser.setActive(false);
        User updatedUser = userRepository.save(targetUser);
        // Security requirement: Disabling an account immediately revokes all active sessions
        refreshTokenService.revokeAllUserSessions(targetUser.getId());
        userRepository.flush();
        log.info("Operator {} disabled user id {}. All active sessions revoked.", currentOperatorEmail, id);

        return userMapper.toDetailResponse(updatedUser);
    }

    @Override
    @Transactional
    public UserDetailResponse reactivateUser(Long id, Long expectedVersion, String currentOperatorEmail) {
        userRepository.findActiveByRoleNameWithLock(RoleName.SUPER_ADMIN);
        User targetUser = userRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        User operator = getOperator(currentOperatorEmail);
        RoleName operatorRole = operator.getRole().getName();

        // Optimistic locking check
        if (expectedVersion == null) {
            throw new IllegalArgumentException("Phiên bản dữ liệu (version) không được để trống.");
        }
        if (!Objects.equals(targetUser.getVersion(), expectedVersion)) {
            throw new StaleVersionException("Dữ liệu người dùng đã được thay đổi bởi quản trị viên khác. Vui lòng tải lại trước khi kích hoạt lại.");
        }

        // Regular ADMIN cannot reactivate ADMIN or SUPER_ADMIN
        if (operatorRole != RoleName.SUPER_ADMIN) {
            if (targetUser.getRole().getName() == RoleName.ADMIN || targetUser.getRole().getName() == RoleName.SUPER_ADMIN) {
                throw new AccessDeniedException("Quản trị viên thường không có quyền kích hoạt tài khoản Quản trị viên hoặc Super Admin.");
            }
        }

        targetUser.setActive(true);
        User updatedUser = userRepository.save(targetUser);
        userRepository.flush();
        log.info("Operator {} reactivated user id {}", currentOperatorEmail, id);
        return userMapper.toDetailResponse(updatedUser);
    }

    private void releaseOpenConversations(Long staffId) {
        Instant releasedAt = Instant.now();
        conversationRepository.findOpenAssignedToStaffWithLock(staffId).forEach(conversation -> {
            conversation.setAssignedStaff(null);
            conversation.setUpdatedAt(releasedAt);
        });
    }

    private User getOperator(String email) {
        String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
        User operator = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Operator user not found: " + normalizedEmail));
        if (!operator.isActive() || (operator.getRole().getName() != RoleName.ADMIN
                && operator.getRole().getName() != RoleName.SUPER_ADMIN)) {
            throw new AccessDeniedException("Chỉ quản trị viên đang hoạt động được quản lý tài khoản.");
        }
        return operator;
    }
}
