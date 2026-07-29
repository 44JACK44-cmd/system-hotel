package com.hotel.apifds20261.dto.response;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class SuggestionResponse {
    private Long id;
    private String label;
    private String subtitle;
    private String entityType;
}
