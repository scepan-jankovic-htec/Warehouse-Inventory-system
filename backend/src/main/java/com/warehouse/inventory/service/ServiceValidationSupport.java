package com.warehouse.inventory.service;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;

import java.util.Set;

abstract class ServiceValidationSupport {

    private final Validator validator;

    protected ServiceValidationSupport(Validator validator) {
        this.validator = validator;
    }

    protected <T> void validate(T target) {
        if (target == null) {
            throw new IllegalArgumentException("Target must not be null.");
        }

        Set<ConstraintViolation<T>> violations = validator.validate(target);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }
    }

    protected int normalizePage(Integer page) {
        return page == null || page < 1 ? 1 : page;
    }

    protected int normalizeSize(Integer size) {
        if (size == null || size < 1) {
            return 20;
        }
        return Math.min(size, 100);
    }
}
