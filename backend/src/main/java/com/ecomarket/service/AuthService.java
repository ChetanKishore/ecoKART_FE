package com.ecomarket.service;

import com.ecomarket.dto.LoginRequest;
import com.ecomarket.dto.RegisterRequest;
import com.ecomarket.dto.UserDto;
import com.ecomarket.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {
    
    @Autowired
    private JwtUtil jwtUtil;
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    // In-memory user storage for demo (replace with database later)
    private final Map<String, UserDto> users = new HashMap<>();
    private Long userIdCounter = 1L;
    
    public UserDto register(RegisterRequest request) {
        String identifier = request.getEmail() != null ? request.getEmail() : request.getPhoneNumber();
        
        // Check if user already exists
        if (users.containsKey(identifier)) {
            throw new RuntimeException("User already exists");
        }
        
        // Create new user
        UserDto user = new UserDto(
                userIdCounter++,
                request.getEmail(),
                request.getPhoneNumber(),
                request.getFirstName(),
                request.getLastName(),
                null, // profileImageUrl
                request.getAuthProvider(),
                false, // isEmailVerified
                false, // isPhoneVerified
                0, // totalPoints
                BigDecimal.ZERO, // totalCo2Saved
                null // companyId
        );
        
        // Store password separately (in real app, this would be in database)
        users.put(identifier, user);
        users.put(identifier + "_password", new UserDto(null, null, null, null, null, null, null, null, null, null, null, null) {
            @Override
            public String toString() {
                return passwordEncoder.encode(request.getPassword());
            }
        });
        
        return user;
    }
    
    public UserDto login(LoginRequest request) {
        UserDto user = users.get(request.getEmailOrPhone());
        if (user == null) {
            throw new RuntimeException("Invalid credentials");
        }
        
        String storedPassword = users.get(request.getEmailOrPhone() + "_password").toString();
        if (!passwordEncoder.matches(request.getPassword(), storedPassword)) {
            throw new RuntimeException("Invalid credentials");
        }
        
        return user;
    }
    
    public String generateToken(UserDto user) {
        return jwtUtil.generateToken(user.getId().toString());
    }
    
    public UserDto getUserById(Long userId) {
        return users.values().stream()
                .filter(user -> user.getId() != null && user.getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}