package com.maplewood.service;

public enum EnrollmentStatus {
    ENROLLED("enrolled"),
    DROPPED("dropped");

    private final String value;

    EnrollmentStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
