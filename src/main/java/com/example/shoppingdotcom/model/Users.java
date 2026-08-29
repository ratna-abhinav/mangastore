package com.example.shoppingdotcom.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;

    private String mobileNumber;

    private String email;

    private String address;

    private String city;

    private String state;

    private String pincode;

    private String password;

    private String profileImage;

    private String role;

    private Integer isEnable;

    private Integer accountNonLocked;

    private Integer failedAttempt;

    @Column(columnDefinition = "TIMESTAMP")
    private Date lockTime;

    private String resetToken;

    private String verificationToken;

    @Column(columnDefinition = "TIMESTAMP")
    private Date verificationTokenExpiry;
}
