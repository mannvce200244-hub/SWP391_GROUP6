package com.m4n.backend.service;

import com.m4n.backend.dto.request.UpdateProfileRequest;
import com.m4n.backend.dto.response.UserResponse;

public interface ProfileService {

    UserResponse getCurrentProfile();

    UserResponse updateCurrentProfile(UpdateProfileRequest request);
}
