"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, MessageSquare, ClipboardList, Loader2 } from "lucide-react";
import { useBreakpoint } from "@/lib/use-breakpoint";
import { apiFetch } from "@/lib/api";

interface SubtemaOut {
  id: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  preguntas_sugeridas: string[] | null;
}

interface ModuloBasico {
  id: string;
  nombre: string;
  subtemas: SubtemaOut[];
}

export default function SubtemaPage() {
  const router = useRouter();
  const { moduloId, subtemaId } = useParams<{ moduloId: string; subtemaId: string }>();
  const { isMobile } = useBreakpoint();
  const [subtema, setSubtema] = useState<SubtemaOut | null>(null);
  const [moduloNombre, setModuloNombre] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [iniciandoChat, setIniciandoChat] = useState(false);
  const [generandoEval, setGenerandoEval] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

  useEffect(() => {
    apiFetch<ModuloBasico>(`/modulos/${moduloId}`)
      .then((mod) => {
        setModuloNombre(mod.nombre);
        const st = mod.subtemas.find((s) => s.id === subtemaId) ?? null;
        if (!st) setError("Sub-tema no encontrado.");
        else setSubtema(st);
      })
      .catch(() => setError("No se pudo cargar el sub-tema."))
      .finally(() => setCargando(false));
  }, [moduloId, subtemaId]);

  async function iniciarChat(preguntaInicial?: string) {
    setIniciandoChat(true);
    setErrorAccion("");
    try {
      const sesion = await apiFetch<{ sesion_id: string }>("/chat/sesiones", {
        method: "POST",
        body: JSON.stringify({ tema_id: subtemaId }),
      });
      const dest = `/chat/${sesion.sesion_id}`;
      if (preguntaInicial) {
        router.push(`${dest}?q=${encodeURIComponent(preguntaInicial)}`);
      } else {
        router.push(dest);
      }
    } catch (e: unknown) {
      setErrorAccion(e instanceof Error ? e.message : "No se pudo iniciar el chat.");
      setIniciandoChat(false);
    }
  }

  async function hacerEvaluacion() {
    setGenerandoEval(true);
    setErrorAccion("");
    try {
      const ev = await apiFetch<{ evaluacion_id: string }>("/evaluaciones/generar", {
        method: "POST",
        body: JSON.stringify({ tema_id: subtemaId, n_preguntas: 5 }),
      });
      const intento = await apiFetch<{ intento_id: string }>(`/evaluaciones/${ev.evaluacion_id}/intentos`, {
        method: "POST",
      });
      router.push(`/evaluaciones/${intento.intento_id}`);
    } catch (e: unknown) {
      setErrorAccion(e instanceof Error ? e.message : "No se pudo generar la evaluación.");
      setGenerandoEval(false);
    }
  }

  if (cargando) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 size={20} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !subtema) {
    return (
      <div style={{ padding: isMobile ? "32px 16px" : "48px 48px", maxWidth: "760px", margin: "0 auto" }}>
        <p style={{ color: "var(--danger)", fontSize: "14px" }}>{error || "Sub-tema no encontrado."}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? "32px 16px" : "48px 48px", maxWidth: "760px", margin: "0 auto" }}>
      {/* Volver al módulo */}
      <button
        onClick={() => router.push(`/modulos/${moduloId}`)}
        style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: "24px", padding: 0 }}
      >
        <ArrowLeft size={14} />
        {moduloNombre || "Módulo"}
      </button>

      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
          Sub-tema
        </p>
        <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px" }}>
          {subtema.nombre}
        </h1>
        {subtema.descripcion && (
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            {subtema.descripcion}
          </p>
        )}
      </div>

      {/* Preguntas sugeridas */}
      {subtema.preguntas_sugeridas && subtema.preguntas_sugeridas.length > 0 && (
        <div style={{ marginBottom: "36px" }}>
          <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "10px" }}>
            Preguntas frecuentes — hacé clic para abrir el chat con esa pregunta
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {subtema.preguntas_sugeridas.map((pregunta, i) => (
              <ChipPregunta
                key={i}
                texto={pregunta}
                onClick={() => iniciarChat(pregunta)}
                disabled={iniciandoChat}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {errorAccion && (
        <p style={{ fontSize: "13px", color: "var(--danger)", marginBottom: "16px" }}>{errorAccion}</p>
      )}

      {/* Acciones principales */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px" }}>
        <AccionBtn
          icon={<MessageSquare size={15} />}
          label={iniciandoChat ? "Abriendo chat…" : "Iniciar chat"}
          descripcion="Chat guiado sobre este sub-tema"
          loading={iniciandoChat}
          primary
          onClick={() => iniciarChat()}
        />
        <AccionBtn
          icon={<ClipboardList size={15} />}
          label={generandoEval ? "Generando…" : "Hacer evaluación"}
          descripcion="5 preguntas sobre este sub-tema"
          loading={generandoEval}
          onClick={hacerEvaluacion}
        />
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ChipPregunta({
  texto,
  onClick,
  disabled,
}: {
  texto: string;
  onClick: () => void;
  disabled: boolean;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "6px 12px",
        borderRadius: "99px",
        border: `1px solid ${hover ? "var(--accent)" : "var(--border)"}`,
        backgroundColor: hover ? "var(--accent-muted)" : "var(--bg-surface)",
        color: hover ? "var(--accent)" : "var(--text-secondary)",
        fontSize: "13px",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "border-color 0.12s, background-color 0.12s, color 0.12s",
      }}
    >
      {texto}
    </button>
  );
}

function AccionBtn({
  icon,
  label,
  descripcion,
  loading,
  primary,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  descripcion: string;
  loading: boolean;
  primary?: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1,
        display: "flex", alignItems: "center", gap: "12px",
        padding: "16px 20px",
        borderRadius: "var(--radius-md)",
        border: primary
          ? `1px solid ${hover ? "var(--accent-hover)" : "var(--accent)"}`
          : `1px solid ${hover ? "var(--border-strong)" : "var(--border)"}`,
        backgroundColor: primary
          ? hover ? "var(--accent-muted)" : "var(--accent-muted)"
          : hover ? "var(--bg-surface-hover)" : "var(--bg-surface)",
        cursor: loading ? "default" : "pointer",
        textAlign: "left",
        opacity: loading ? 0.7 : 1,
        transition: "border-color 0.12s, background-color 0.12s",
      }}
    >
      <span style={{ color: primary ? "var(--accent)" : "var(--text-secondary)", display: "flex", flexShrink: 0 }}>
        {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : icon}
      </span>
      <div>
        <p style={{ fontSize: "14px", fontWeight: 500, color: primary ? "var(--accent)" : "var(--text-primary)", marginBottom: "2px" }}>
          {label}
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{descripcion}</p>
      </div>
    </button>
  );
}
