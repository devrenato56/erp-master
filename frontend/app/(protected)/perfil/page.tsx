"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle, XCircle, MessageSquare, ClipboardList,
  FileText, Pencil, Check, X, Trash2, AlertCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface Perfil {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  creado_en: string;
}

interface Progreso {
  temas_estudiados: number;
  evaluaciones_realizadas: number;
  puntaje_promedio_20: number | null;
  mejor_puntaje_20: number | null;
  mejor_puntaje_tema: string | null;
  ultima_sesion_fecha: string | null;
  ultima_sesion_tema: string | null;
  ultima_evaluacion_fecha: string | null;
  ultima_evaluacion_tema: string | null;
  ultima_evaluacion_puntaje: number | null;
}

interface SesionHistorial {
  id: string;
  tema_id: string | null;
  tema_nombre: string | null;
  iniciada_en: string;
}

interface EvaluacionHistorial {
  intento_id: string;
  evaluacion_id: string;
  titulo_evaluacion: string | null;
  tema_nombre: string | null;
  puntaje_total: number | null;
  sobre_20: number | null;
  aprobado: boolean | null;
  completado_en: string | null;
}

interface Documento {
  id: string;
  nombre_archivo: string;
  formato: string;
  visibilidad: string;
  estado_moderacion: string;
  motivo_rechazo: string | null;
  subido_en: string;
  tema_id: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em",
      color: "var(--text-muted)", textTransform: "uppercase",
      marginBottom: "16px",
    }}>
      {children}
    </p>
  );
}

function Divider() {
  return <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "36px 0" }} />;
}

function EmptyState({ icon, text, cta, href }: {
  icon: React.ReactNode; text: string; cta: string; href: string;
}) {
  const router = useRouter();
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: "10px", padding: "32px 16px",
      border: "1px dashed var(--border)", borderRadius: "var(--radius-md)",
    }}>
      <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>{icon}</span>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>{text}</p>
      <button
        onClick={() => router.push(href)}
        style={{
          fontSize: "13px", color: "var(--accent)", background: "none",
          border: "none", cursor: "pointer", padding: 0,
        }}
      >
        {cta}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sección: datos del usuario con edición de nombre inline
// ---------------------------------------------------------------------------

function SeccionPerfil({ perfil, onNombreActualizado }: {
  perfil: Perfil; onNombreActualizado: (nombre: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(perfil.nombre);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editando) inputRef.current?.focus();
  }, [editando]);

  async function guardar() {
    const val = nombre.trim();
    if (!val) { setError("El nombre no puede estar vacío."); return; }
    setGuardando(true);
    setError(null);
    try {
      const res = await apiFetch<Perfil>("/perfil", {
        method: "PATCH",
        body: JSON.stringify({ nombre: val }),
      });
      onNombreActualizado(res.nombre);
      setEditando(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  function cancelar() {
    setNombre(perfil.nombre);
    setError(null);
    setEditando(false);
  }

  return (
    <div>
      <SectionLabel>Mi cuenta</SectionLabel>
      <div style={{
        border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
        backgroundColor: "var(--bg-surface)", padding: "24px",
        display: "flex", flexDirection: "column", gap: "16px",
      }}>
        {/* Nombre */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Nombre</p>
            {editando ? (
              <input
                ref={inputRef}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") guardar(); if (e.key === "Escape") cancelar(); }}
                style={{
                  fontSize: "15px", fontWeight: 500, color: "var(--text-primary)",
                  backgroundColor: "var(--bg-base)", border: "1px solid var(--border-strong)",
                  borderRadius: "var(--radius-sm)", padding: "4px 8px", outline: "none",
                  width: "100%", fontFamily: "inherit",
                }}
              />
            ) : (
              <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>
                {perfil.nombre}
              </p>
            )}
            {error && <p style={{ fontSize: "12px", color: "var(--danger)", marginTop: "4px" }}>{error}</p>}
          </div>
          {editando ? (
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button onClick={guardar} disabled={guardando}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "28px", height: "28px", borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--accent)", backgroundColor: "var(--accent-muted)",
                  color: "var(--accent)", cursor: guardando ? "not-allowed" : "pointer",
                }}>
                <Check size={13} />
              </button>
              <button onClick={cancelar}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "28px", height: "28px", borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)", backgroundColor: "transparent",
                  color: "var(--text-muted)", cursor: "pointer",
                }}>
                <X size={13} />
              </button>
            </div>
          ) : (
            <button onClick={() => setEditando(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "28px", height: "28px", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)", backgroundColor: "transparent",
                color: "var(--text-muted)", cursor: "pointer", flexShrink: 0,
              }}
              title="Editar nombre"
            >
              <Pencil size={13} />
            </button>
          )}
        </div>

        {/* Correo */}
        <div>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Correo</p>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{perfil.correo}</p>
        </div>

        {/* Fecha de registro */}
        <div>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Miembro desde</p>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{fechaCorta(perfil.creado_en)}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sección: cards de progreso
