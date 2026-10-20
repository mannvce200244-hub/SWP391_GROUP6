package com.m4n.backend.service;

import com.m4n.backend.dto.request.ChangeUserRoleRequest;
import com.m4n.backend.dto.request.CreateStaffRequest;
import com.m4n.backend.dto.request.UpdateUserRequest;
import com.m4n.backend.dto.response.UserDetailResponse;
import com.m4n.backend.dto.response.UserSummaryResponse;
import com.m4n.backend.entity.RoleName;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminUserService {

    Page<UserSummaryResponse> listUsers(String keyword, RoleName role, Boolean isActive, Pageable pageable);

    UserDetailResponse getUserById(Long id);

    UserDetailResponse createStaff(CreateStaffRequest request, String currentOperatorEmail);

    UserDetailResponse updateUser(Long id, UpdateUserRequest request, String currentOperatorEmail);

    UserDetailResponse changeRole(Long id, ChangeUserRoleRequest request, String currentOperatorEmail);

    UserDetailResponse disableUser(Long id, Long expectedVersion, String currentOperatorEmail);

    UserDetailResponse reactivateUser(Long id, Long expectedVersion, String currentOperatorEmail);
}
