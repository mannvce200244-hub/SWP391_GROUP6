package com.m4n.backend.mapper;

import com.m4n.backend.dto.response.UserDetailResponse;
import com.m4n.backend.dto.response.UserResponse;
import com.m4n.backend.dto.response.UserSummaryResponse;
import com.m4n.backend.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        if (user == null) {
            return null;
        }

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getAddress(),
                user.getRole() != null ? user.getRole().getName() : null,
                user.isActive(),
                user.getVersion()
        );
    }

    public UserSummaryResponse toSummaryResponse(User user) {
        if (user == null) {
            return null;
        }

        return new UserSummaryResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole() != null ? user.getRole().getName() : null,
                user.isActive(),
                user.getCreatedAt(),
                user.getVersion()
        );
    }

    public UserDetailResponse toDetailResponse(User user) {
        if (user == null) {
            return null;
        }

        return new UserDetailResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getAddress(),
                user.getRole() != null ? user.getRole().getName() : null,
                user.isActive(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.getVersion()
        );
    }
}
