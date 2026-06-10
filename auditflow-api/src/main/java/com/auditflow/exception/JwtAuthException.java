package com.auditflow.exception;

public class JwtAuthException extends RuntimeException {
    public JwtAuthException(String message, Throwable cause) {
        super(message, cause);
    }
}
