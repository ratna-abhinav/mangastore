package com.example.shoppingdotcom.dto;

import java.util.List;

public record PageDto<T>(
        List<T> content,
        int pageNo,
        int pageSize,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last) {
}
