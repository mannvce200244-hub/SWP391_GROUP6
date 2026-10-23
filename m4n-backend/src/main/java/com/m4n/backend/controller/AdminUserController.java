package com.m4n.backend.controller;

import com.m4n.backend.dto.request.ChangeUserRoleRequest;
import com.m4n.backend.dto.request.CreateStaffRequest;
import com.m4n.backend.dto.request.UpdateUserRequest;
import com.m4n.backend.dto.request.UserStatusUpdateRequest;
import com.m4n.backend.dto.response.UserDetailResponse;
import com.m4n.backend.dto.response.UserSummaryResponse;
import com.m4n.backend.dto.response.OrderResponse;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.service.AdminUserService;
import com.m4n.backend.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin User Management", description = "Back-office user and staff management APIs with RBAC and optimistic concurrency protection")
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final OrderService orderService;

    public AdminUserController(AdminUserService adminUserService, OrderService orderService) {
        this.adminUserService = adminUserService;
        this.orderService = orderService;
    }

    @GetMapping
    @Operation(summary = "List and search users", description = "Returns paginated list of users with database filtering by keyword, role, and active status.")
    public ResponseEntity<Page<UserSummaryResponse>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) RoleName role,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<UserSummaryResponse> response = adminUserService.listUsers(search, role, isActive, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user details by ID", description = "Returns full user management detail without sensitive password/token fields.")
    public ResponseEntity<UserDetailResponse> getUserById(@PathVariable Long id) {
        UserDetailResponse response = adminUserService.getUserById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/orders")
    @Operation(summary = "Get customer order history", description = "Returns a paginated, read-only order history for a customer account.")
    public ResponseEntity<Page<OrderResponse>> getCustomerOrderHistory(
            @PathVariable Long id,
            @PageableDefault(size = 5, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(orderService.getCustomerOrderHistory(id, pageable));
    }

    @PostMapping("/staff")
    @Operation(summary = "Create staff account", description = "Creates a staff account. Regular ADMIN can create ONLINE_STAFF/POS_STAFF. Only SUPER_ADMIN can create ADMIN.")
    public ResponseEntity<UserDetailResponse> createStaff(
            @Valid @RequestBody CreateStaffRequest request,
            Authentication authentication
    ) {
        UserDetailResponse response = adminUserService.createStaff(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update user contact information", description = "Updates allowed contact fields with optimistic locking verification.")
    public ResponseEntity<UserDetailResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication
    ) {
        UserDetailResponse response = adminUserService.updateUser(id, request, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/role")
    @Operation(summary = "Change user role", description = "Updates user role following strict actor-target matrix, enforces last SUPER_ADMIN protection, and revokes sessions.")
    public ResponseEntity<UserDetailResponse> changeRole(
            @PathVariable Long id,
            @Valid @RequestBody ChangeUserRoleRequest request,
            Authentication authentication
    ) {
        UserDetailResponse response = adminUserService.changeRole(id, request, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/disable")
    @Operation(summary = "Disable user account", description = "Deactivates user account, revokes all active refresh sessions, and prevents self-disable / last SUPER_ADMIN disable.")
    public ResponseEntity<UserDetailResponse> disableUser(
            @PathVariable Long id,
            @RequestBody(required = false) UserStatusUpdateRequest request,
            Authentication authentication
    ) {
        Long expectedVersion = request != null ? request.expectedVersion() : null;
        UserDetailResponse response = adminUserService.disableUser(id, expectedVersion, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/reactivate")
    @Operation(summary = "Reactivate user account", description = "Reactivates a previously disabled user account.")
    public ResponseEntity<UserDetailResponse> reactivateUser(
            @PathVariable Long id,
            @RequestBody(required = false) UserStatusUpdateRequest request,
            Authentication authentication
    ) {
        Long expectedVersion = request != null ? request.expectedVersion() : null;
        UserDetailResponse response = adminUserService.reactivateUser(id, expectedVersion, authentication.getName());
        return ResponseEntity.ok(response);
    }
}
