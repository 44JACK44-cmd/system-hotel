package com.hotel.apifds20261.dto.response;

import java.util.ArrayList;
import java.util.List;
import com.hotel.apifds20261.generic.ResponseGeneric;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ResponseAuditoria extends ResponseGeneric {
    private List<AuditoriaResponse> listAuditoria = new ArrayList<>();
}
