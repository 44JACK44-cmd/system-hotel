package com.hotel.apifds20261.dto.response;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter @Setter
public class ResponsePage<T> {
    private String type = "success";
    private List<String> listMessage = new java.util.ArrayList<>();
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public ResponsePage(List<T> content, int page, int size, long totalElements, int totalPages) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }

    public String getMessage() { return listMessage.isEmpty() ? "" : listMessage.get(0); }
}
