package com.m4n.backend.controller;

import com.m4n.backend.config.GoogleLoginProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class GoogleLoginController {
    private final GoogleLoginProperties properties;

    public record Options(boolean available) {}

    @GetMapping("/api/v1/auth/google/options")
    public ResponseEntity<Options> options() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(new Options(properties.enabled()));
    }
}
