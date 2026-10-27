package com.m4n.backend.service;

import com.m4n.backend.dto.request.ChangeUserRoleRequest;
import com.m4n.backend.dto.request.CreateStaffRequest;
import com.m4n.backend.dto.request.UpdateUserRequest;
import com.m4n.backend.dto.response.UserDetailResponse;
import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.StaleVersionException;
import com.m4n.backend.mapper.UserMapper;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.ConversationRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.serviceImpl.AdminUserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private ConversationRepository conversationRepository;

    private AdminUserService adminUserService;
    private final UserMapper userMapper = new UserMapper();

    private User adminOperator;
    private User superAdminOperator;
    private User staffUser;
    private User superAdminUser;

    private Role adminRole;
    private Role superAdminRole;
    private Role onlineStaffRole;
    private Role posStaffRole;

    @BeforeEach
    void setUp() {
        adminUserService = new AdminUserServiceImpl(
                userRepository,
                roleRepository,
                passwordEncoder,
                userMapper,
                refreshTokenService,
                conversationRepository
        );

        adminRole = Role.builder().id(1L).name(RoleName.ADMIN).build();
        superAdminRole = Role.builder().id(2L).name(RoleName.SUPER_ADMIN).build();
        onlineStaffRole = Role.builder().id(3L).name(RoleName.ONLINE_STAFF).build();
        posStaffRole = Role.builder().id(4L).name(RoleName.POS_STAFF).build();

        adminOperator = User.builder()
                .id(10L)
                .email("admin@m4n.vn")
                .fullName("Regular Admin")
                .role(adminRole)
                .isActive(true)
                .version(1L)
                .build();

        superAdminOperator = User.builder()
                .id(20L)
                .email("superadmin@m4n.vn")
                .fullName("Super Administrator")
                .role(superAdminRole)
                .isActive(true)
                .version(1L)
                .build();

        staffUser = User.builder()
                .id(30L)
                .email("staff@m4n.vn")
                .fullName("Online Staff")
                .role(onlineStaffRole)
                .isActive(true)
                .version(1L)
                .build();

        superAdminUser = User.builder()
                .id(40L)
                .email("super2@m4n.vn")
                .fullName("Super Admin 2")
                .role(superAdminRole)
                .isActive(true)
                .version(1L)
                .build();
    }

    @Test
    @DisplayName("Admin creates ONLINE_STAFF successfully")
    void createStaff_asAdmin_onlineStaff_success() {
        when(userRepository.findByEmailIgnoreCase("admin@m4n.vn")).thenReturn(Optional.of(adminOperator));
        when(userRepository.existsByEmailIgnoreCase("newstaff@m4n.vn")).thenReturn(false);
        when(roleRepository.findByName(RoleName.ONLINE_STAFF)).thenReturn(Optional.of(onlineStaffRole));
        when(passwordEncoder.encode("Password123!")).thenReturn("hashed_pass");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(99L);
            u.setVersion(0L);
            return u;
        });

        CreateStaffRequest request = new CreateStaffRequest(
                "New Staff Member",
                "newstaff@m4n.vn",
                RoleName.ONLINE_STAFF,
                "0901234567",
                "Hanoi",
                "Password123!"
        );

        UserDetailResponse response = adminUserService.createStaff(request, "admin@m4n.vn");

        assertThat(response).isNotNull();
        assertThat(response.email()).isEqualTo("newstaff@m4n.vn");
        assertThat(response.role()).isEqualTo(RoleName.ONLINE_STAFF);
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Regular Admin cannot create ADMIN - throws AccessDeniedException")
    void createStaff_asAdmin_creatingAdmin_throwsAccessDenied() {
        when(userRepository.findByEmailIgnoreCase("admin@m4n.vn")).thenReturn(Optional.of(adminOperator));

        CreateStaffRequest request = new CreateStaffRequest(
                "Another Admin",
                "admin2@m4n.vn",
                RoleName.ADMIN,
                "0901234567",
                "Hanoi",
                "Password123!"
        );

        assertThatThrownBy(() -> adminUserService.createStaff(request, "admin@m4n.vn"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Chỉ Super Admin mới có quyền tạo tài khoản Quản trị viên");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Regular Admin cannot create SUPER_ADMIN - throws AccessDeniedException")
    void createStaff_asAdmin_creatingSuperAdmin_throwsAccessDenied() {
        when(userRepository.findByEmailIgnoreCase("admin@m4n.vn")).thenReturn(Optional.of(adminOperator));

        CreateStaffRequest request = new CreateStaffRequest(
                "Attempted Super Admin",
                "super3@m4n.vn",
                RoleName.SUPER_ADMIN,
                "0901234567",
                "Hanoi",
                "Password123!"
        );

        assertThatThrownBy(() -> adminUserService.createStaff(request, "admin@m4n.vn"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Super Admin can create ADMIN successfully")
    void createStaff_asSuperAdmin_creatingAdmin_success() {
        when(userRepository.findByEmailIgnoreCase("superadmin@m4n.vn")).thenReturn(Optional.of(superAdminOperator));
        when(userRepository.existsByEmailIgnoreCase("newadmin@m4n.vn")).thenReturn(false);
        when(roleRepository.findByName(RoleName.ADMIN)).thenReturn(Optional.of(adminRole));
        when(passwordEncoder.encode("Password123!")).thenReturn("hashed_pass");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(101L);
            u.setVersion(0L);
            return u;
        });

        CreateStaffRequest request = new CreateStaffRequest(
                "Promoted Admin",
                "newadmin@m4n.vn",
                RoleName.ADMIN,
                "0901234567",
                "Hanoi",
                "Password123!"
        );

        UserDetailResponse response = adminUserService.createStaff(request, "superadmin@m4n.vn");

        assertThat(response).isNotNull();
        assertThat(response.role()).isEqualTo(RoleName.ADMIN);
    }

    @Test
    @DisplayName("Updating user with stale version throws StaleVersionException (Lost update protection)")
    void updateUser_staleVersion_throwsStaleVersionException() {
        when(userRepository.findByEmailIgnoreCase("superadmin@m4n.vn")).thenReturn(Optional.of(superAdminOperator));
        when(userRepository.findById(30L)).thenReturn(Optional.of(staffUser)); // staffUser version is 1L

        UpdateUserRequest staleRequest = new UpdateUserRequest(
                "Staff Updated Name",
                "0909999999",
                "Da Nang",
                0L // Stale version! (expected 1L)
        );

        assertThatThrownBy(() -> adminUserService.updateUser(30L, staleRequest, "superadmin@m4n.vn"))
                .isInstanceOf(StaleVersionException.class)
                .hasMessageContaining("Thông tin người dùng đã được thay đổi bởi quản trị viên khác");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Regular Admin cannot edit another ADMIN's contact data")
    void updateUser_asAdmin_targetAdmin_throwsAccessDenied() {
        User targetAdmin = User.builder()
                .id(99L)
                .email("peer-admin@m4n.vn")
                .role(adminRole)
                .version(1L)
                .build();
        when(userRepository.findByEmailIgnoreCase("admin@m4n.vn"))
                .thenReturn(Optional.of(adminOperator));
        when(userRepository.findById(99L)).thenReturn(Optional.of(targetAdmin));

        UpdateUserRequest request = new UpdateUserRequest(
                "Peer Admin Updated", "0909999999", "Da Nang", 1L);

        assertThatThrownBy(() -> adminUserService.updateUser(99L, request, "admin@m4n.vn"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Chỉ Super Admin");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Regular Admin cannot change role of ADMIN - throws AccessDeniedException")
    void changeRole_asAdmin_targetAdmin_throwsAccessDenied() {
        when(userRepository.findByEmailIgnoreCase("admin@m4n.vn")).thenReturn(Optional.of(adminOperator));
        User targetAdmin = User.builder().id(99L).role(adminRole).version(1L).build();
        when(userRepository.findByIdWithLock(99L)).thenReturn(Optional.of(targetAdmin));

        ChangeUserRoleRequest request = new ChangeUserRoleRequest(RoleName.POS_STAFF, 1L);

        assertThatThrownBy(() -> adminUserService.changeRole(99L, request, "admin@m4n.vn"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Quản trị viên thường không có quyền");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Last active Super Admin cannot be demoted - invariant enforcement")
    void changeRole_lastSuperAdmin_throwsIllegalStateException() {
        when(userRepository.findByEmailIgnoreCase("superadmin@m4n.vn")).thenReturn(Optional.of(superAdminOperator));
        when(userRepository.findByIdWithLock(20L)).thenReturn(Optional.of(superAdminOperator));
        when(userRepository.findActiveByRoleNameWithLock(RoleName.SUPER_ADMIN)).thenReturn(java.util.List.of(superAdminOperator)); // ONLY ONE active!

        ChangeUserRoleRequest demoteRequest = new ChangeUserRoleRequest(RoleName.ADMIN, 1L);

        assertThatThrownBy(() -> adminUserService.changeRole(20L, demoteRequest, "superadmin@m4n.vn"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Không thể giáng cấp Super Admin duy nhất");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Successful role change revokes target user's active sessions")
    void changeRole_success_revokesSessions() {
        when(userRepository.findByEmailIgnoreCase("superadmin@m4n.vn")).thenReturn(Optional.of(superAdminOperator));
        when(userRepository.findByIdWithLock(30L)).thenReturn(Optional.of(staffUser));
        when(roleRepository.findByName(RoleName.POS_STAFF)).thenReturn(Optional.of(posStaffRole));
        when(userRepository.save(any(User.class))).thenReturn(staffUser);

        ChangeUserRoleRequest request = new ChangeUserRoleRequest(RoleName.POS_STAFF, 1L);

        UserDetailResponse response = adminUserService.changeRole(30L, request, "superadmin@m4n.vn");

        assertThat(response).isNotNull();
        verify(refreshTokenService).revokeAllUserSessions(30L);
    }

    @Test
    @DisplayName("Operator cannot self-disable account")
    void disableUser_selfDisable_throwsIllegalArgumentException() {
        when(userRepository.findByEmailIgnoreCase("superadmin@m4n.vn")).thenReturn(Optional.of(superAdminOperator));
        when(userRepository.findByIdWithLock(20L)).thenReturn(Optional.of(superAdminOperator));

        assertThatThrownBy(() -> adminUserService.disableUser(20L, 1L, "superadmin@m4n.vn"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Không thể tự vô hiệu hóa tài khoản đang đăng nhập");
    }

    @Test
    @DisplayName("Last active Super Admin cannot be disabled")
    void disableUser_lastSuperAdmin_throwsIllegalStateException() {
        when(userRepository.findByEmailIgnoreCase("superadmin@m4n.vn")).thenReturn(Optional.of(superAdminOperator));
        when(userRepository.findByIdWithLock(40L)).thenReturn(Optional.of(superAdminUser));
        when(userRepository.findActiveByRoleNameWithLock(RoleName.SUPER_ADMIN)).thenReturn(java.util.List.of(superAdminUser));

        assertThatThrownBy(() -> adminUserService.disableUser(40L, 1L, "superadmin@m4n.vn"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Không thể vô hiệu hóa Super Admin duy nhất");
    }

    @Test
    @DisplayName("Disabling account revokes active sessions")
    void disableUser_success_revokesSessions() {
        when(userRepository.findByEmailIgnoreCase("superadmin@m4n.vn")).thenReturn(Optional.of(superAdminOperator));
        when(userRepository.findByIdWithLock(30L)).thenReturn(Optional.of(staffUser));
        when(userRepository.save(any(User.class))).thenReturn(staffUser);

        UserDetailResponse response = adminUserService.disableUser(30L, 1L, "superadmin@m4n.vn");

        assertThat(response).isNotNull();
        assertThat(staffUser.isActive()).isFalse();
        verify(refreshTokenService).revokeAllUserSessions(30L);
    }
}
