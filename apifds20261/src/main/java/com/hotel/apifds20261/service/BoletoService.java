package com.hotel.apifds20261.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class BoletoService {

    public byte[] generarBoletoHospedaje(
            Long hospedajeId,
            String clienteNombre,
            String clienteTelefono,
            String clienteDocumento,
            String habitacionNumero,
            String habitacionTipo,
            String usuarioNombre,
            String fechaIngreso,
            String fechaSalidaProgramada,
            String estado,
            String totalPagado,
            String deudaPendiente
    ) throws Exception {
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf, PageSize.A4);
        
        // Márgenes
        document.setMargins(40, 40, 40, 40);
        
        // Encabezado
        Paragraph titulo = new Paragraph("BOLETO DE HOSPEDAJE")
                .setFontSize(18)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(titulo);
        
        // Línea separadora
        LineSeparator line = new LineSeparator(new SolidLine());
        document.add(line);
        document.add(new Paragraph("\n"));
        
        // Información del boleto
        Table table = new Table(2);
        table.setWidthPercent(100);
        
        // Número de boleto
        table.addCell(new Cell().add(new Paragraph("N° Boleto:").setBold()));
        table.addCell(new Cell().add(new Paragraph("#" + hospedajeId)));
        
        // Fecha de emisión
        table.addCell(new Cell().add(new Paragraph("Fecha de Emisión:").setBold()));
        table.addCell(new Cell().add(new Paragraph(java.time.LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))));
        
        // Estado
        table.addCell(new Cell().add(new Paragraph("Estado:").setBold()));
        table.addCell(new Cell().add(new Paragraph(estado)));
        
        document.add(table);
        document.add(new Paragraph("\n"));
        
        // Información del cliente
        Section sectionCliente = new Section("INFORMACIÓN DEL CLIENTE");
        document.add(sectionCliente.createParagraph()
                .setFontSize(14)
                .setBold()
                .setTextAlignment(TextAlignment.LEFT)
                .setMarginBottom(10));
        
        Table tableCliente = new Table(2);
        tableCliente.setWidthPercent(100);
        
        tableCliente.addCell(new Cell().add(new Paragraph("Nombre:").setBold()));
        tableCliente.addCell(new Cell().add(new Paragraph(clienteNombre)));
        
        tableCliente.addCell(new Cell().add(new Paragraph("Teléfono:").setBold()));
        tableCliente.addCell(new Cell().add(new Paragraph(clienteTelefono != null ? clienteTelefono : "N/A")));
        
        tableCliente.addCell(new Cell().add(new Paragraph("Documento:").setBold()));
        tableCliente.addCell(new Cell().add(new Paragraph(clienteDocumento != null ? clienteDocumento : "N/A")));
        
        document.add(tableCliente);
        document.add(new Paragraph("\n"));
        
        // Información de la habitación
        Section sectionHabitacion = new Section("INFORMACIÓN DE LA HABITACIÓN");
        document.add(sectionHabitacion.createParagraph()
                .setFontSize(14)
                .setBold()
                .setTextAlignment(TextAlignment.LEFT)
                .setMarginBottom(10));
        
        Table tableHabitacion = new Table(2);
        tableHabitacion.setWidthPercent(100);
        
        tableHabitacion.addCell(new Cell().add(new Paragraph("Número:").setBold()));
        tableHabitacion.addCell(new Cell().add(new Paragraph(habitacionNumero)));
        
        tableHabitacion.addCell(new Cell().add(new Paragraph("Tipo:").setBold()));
        tableHabitacion.addCell(new Cell().add(new Paragraph(habitacionTipo)));
        
        document.add(tableHabitacion);
        document.add(new Paragraph("\n"));
        
        // Fechas del hospedaje
        Section sectionFechas = new Section("FECHAS DEL HOSPEDAJE");
        document.add(sectionFechas.createParagraph()
                .setFontSize(14)
                .setBold()
                .setTextAlignment(TextAlignment.LEFT)
                .setMarginBottom(10));
        
        Table tableFechas = new Table(2);
        tableFechas.setWidthPercent(100);
        
        tableFechas.addCell(new Cell().add(new Paragraph("Fecha de Ingreso:").setBold()));
        tableFechas.addCell(new Cell().add(new Paragraph(fechaIngreso)));
        
        tableFechas.addCell(new Cell().add(new Paragraph("Fecha de Salida Programada:").setBold()));
        tableFechas.addCell(new Cell().add(new Paragraph(fechaSalidaProgramada)));
        
        document.add(tableFechas);
        document.add(new Paragraph("\n"));
        
        // Información del personal
        Section sectionPersonal = new Section("ATENCIÓN");
        document.add(sectionPersonal.createParagraph()
                .setFontSize(14)
                .setBold()
                .setTextAlignment(TextAlignment.LEFT)
                .setMarginBottom(10));
        
        Table tablePersonal = new Table(2);
        tablePersonal.setWidthPercent(100);
        
        tablePersonal.addCell(new Cell().add(new Paragraph("Atendido por:").setBold()));
        tablePersonal.addCell(new Cell().add(new Paragraph(usuarioNombre)));
        
        document.add(tablePersonal);
        document.add(new Paragraph("\n"));
        
        // Resumen financiero
        Section sectionFinanciero = new Section("RESUMEN FINANCIERO");
        document.add(sectionFinanciero.createParagraph()
                .setFontSize(14)
                .setBold()
                .setTextAlignment(TextAlignment.LEFT)
                .setMarginBottom(10));
        
        Table tableFinanciero = new Table(2);
        tableFinanciero.setWidthPercent(100);
        
        tableFinanciero.addCell(new Cell().add(new Paragraph("Total Pagado:").setBold()));
        tableFinanciero.addCell(new Cell().add(new Paragraph("$ " + totalPagado)));
        
        tableFinanciero.addCell(new Cell().add(new Paragraph("Deuda Pendiente:").setBold()));
        Cell cellDeuda = new Cell().add(new Paragraph("$ " + deudaPendiente));
        if (!"0.00".equals(deudaPendiente) && !"0".equals(deudaPendiente)) {
            cellDeuda.setFontColor(ColorConstants.RED);
        }
        tableFinanciero.addCell(cellDeuda);
        
        document.add(tableFinanciero);
        document.add(new Paragraph("\n"));
        
        // Pie de página
        LineSeparator lineFooter = new LineSeparator(new SolidLine());
        document.add(lineFooter);
        
        Paragraph footer = new Paragraph("Gracias por su preferencia. Este documento es un comprobante de su hospedaje.")
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(10);
        document.add(footer);
        
        Paragraph disclaimer = new Paragraph("En caso de alguna discrepancia, favor de contactar a recepción.")
                .setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER)
                .setItalic()
                .setMarginTop(5);
        document.add(disclaimer);
        
        document.close();
        
        return baos.toByteArray();
    }
}
