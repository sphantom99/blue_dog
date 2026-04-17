package com.maplewood.service;

public enum StudentStatus {
    ACTIVE("active"),
    INACTIVE("inactive");

    private final String value;

    StudentStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
