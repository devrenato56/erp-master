"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, ChevronUp, ChevronDown, FileText } from "lucide-react";
import { apiFetch, apiFetchForm } from "@/lib/api";
import { useBreakpoint } from "@/lib/use-breakpoint";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Tema {
  id: string;
  nombre: string;
  es_predefinido: boolean;
}

interface Documento {
  id: string;
  nombre_archivo: string;
  formato: string;
  visibilidad: "privado" | "compartido";
  estado_moderacion: "pendiente" | "aprobado" | "rechazado";
  motivo_rechazo: string | null;
  subido_en: string;
  tema_id: string | null;
}

interface SubidaResponse {
  id: string;
  nombre_archivo: string;
  chunks_generados: number;
  estado_moderacion: string;
}

// ---------------------------------------------------------------------------
// Helpers de badge
// ---------------------------------------------------------------------------

function BadgeEstado({ estado }: { estado: Documento["estado_moderacion"] }) {
  const styles: Record<string, React.CSSProperties> = {
    aprobado: {
      backgroundColor: "var(--accent-muted)",
      color: "var(--accent)",
    },
    pendiente: {
      backgroundColor: "rgba(255,255,255,0.06)",
      color: "var(--text-muted)",
    },
    rechazado: {
      backgroundColor: "rgba(239,68,68,0.12)",
      color: "var(--danger)",
    },
  };
  const labels: Record<string, string> = {
    aprobado: "Aprobado",
    pendiente: "Pendiente",
    rechazado: "Rechazado",
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "var(--radius-sm)",
        fontSize: "12px",
        fontWeight: 500,
        ...styles[estado],
      }}
    >
      {labels[estado]}
    </span>
  );
}

function BadgeVisibilidad({ visibilidad }: { visibilidad: Documento["visibilidad"] }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "var(--radius-sm)",
        fontSize: "12px",
        fontWeight: 500,
        backgroundColor: visibilidad === "compartido" ? "var(--accent-muted)" : "rgba(255,255,255,0.06)",
        color: visibilidad === "compartido" ? "var(--accent)" : "var(--text-muted)",
      }}
    >
      {visibilidad === "compartido" ? "Compartido" : "Privado"}
    </span>
  );
}

function BadgeFormato({ formato }: { formato: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 6px",
        borderRadius: "var(--radius-sm)",
        fontSize: "11px",
        fontWeight: 500,
        fontFamily: "monospace",
        backgroundColor: "rgba(255,255,255,0.06)",
        color: "var(--text-secondary)",
        textTransform: "uppercase",
      }}
    >
      {formato}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Formulario de subida
// ---------------------------------------------------------------------------

