package com.m4n.backend.security;

import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;

@Getter
public class CustomUserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final String fullName;
    private final RoleName role;
    private final boolean active;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserPrincipal(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.fullName = user.getFullName();
        this.role = user.getRole() != null ? user.getRole().getName() : null;
        this.active = user.isActive();

        if (this.role != null) {
            this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + this.role.name()));
        } else {
            this.authorities = Collections.emptyList();
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
