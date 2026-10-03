package com.m4n.backend.controller;

import com.m4n.backend.dto.request.UpdateProfileRequest;
import com.m4n.backend.dto.response.UserResponse;
import com.m4n.backend.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/profile")
@Tag(name = "Profile", description = "User profile viewing and updating APIs")
@SecurityRequirement(name = "bearerAuth")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    @Operation(summary = "Get own profile", description = "Returns profile of currently authenticated user.")
    public ResponseEntity<UserResponse> getProfile() {
        UserResponse response = profileService.getCurrentProfile();
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @Operation(summary = "Update own profile (full)", description = "Updates full name, phone number, and address for currently authenticated user.")
    public ResponseEntity<UserResponse> updateProfilePut(@Valid @RequestBody UpdateProfileRequest request) {
        UserResponse response = profileService.updateCurrentProfile(request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping
    @Operation(summary = "Update own profile (partial)", description = "Updates full name, phone number, and address for currently authenticated user.")
    public ResponseEntity<UserResponse> updateProfilePatch(@Valid @RequestBody UpdateProfileRequest request) {
        UserResponse response = profileService.updateCurrentProfile(request);
        return ResponseEntity.ok(response);
    }
}
