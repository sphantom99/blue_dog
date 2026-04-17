package com.maplewood.controller;

import com.maplewood.dto.EnrollmentResponseDTO;
import com.maplewood.dto.ValidationErrorDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<EnrollmentResponseDTO> handleNotFound(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(EnrollmentResponseDTO.fail(List.of(
                        new ValidationErrorDTO("NOT_FOUND", ex.getMessage()))));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<EnrollmentResponseDTO> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(EnrollmentResponseDTO.fail(List.of(
                        new ValidationErrorDTO("ILLEGAL_STATE", ex.getMessage()))));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<EnrollmentResponseDTO> handleValidation(MethodArgumentNotValidException ex) {
        List<ValidationErrorDTO> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ValidationErrorDTO("VALIDATION_ERROR", fe.getField() + ": " + fe.getDefaultMessage()))
                .toList();
        return ResponseEntity.badRequest()
                .body(EnrollmentResponseDTO.fail(errors));
    }
}