function UploadPanel({
  temas,
  onUploaded,
  onClose,
}: {
  temas: Tema[];
  onUploaded: (doc: SubidaResponse) => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [temaId, setTemaId] = useState(temas[0]?.id ?? "");
  const [visibilidad, setVisibilidad] = useState<"privado" | "compartido">("privado");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo) { setError("Seleccioná un archivo."); return; }
    if (!temaId) { setError("Seleccioná un tema."); return; }

    setSubiendo(true);
    setError(null);
    setExito(null);

    const form = new FormData();
    form.append("archivo", archivo);
    form.append("tema_id", temaId);
    form.append("visibilidad", visibilidad);

    try {
      const res = await apiFetchForm<SubidaResponse>("/documentos", form);
      setExito(`Subido correctamente — ${res.chunks_generados} fragmentos generados.`);
      setArchivo(null);
      if (fileRef.current) fileRef.current.value = "";
      onUploaded(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubiendo(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-base)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "8px 12px",
    fontSize: "14px",
    color: "var(--text-primary)",
    outline: "none",
    width: "100%",
  };

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--bg-surface)",
        padding: "20px 24px",
        marginBottom: "24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
          Subir documento
        </p>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
        >
          <ChevronUp size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Archivo */}
        <div>
          <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
            Archivo <span style={{ color: "var(--text-muted)" }}>(PDF, DOCX, TXT, MD — máx. 10 MB)</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            style={{ ...inputStyle, cursor: "pointer" }}
          />
        </div>

        {/* Tema */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
              Tema
            </label>
            <select
              value={temaId}
              onChange={(e) => setTemaId(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {temas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}{t.es_predefinido ? " ★" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Visibilidad */}
          <div style={{ flex: "1 1 160px" }}>
            <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
              Visibilidad
            </label>
            <div style={{ display: "flex", gap: "0" }}>
              {(["privado", "compartido"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibilidad(v)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    fontSize: "13px",
                    fontWeight: 500,
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    borderRadius: v === "privado" ? "var(--radius-sm) 0 0 var(--radius-sm)" : "0 var(--radius-sm) var(--radius-sm) 0",
                    backgroundColor: visibilidad === v ? "var(--accent-muted)" : "var(--bg-base)",
                    color: visibilidad === v ? "var(--accent)" : "var(--text-secondary)",
                    transition: "background-color 0.1s, color 0.1s",
                  }}
                >
                  {v === "privado" ? "Privado" : "Compartido"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info visibilidad compartido */}
        {visibilidad === "compartido" && (
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            Los documentos compartidos pasan por moderación automática antes de ser visibles para otros usuarios.
          </p>
        )}

        {/* Feedback */}
        {error && (
          <p style={{ fontSize: "13px", color: "var(--danger)", margin: 0 }}>{error}</p>
        )}
        {exito && (
          <p style={{ fontSize: "13px", color: "var(--accent)", margin: 0 }}>{exito}</p>
        )}

        {/* Submit */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={subiendo}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-strong)",
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={subiendo}
            style={{
              padding: "8px 20px",
              fontSize: "14px",
              fontWeight: 500,
              borderRadius: "var(--radius-sm)",
              border: "none",
              backgroundColor: subiendo ? "var(--accent-muted)" : "var(--accent)",
              color: subiendo ? "var(--accent)" : "var(--bg-base)",
              cursor: subiendo ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Upload size={14} />
            {subiendo ? "Procesando..." : "Subir"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function DocumentosPage() {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarSubida, setMostrarSubida] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const { isMobile, isTablet } = useBreakpoint();

  const temaMap = Object.fromEntries(temas.map((t) => [t.id, t.nombre]));

  useEffect(() => {
    Promise.all([
      apiFetch<Documento[]>("/documentos"),
      apiFetch<Tema[]>("/temas"),
    ])
      .then(([d, t]) => {
        setDocs(d);
        setTemas(t);
      })
      .catch(() => setErrorGlobal("No se pudieron cargar los documentos. Verificá tu conexión."))
      .finally(() => setCargando(false));
  }, []);

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este documento? Esta acción no se puede deshacer.")) return;
    setEliminando(id);
    setErrorEliminar(null);
    try {
      await apiFetch(`/documentos/${id}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setErrorEliminar("No se pudo eliminar el documento. Intentá de nuevo.");
    } finally {
      setEliminando(null);
    }
  }

  function handleUploaded() {
    // Refetch the list after a successful upload
    apiFetch<Documento[]>("/documentos")
      .then(setDocs)
      .catch(() => {});
  }

  const propios = docs.filter((d) => d.visibilidad === "privado" || d.estado_moderacion !== "aprobado" || true);
  const compartidos = docs.filter((d) => d.visibilidad === "compartido");

  // Columnas visibles según breakpoint
  const cols = isMobile
    ? "1fr 40px"
    : isTablet
    ? "1fr 100px 110px 40px"
    : "1fr 160px 100px 110px 90px 40px";
  const headers = isMobile
    ? ["Archivo", ""]
    : isTablet
    ? ["Archivo", "Visibilidad", "Estado", ""]
    : ["Archivo", "Tema", "Visibilidad", "Estado", "Subido", ""];

  return (
    <div style={{ padding: isMobile ? "24px 16px" : "40px 48px", maxWidth: "960px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Base de conocimiento
        </p>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
              Documentos
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Gestiona los archivos que alimentan tu asistente de ERP.
            </p>
          </div>
          {!mostrarSubida && (
            <button
              onClick={() => setMostrarSubida(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "var(--radius-sm)",
                border: "none",
                backgroundColor: "var(--accent)",
                color: "var(--bg-base)",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <ChevronDown size={14} />
              Subir documento
            </button>
          )}
        </div>
      </div>

      {/* Stats cards — estilo hackO.dev */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1px",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--border)",
          marginBottom: "28px",
          overflow: "hidden",
        }}
      >
        {[
          { label: "Documentos", value: docs.length },
          { label: "Compartidos", value: compartidos.length },
          { label: "Aprobados", value: docs.filter((d) => d.estado_moderacion === "aprobado").length },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              backgroundColor: "var(--bg-surface)",
              padding: "20px 24px",
            }}
          >
            <p style={{ fontSize: "26px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
              {cargando ? "—" : value}
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Upload panel */}
      {mostrarSubida && (
        <UploadPanel
          temas={temas}
          onUploaded={handleUploaded}
          onClose={() => setMostrarSubida(false)}
        />
      )}

      {/* Errores */}
      {errorGlobal && (
        <p style={{ fontSize: "13px", color: "var(--danger)", marginBottom: "16px" }}>{errorGlobal}</p>
      )}
      {errorEliminar && (
        <p style={{ fontSize: "13px", color: "var(--danger)", marginBottom: "16px" }}>{errorEliminar}</p>
      )}

      {/* Tabla de documentos */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        {/* Cabecera tabla */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: cols,
            padding: "10px 16px",
            backgroundColor: "var(--bg-surface)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {headers.map((col) => (
            <span
              key={col}
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.06em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
              }}
            >
              {col}
            </span>
          ))}
        </div>

        {/* Filas */}
        {cargando ? (
          <div style={{ padding: "32px 16px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Cargando...</p>
          </div>
        ) : docs.length === 0 ? (
          <div style={{ padding: "48px 16px", textAlign: "center" }}>
            <FileText size={32} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>
              Sin documentos todavía
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Subí el primero usando el botón de arriba.
            </p>
          </div>
        ) : (
          docs.map((doc, i) => (
            <DocRow
              key={doc.id}
              doc={doc}
              temaNombre={temaMap[doc.tema_id ?? ""] ?? "—"}
              isLast={i === docs.length - 1}
              eliminando={eliminando === doc.id}
              onEliminar={() => handleEliminar(doc.id)}
              cols={cols}
              isMobile={isMobile}
              isTablet={isTablet}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fila de documento
// ---------------------------------------------------------------------------

function DocRow({
  doc,
  temaNombre,
  isLast,
  eliminando,
  onEliminar,
  cols,
  isMobile,
  isTablet,
}: {
  doc: Documento;
  temaNombre: string;
  isLast: boolean;
  eliminando: boolean;
  onEliminar: () => void;
  cols: string;
  isMobile: boolean;
  isTablet: boolean;
}) {
  const fecha = new Date(doc.subido_en).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: cols,
        padding: "12px 16px",
        borderBottom: isLast ? "none" : "1px solid var(--border)",
        alignItems: "center",
        backgroundColor: "var(--bg-base)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-surface)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-base)")}
    >
      {/* Nombre + formato */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
        <BadgeFormato formato={doc.formato} />
        <span
          style={{
            fontSize: "13px",
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={doc.nombre_archivo}
        >
          {doc.nombre_archivo}
        </span>
      </div>

      {/* Tema — solo desktop */}
      {!isMobile && !isTablet && (
        <span
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={temaNombre}
        >
          {temaNombre}
        </span>
      )}

      {/* Visibilidad — tablet y desktop */}
      {!isMobile && <BadgeVisibilidad visibilidad={doc.visibilidad} />}

      {/* Estado moderación — tablet y desktop */}
      {!isMobile && (
        <div>
          <BadgeEstado estado={doc.estado_moderacion} />
          {doc.motivo_rechazo && (
            <p
              style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", lineHeight: 1.3 }}
              title={doc.motivo_rechazo}
            >
              {doc.motivo_rechazo.slice(0, 40)}…
            </p>
          )}
        </div>
      )}

      {/* Fecha — solo desktop */}
      {!isMobile && !isTablet && (
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{fecha}</span>
      )}

      {/* Eliminar */}
      <button
        onClick={onEliminar}
        disabled={eliminando}
        title="Eliminar documento"
        style={{
          background: "none",
          border: "none",
          cursor: eliminando ? "not-allowed" : "pointer",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px",
          borderRadius: "var(--radius-sm)",
          transition: "color 0.1s",
        }}
        onMouseEnter={(e) => { if (!eliminando) (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
