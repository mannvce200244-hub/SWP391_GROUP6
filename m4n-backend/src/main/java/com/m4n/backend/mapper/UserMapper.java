package com.m4n.backend.mapper;

import com.m4n.backend.dto.response.UserResponse;
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
                user.isActive()
        );
    }
}
