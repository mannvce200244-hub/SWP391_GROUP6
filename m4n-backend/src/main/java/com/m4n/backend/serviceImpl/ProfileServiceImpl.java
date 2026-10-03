package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.request.UpdateProfileRequest;
import com.m4n.backend.dto.response.UserResponse;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.mapper.UserMapper;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.ProfileService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public ProfileServiceImpl(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentProfile() {
        User user = getAuthenticatedUser();
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateCurrentProfile(UpdateProfileRequest request) {
        User user = getAuthenticatedUser();

        user.setFullName(request.fullName().trim());
        user.setPhone(request.phone() != null ? request.phone().trim() : null);
        user.setAddress(request.address() != null ? request.address().trim() : null);

        User updatedUser = userRepository.save(user);
        return userMapper.toResponse(updatedUser);
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("No authenticated user found in security context");
        }

        String email = authentication.getName();
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
