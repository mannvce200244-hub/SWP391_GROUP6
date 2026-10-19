package com.m4n.backend.service;

import com.m4n.backend.dto.request.UpdateProfileRequest;
import com.m4n.backend.dto.response.UserResponse;
import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.mapper.UserMapper;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.serviceImpl.ProfileServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private UserRepository userRepository;

    private UserMapper userMapper;
    private ProfileService profileService;

    @BeforeEach
    void setUp() {
        userMapper = new UserMapper();
        profileService = new ProfileServiceImpl(userRepository, userMapper);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user@m4n.vn", "N/A", Collections.emptyList())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldGetCurrentUserProfile() {
        Role role = Role.builder().id(1L).name(RoleName.CUSTOMER).build();
        User user = User.builder()
                .id(1L)
                .email("user@m4n.vn")
                .fullName("Original Name")
                .phone("0987654321")
                .address("Hà Nội")
                .role(role)
                .isActive(true)
                .build();

        when(userRepository.findByEmailIgnoreCase("user@m4n.vn")).thenReturn(Optional.of(user));

        UserResponse response = profileService.getCurrentProfile();

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.email()).isEqualTo("user@m4n.vn");
        assertThat(response.fullName()).isEqualTo("Original Name");
        assertThat(response.phone()).isEqualTo("0987654321");
    }

    @Test
    void shouldUpdateOwnProfileFields() {
        Role role = Role.builder().id(1L).name(RoleName.CUSTOMER).build();
        User user = User.builder()
                .id(1L)
                .email("user@m4n.vn")
                .fullName("Original Name")
                .phone("0987654321")
                .address("Hà Nội")
                .role(role)
                .isActive(true)
                .build();

        when(userRepository.findByEmailIgnoreCase("user@m4n.vn")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProfileRequest request = new UpdateProfileRequest(
                "Updated Name",
                "0911223344",
                "Đà Nẵng, Việt Nam"
        );

        UserResponse updated = profileService.updateCurrentProfile(request);

        assertThat(updated.fullName()).isEqualTo("Updated Name");
        assertThat(updated.phone()).isEqualTo("0911223344");
        assertThat(updated.address()).isEqualTo("Đà Nẵng, Việt Nam");
        assertThat(updated.email()).isEqualTo("user@m4n.vn"); // untouched

        verify(userRepository).save(user);
    }
}