// ---------------------------------------------------------------------------

function SeccionProgreso({ progreso }: { progreso: Progreso }) {
  const stats = [
    { label: "Temas estudiados", value: String(progreso.temas_estudiados) },
    { label: "Evaluaciones realizadas", value: String(progreso.evaluaciones_realizadas) },
    {
      label: "Puntaje promedio",
      value: progreso.puntaje_promedio_20 != null ? `${progreso.puntaje_promedio_20.toFixed(1)}/20` : "—",
    },
    {
      label: "Mejor puntaje",
      value: progreso.mejor_puntaje_20 != null ? `${progreso.mejor_puntaje_20.toFixed(1)}/20` : "—",
      sub: progreso.mejor_puntaje_tema ?? undefined,
    },
  ];

  return (
    <div>
      <SectionLabel>Resumen de actividad</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-surface)", padding: "20px",
          }}>
            <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "8px" }}>
              {s.label}
            </p>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, marginBottom: "4px" }}>
              {s.value}
            </p>
            {s.sub && (
              <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.4 }}>{s.sub}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sección: historial de sesiones
// ---------------------------------------------------------------------------

function SeccionSesiones({ sesiones }: { sesiones: SesionHistorial[] }) {
  const router = useRouter();
  return (
    <div>
      <SectionLabel>Historial de conversaciones</SectionLabel>
      {sesiones.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={24} />}
          text="Todavía no iniciaste ninguna conversación."
          cta="Ir al chat"
          href="/chat"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {sesiones.map((s, i) => (
            <button
              key={s.id}
              onClick={() => router.push(`/chat/${s.id}`)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", backgroundColor: "var(--bg-surface)",
                border: "none", borderBottom: i < sesiones.length - 1 ? "1px solid var(--border)" : "none",
                cursor: "pointer", textAlign: "left", width: "100%",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-surface-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-surface)")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <MessageSquare size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>
                  {s.tema_nombre ?? "Sin tema"}
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", flexShrink: 0, marginLeft: "16px" }}>
                {fechaCorta(s.iniciada_en)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sección: historial de evaluaciones
// ---------------------------------------------------------------------------

function SeccionEvaluaciones({ evaluaciones }: { evaluaciones: EvaluacionHistorial[] }) {
  const router = useRouter();
  return (
    <div>
      <SectionLabel>Historial de evaluaciones</SectionLabel>
      {evaluaciones.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={24} />}
          text="Todavía no completaste ninguna evaluación."
          cta="Hacer una evaluación"
          href="/evaluaciones"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {evaluaciones.map((ev, i) => (
            <button
              key={ev.intento_id}
              onClick={() => router.push(`/evaluaciones/${ev.intento_id}/resultados`)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", backgroundColor: "var(--bg-surface)",
                border: "none", borderBottom: i < evaluaciones.length - 1 ? "1px solid var(--border)" : "none",
                cursor: "pointer", textAlign: "left", width: "100%",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-surface-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-surface)")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                {ev.aprobado
                  ? <CheckCircle size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  : <XCircle size={14} style={{ color: "var(--danger)", flexShrink: 0 }} />
                }
                <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ev.tema_nombre ?? ev.titulo_evaluacion ?? "Evaluación"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0, marginLeft: "16px" }}>
                <span style={{
                  fontSize: "13px", fontWeight: 600,
                  color: ev.aprobado ? "var(--accent)" : "var(--danger)",
                }}>
                  {ev.sobre_20 != null ? `${ev.sobre_20.toFixed(1)}/20` : "—"}
                </span>
                {ev.completado_en && (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {fechaCorta(ev.completado_en)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sección: mis documentos
// ---------------------------------------------------------------------------

const ESTADO_ESTILOS: Record<string, { color: string; bg: string; label: string }> = {
  aprobado:   { color: "var(--accent)", bg: "var(--accent-muted)", label: "Aprobado" },
  pendiente:  { color: "var(--text-muted)", bg: "rgba(255,255,255,0.05)", label: "Pendiente" },
  rechazado:  { color: "var(--danger)", bg: "rgba(239,68,68,0.08)", label: "Rechazado" },
};

function SeccionDocumentos({ documentos, onEliminar }: {
  documentos: Documento[];
  onEliminar: (id: string) => void;
}) {
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  async function handleEliminar(doc: Documento) {
    const ok = window.confirm(`¿Eliminar "${doc.nombre_archivo}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    setEliminando(doc.id);
    setErrorId(null);
    try {
      await apiFetch(`/perfil/documentos/${doc.id}`, { method: "DELETE" });
      onEliminar(doc.id);
    } catch {
      setErrorId(doc.id);
    } finally {
      setEliminando(null);
    }
  }

  return (
    <div>
      <SectionLabel>Mis documentos</SectionLabel>
      {documentos.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          text="Todavía no subiste ningún documento."
          cta="Subir un documento"
          href="/documentos"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {documentos.map((doc, i) => {
            const est = ESTADO_ESTILOS[doc.estado_moderacion] ?? ESTADO_ESTILOS.pendiente;
            return (
              <div key={doc.id} style={{ flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 16px", backgroundColor: "var(--bg-surface)",
                    borderBottom: i < documentos.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <FileText size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />

                  {/* Nombre */}
                  <span style={{
                    fontSize: "14px", color: "var(--text-primary)", fontWeight: 500,
                    flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {doc.nombre_archivo}
                  </span>

                  {/* Badges */}
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                    <span style={{
                      fontSize: "11px", padding: "2px 7px", borderRadius: "var(--radius-sm)",
                      backgroundColor: "rgba(255,255,255,0.05)", color: "var(--text-muted)",
                      textTransform: "uppercase", fontWeight: 500,
                    }}>
                      {doc.formato}
                    </span>
                    <span style={{
                      fontSize: "11px", padding: "2px 7px", borderRadius: "var(--radius-sm)",
                      backgroundColor: est.bg, color: est.color, fontWeight: 500,
                    }}>
                      {est.label}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "4px" }}>
                      {fechaCorta(doc.subido_en)}
                    </span>
                  </div>

                  {/* Botón eliminar */}
                  <button
                    onClick={() => handleEliminar(doc)}
                    disabled={eliminando === doc.id}
                    title="Eliminar documento"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "28px", height: "28px", flexShrink: 0,
                      border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                      backgroundColor: "transparent",
                      color: eliminando === doc.id ? "var(--text-muted)" : "var(--danger)",
                      cursor: eliminando === doc.id ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (eliminando !== doc.id)
                        (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    }}
                  >
                    {eliminando === doc.id
                      ? <span style={{ width: "12px", height: "12px", border: "2px solid var(--text-muted)", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                      : <Trash2 size={13} />
                    }
                  </button>
                </div>

                {/* Motivo de rechazo inline */}
                {doc.estado_moderacion === "rechazado" && doc.motivo_rechazo && (
                  <div style={{
                    display: "flex", gap: "8px", padding: "8px 16px",
                    backgroundColor: "rgba(239,68,68,0.04)",
                    borderBottom: i < documentos.length - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    <AlertCircle size={13} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "1px" }} />
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                      {doc.motivo_rechazo}
                    </p>
                  </div>
                )}

                {errorId === doc.id && (
                  <p style={{ fontSize: "12px", color: "var(--danger)", padding: "4px 16px 8px" }}>
                    Error al eliminar. Intentá de nuevo.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [sesiones, setSesiones] = useState<SesionHistorial[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionHistorial[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<Perfil>("/perfil"),
      apiFetch<Progreso>("/perfil/progreso"),
      apiFetch<SesionHistorial[]>("/perfil/sesiones"),
      apiFetch<EvaluacionHistorial[]>("/perfil/evaluaciones"),
      apiFetch<Documento[]>("/perfil/documentos"),
    ])
      .then(([p, prog, ses, evs, docs]) => {
        setPerfil(p);
        setProgreso(prog);
        setSesiones(ses);
        setEvaluaciones(evs);
        setDocumentos(docs);
      })
      .catch(() => setError("No se pudo cargar el perfil."))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Cargando perfil…</p>
      </div>
    );
  }

  if (error || !perfil || !progreso) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "12px" }}>
        <AlertCircle size={24} style={{ color: "var(--danger)" }} />
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{error ?? "Error al cargar"}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 48px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <p style={{
            fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em",
            color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px",
          }}>
            Mi cuenta
          </p>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text-primary)" }}>
            Perfil
          </h1>
        </div>

        {/* Datos del usuario */}
        <SeccionPerfil
          perfil={perfil}
          onNombreActualizado={(nombre) => setPerfil((p) => p ? { ...p, nombre } : p)}
        />

        <Divider />

        {/* Progreso */}
        <SeccionProgreso progreso={progreso} />

        <Divider />

        {/* Historial de sesiones */}
        <SeccionSesiones sesiones={sesiones} />

        <Divider />

        {/* Historial de evaluaciones */}
        <SeccionEvaluaciones evaluaciones={evaluaciones} />

        <Divider />

        {/* Mis documentos */}
        <SeccionDocumentos
          documentos={documentos}
          onEliminar={(id) => setDocumentos((prev) => prev.filter((d) => d.id !== id))}
        />

        <div style={{ height: "48px" }} />
      </div>
    </div>
  );
}
