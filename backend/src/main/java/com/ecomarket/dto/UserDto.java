package com.ecomarket.dto;

import java.math.BigDecimal;

public class UserDto {
    
    private Long id;
    private String email;
    private String phoneNumber;
    private String firstName;
    private String lastName;
    private String profileImageUrl;
    private String authProvider;
    private Boolean isEmailVerified;
    private Boolean isPhoneVerified;
    private Integer totalPoints;
    private BigDecimal totalCo2Saved;
    private Long companyId;
    
    public UserDto() {}
    
    public UserDto(Long id, String email, String phoneNumber, String firstName, String lastName, 
                   String profileImageUrl, String authProvider, Boolean isEmailVerified, 
                   Boolean isPhoneVerified, Integer totalPoints, BigDecimal totalCo2Saved, Long companyId) {
        this.id = id;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.firstName = firstName;
        this.lastName = lastName;
        this.profileImageUrl = profileImageUrl;
        this.authProvider = authProvider;
        this.isEmailVerified = isEmailVerified;
        this.isPhoneVerified = isPhoneVerified;
        this.totalPoints = totalPoints;
        this.totalCo2Saved = totalCo2Saved;
        this.companyId = companyId;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    
    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
    
    public String getAuthProvider() { return authProvider; }
    public void setAuthProvider(String authProvider) { this.authProvider = authProvider; }
    
    public Boolean getIsEmailVerified() { return isEmailVerified; }
    public void setIsEmailVerified(Boolean isEmailVerified) { this.isEmailVerified = isEmailVerified; }
    
    public Boolean getIsPhoneVerified() { return isPhoneVerified; }
    public void setIsPhoneVerified(Boolean isPhoneVerified) { this.isPhoneVerified = isPhoneVerified; }
    
    public Integer getTotalPoints() { return totalPoints; }
    public void setTotalPoints(Integer totalPoints) { this.totalPoints = totalPoints; }
    
    public BigDecimal getTotalCo2Saved() { return totalCo2Saved; }
    public void setTotalCo2Saved(BigDecimal totalCo2Saved) { this.totalCo2Saved = totalCo2Saved; }
    
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
}