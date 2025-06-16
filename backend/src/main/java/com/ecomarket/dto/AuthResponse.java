package com.ecomarket.dto;

public class AuthResponse {
    
    private String message;
    private UserDto user;
    private String token;
    
    public AuthResponse() {}
    
    public AuthResponse(String message, UserDto user) {
        this.message = message;
        this.user = user;
    }
    
    public AuthResponse(String message, UserDto user, String token) {
        this.message = message;
        this.user = user;
        this.token = token;
    }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }
    
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}