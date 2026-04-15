package com.maplewood.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class EnrollmentResponseDTO {
    private boolean success;
    private List<ValidationErrorDTO> errors = new ArrayList<>();

    public static EnrollmentResponseDTO ok() {
        EnrollmentResponseDTO response = new EnrollmentResponseDTO();
        response.setSuccess(true);
        return response;
    }

    public static EnrollmentResponseDTO fail(List<ValidationErrorDTO> errors) {
        EnrollmentResponseDTO response = new EnrollmentResponseDTO();
        response.setSuccess(false);
        response.setErrors(errors);
        return response;
    }
}
