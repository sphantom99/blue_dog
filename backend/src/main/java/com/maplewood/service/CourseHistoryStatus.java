package com.maplewood.service;

public enum CourseHistoryStatus {
    PASSED("passed"),
    FAILED("failed");

    private final String value;

    CourseHistoryStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
