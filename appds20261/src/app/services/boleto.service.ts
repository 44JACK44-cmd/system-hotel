import { Injectable, inject } from '@angular/core';
import { AppConfigService } from './app-config.service';

// Valor seguro: nunca imprime null/undefined/espacios vacíos
export function cv(v: any): string {
  if (v === null || v === undefined) return 'No registrado';
  const s = String(v).trim();
  return s === '' ? 'No registrado' : s;
}

export function moneda(v: any): string {
  if (v === null || v === undefined || v === '') return 'No registrado';
  const n = Number(v);
  if (isNaN(n)) return cv(v);
  return 'S/ ' + n.toFixed(2);
}

export function fmtFecha(v: any): string {
  if (!v) return 'No registrado';
  const d = new Date(v);
  if (isNaN(d.getTime())) return cv(v);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function fmtHora(v: any): string {
  if (!v) return 'No registrado';
  const d = new Date(v);
  if (isNaN(d.getTime())) return cv(v);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export interface BoletoCampo {
  label: string;
  value: any;
}

export interface BoletoFilaEconomica {
  concepto: string;
  cantidad: any;
  precioUnitario: any;
  subtotal: any;
}

export interface BoletoFilaConsumo {
  fecha: any;
  producto: any;
  cantidad: any;
  precio: any;
  subtotal: any;
}

export interface BoletoFilaPago {
  fecha: any;
  metodo: any;
  tipo: any;
  monto: any;
  usuario: any;
}

export interface DatosComprobante {
  tipoDocumento: string;
  numero: string;
  hospedajeId: number;
  categoria?: string;
  recepcionista?: string;
  hotel?: {
    logo?: string;
    nombre?: string;
    direccion?: string;
    ciudad?: string;
    telefono?: string;
    correo?: string;
    sitioWeb?: string;
  };
  cliente: BoletoCampo[];
  hospedaje: BoletoCampo[];
  habitacion: BoletoCampo[];
  detalle: BoletoFilaEconomica[];
  consumos: BoletoFilaConsumo[];
  totalConsumos?: any;
  pagos: BoletoFilaPago[];
  resumen: BoletoCampo[];
  observaciones: any;
  pie?: string;
  autoImpresion?: boolean;
}

@Injectable({ providedIn: 'root' })
export class BoletoService {
  private configService = inject(AppConfigService);

  // Wrapper simple (usado por checkout/reservas): genera un comprobante minimo.
  abrirBoleto(param: {
    titulo: string;
    referencia: string;
    lineas: BoletoCampo[];
    pie?: string;
    autoImpresion?: boolean;
  }): void {
    this.abrirComprobante({
      tipoDocumento: param.titulo,
      numero: param.referencia.replace('#', ''),
      hospedajeId: 0,
      recepcionista: '',
      cliente: param.lineas,
      hospedaje: [],
      habitacion: [],
      detalle: [],
      consumos: [],
      totalConsumos: null,
      pagos: [],
      resumen: [],
      observaciones: '',
      pie: param.pie,
      autoImpresion: param.autoImpresion,
    });
  }

  private txt(v: string): string {
    return v.replace(/[<>&]/g, m => (m === '<' ? '&lt;' : m === '>' ? '&gt;' : '&amp;'));
  }

  private tablaCampos(campos: BoletoCampo[]): string {
    const filas = campos
      .map(c => `<tr><td class="lbl">${this.txt(c.label)}</td><td class="val">${this.txt(cv(c.value))}</td></tr>`)
      .join('');
    return `<table>${filas}</table>`;
  }

  private tablaEconomica(filas: BoletoFilaEconomica[]): string {
    if (!filas || !filas.length) return '<div class="info">No se registraron conceptos.</div>';
    const trs = filas.map(f => `<tr>
      <td>${this.txt(cv(f.concepto))}</td>
      <td class="c">${this.txt(cv(f.cantidad))}</td>
      <td class="c">${moneda(f.precioUnitario)}</td>
      <td class="c">${moneda(f.subtotal)}</td>
    </tr>`).join('');
    return `<table class="tab">
      <thead><tr><th>Concepto</th><th>Cant.</th><th>P.U.</th><th>Subtotal</th></tr></thead>
      <tbody>${trs}</tbody></table>`;
  }

  private tablaConsumos(filas: BoletoFilaConsumo[], totalConsumos: any): string {
    if (!filas || !filas.length) return '<div class="info">No se registraron consumos.</div>';
    const trs = filas.map(f => `<tr>
      <td>${fmtFecha(f.fecha)}</td>
      <td>${fmtHora(f.fecha)}</td>
      <td>${this.txt(cv(f.producto))}</td>
      <td class="c">${this.txt(cv(f.cantidad))}</td>
      <td class="c">${moneda(f.precio)}</td>
      <td class="c">${moneda(f.subtotal)}</td>
    </tr>`).join('');
    return `<table class="tab">
      <thead><tr><th>Fecha</th><th>Hora</th><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
      <tbody>${trs}</tbody>
      <tfoot><tr><td colspan="5" class="lab">Total consumos</td><td class="c total">${moneda(totalConsumos)}</td></tr></tfoot>
    </table>`;
  }

  private tablaPagos(filas: BoletoFilaPago[]): string {
    if (!filas || !filas.length) return '<div class="info">No se registraron pagos.</div>';
    const trs = filas.map(f => `<tr>
      <td>${fmtFecha(f.fecha)}</td>
      <td>${fmtHora(f.fecha)}</td>
      <td>${this.txt(cv(f.metodo))}</td>
      <td>${this.txt(cv(f.tipo))}</td>
      <td class="c">${moneda(f.monto)}</td>
      <td>${this.txt(cv(f.usuario))}</td>
    </tr>`).join('');
    return `<table class="tab">
      <thead><tr><th>Fecha</th><th>Hora</th><th>Método</th><th>Tipo</th><th>Monto</th><th>Usuario</th></tr></thead>
      <tbody>${trs}</tbody></table>`;
  }

  private tablaResumen(campos: BoletoCampo[]): string {
    const filas = campos.map(cb => {
      const strong = /total\s*general/i.test(String(cb.label).trim());
      const cls = strong ? ' class="strong"' : '';
      return `<tr><td class="lab ${strong ? 'strong' : ''}">${this.txt(cb.label)}</td><td class="val ${strong ? 'strong' : ''}">${this.txt(cv(cb.value))}</td></tr>`;
    }).join('');
    return `<table>${filas}</table>`;
  }

  abrirComprobante(d: DatosComprobante): void {
    const win = window.open('', '_blank', 'width=860,height=1000');
    if (!win) return;

    const c = this.configService.config();
    const logo = this.configService.get('hotel.logo', '');
    const ruc = this.configService.get('hotel.ruc', '');
    const direccion = c.direccion;
    const ciudad = [c.ciudad, c.pais].filter(Boolean).join(', ');
    const telefono = c.telefono;
    const correo = c.email;
    const sitioWeb = c.sitioWeb;

    const linea =
      [direccion, ciudad, telefono ? 'Tel ' + telefono : '', correo ? 'Email ' + correo : '', sitioWeb]
      .filter(Boolean)
      .join(' · ');

    const css = `
      *{box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;color:#1c1c22;background:#f2f2f4;padding:24px;font-size:12px}
      .sheet{max-width:820px;margin:0 auto;background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.12);border-radius:8px;padding:28px 32px}
      .hdr{text-align:center;border-bottom:2px solid #b98a3e;padding-bottom:14px;margin-bottom:16px}
      .hdr h1{font-size:22px;letter-spacing:.5px;margin:6px 0 2px}
      .hdr .meta{font-size:10px;color:#555}
      .docline{display:flex;justify-content:space-between;background:#f7f4ee;border:1px solid #e4dcc8;border-radius:8px;padding:10px 14px;margin:14px 0;font-size:11px;flex-wrap:wrap;gap:6px}
      .docline b{font-size:13px;color:#9a6b20}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:14px 0}
      .seccion-titulo{font-weight:700;font-size:12px;color:#9a6b20;margin:18px 0 6px;border-left:4px solid #c9a24b;padding-left:8px}
      .card{border:1px solid #e6e2d8;border-radius:10px;padding:12px 14px}
      .card .cap{display:flex;align-items:center;gap:6px;font-weight:700;font-size:12px;color:#9a6b20;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:6px}
      .card table{width:100%;border-collapse:collapse}
      .card td{padding:3px 0;font-size:11px;vertical-align:top}
      .card .lab{color:#666;width:42%}
      .card .val{font-weight:600;text-align:right}
      .tab{width:100%;border-collapse:collapse;margin-top:8px;font-size:11px}
      .tab th{background:#f5f0e6;color:#6b5021;padding:6px 8px;text-align:left;border:1px solid #e6e2d8}
      .tab td{padding:5px 8px;border:1px solid #eae6dc;text-align:left}
      .tab .c{text-align:center}
      .tab .total,.tab tfoot .total{font-weight:700}
      .tab tfoot{font-weight:700}
      .resumen{max-width:360px;margin-left:auto}
      .resumen .val.strong{font-size:15px;color:#9a6b20;font-weight:800}
      .resumen .lab.strong{font-size:13px;color:#9a6b20;font-weight:800}
      .info{color:#777;font-style:italic;margin:6px 0;font-size:11px}
      .firma{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:44px;text-align:center;font-size:11px}
      .firma .linea{border-top:1px solid #999;padding-top:6px}
      .pie{text-align:center;margin-top:24px;font-size:10px;color:#777;border-top:1px solid #e6e2d8;padding-top:10px}
      @media print{body{background:#fff;padding:0}.sheet{box-shadow:none;border-radius:0;padding:20mm 16mm}}
      @media (max-width:600px){.grid{grid-template-columns:1fr}.sheet{padding:16px}}
    `;

    const body = `
      <div class="sheet">

        <div class="hdr">
          ${logo ? `<img src="${logo}" style="height:64px;max-width:180px;object-fit:contain;display:block;margin:0 auto"/>` : ''}
          <h1>${this.txt(c.nombre || 'Hotel')}</h1>
          ${(d.categoria || '').trim() ? `<div class="meta">${this.txt(d.categoria)} estrellas</div>` : ''}
          ${ruc ? `<div class="meta">RUC: ${this.txt(ruc)}</div>` : ''}
          ${linea ? `<div class="meta">${this.txt(linea)}</div>` : ''}
        </div>

        <div class="docline">
          <span><b>${this.txt(d.tipoDocumento || 'COMPROBANTE')}</b> N° ${this.txt(d.numero)}</span>
          <span>Hospedaje: #${cv(d.hospedajeId)}</span>
          <span>Emisión: ${fmtFecha(new Date())} ${fmtHora(new Date())}</span>
        </div>

        <div class="seccion-titulo">👤 CLIENTE</div>
        <div class="grid">
          <div class="card"><div class="cap">👤 Huésped</div>${this.tablaCampos(d.cliente)}</div>
          <div class="card"><div class="cap">🏨 Hospedaje</div>${this.tablaCampos(d.hospedaje)}</div>
        </div>

        <div class="seccion-titulo">💲 Detalle económico</div>
        ${this.tablaEconomica(d.detalle)}

        <div class="seccion-titulo">🍽 Consumos</div>
        ${this.tablaConsumos(d.consumos, d.totalConsumos)}

        <div class="seccion-titulo">💳 Pagos</div>
        ${this.tablaPagos(d.pagos)}

        <div class="seccion-titulo">📄 Resumen financiero</div>
        <div class="card resumen">${this.tablaResumen(d.resumen)}</div>

        <div class="seccion-titulo">🛏 Información de la habitación</div>
        <div class="card">${this.tablaCampos(d.habitacion)}</div>

        ${(d.observaciones || '').trim() ? `
        <div class="seccion-titulo">📝 Observaciones</div>
        <div class="info">${this.txt(d.observaciones)}</div>` : ''}

        <div class="firma">
          <div class="linea">Firma del huésped</div>
          <div class="linea">${this.txt(cv(d.recepcionista))}<br>Recepcionista</div>
        </div>

        <div class="pie">
          Gracias por hospedarse con nosotros. Esperamos verlo nuevamente.<br>
          ${this.txt(telefono)} · ${this.txt(correo)} · ${this.txt(sitioWeb)}
        </div>
      </div>`;

    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${this.txt(d.tipoDocumento)} ${this.txt(d.numero)}</title><style>${css}</style></head><body>${body}${d.autoImpresion ? '<script>window.onload=function(){window.print();}</script>' : ''}</body></html>`);
    win.document.close();
    win.focus();
    if (!d.autoImpresion) win.print();
  }
}