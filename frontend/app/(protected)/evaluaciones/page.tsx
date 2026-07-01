"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useBreakpoint } from "@/lib/use-breakpoint";

interface Tema {
  id: string;
  nombre: string;
  descripcion: string | null;
  es_predefinido: boolean;
}

interface GenerarResponse {
  evaluacion_id: string;
  titulo: string;
  preguntas: { id: string; tipo: string; enunciado: string; opciones: string[] | null }[];
}

interface IntentoResponse {
  intento_id: string;
  evaluacion_id: string;
}

export default function EvaluacionesPage() {
  const router = useRouter();
  const { isMobile } = useBreakpoint();
  const [temas, setTemas] = useState<Tema[]>([]);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Tema[]>("/temas")
      .then(setTemas)
      .catch(() => setError("No se pudieron cargar los temas."))
      .finally(() => setCargando(false));
  }, []);

  async function handleGenerar(temaId: string) {
    if (generando) return;
    setGenerando(temaId);
    setError(null);
    try {
      const ev = await apiFetch<GenerarResponse>("/evaluaciones/generar", {
        method: "POST",
        body: JSON.stringify({ tema_id: temaId, n_preguntas: 8 }),
      });
      const intento = await apiFetch<IntentoResponse>(`/evaluaciones/${ev.evaluacion_id}/intentos`, {
        method: "POST",
      });
      // Pasar preguntas a la siguiente página sin exponerlas en la URL
      sessionStorage.setItem(`eval_preguntas_${intento.intento_id}`, JSON.stringify(ev.preguntas));
      router.push(`/evaluaciones/${intento.intento_id}`);
    } catch (err) {
      setError((err as Error).message);
      setGenerando(null);
    }
  }

  return (
    <div style={{ padding: isMobile ? "24px 16px" : "40px 48px", maxWidth: "800px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <p style={{
          fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em",
          color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px",
        }}>
          Módulo de evaluación
        </p>
        <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
          Nueva evaluación
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "480px" }}>
          Seleccioná un tema para generar una evaluación automática de 8 preguntas basadas en los documentos disponibles.
        </p>
      </div>

      {error && (
        <p style={{ fontSize: "13px", color: "var(--danger)", marginBottom: "20px" }}>{error}</p>
      )}

      {/* Aviso de carga LLM */}
      {generando && (
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "14px 16px", marginBottom: "24px",
          border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
          backgroundColor: "var(--bg-surface)",
        }}>
          <LoadingSpinner />
          <div>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "2px" }}>
              Generando evaluación…
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              El asistente está creando las preguntas. Puede tardar hasta 15 segundos.
            </p>
          </div>
        </div>
      )}

      {/* Grid de temas */}
      {cargando ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              height: "110px", borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", opacity: 0.5,
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
          {temas.map(tema => (
            <TemaCard
              key={tema.id}
              tema={tema}
              loading={generando === tema.id}
              disabled={generando !== null && generando !== tema.id}
              onClick={() => handleGenerar(tema.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TemaCard({ tema, loading, disabled, onClick }: {
  tema: Tema; loading: boolean; disabled: boolean; onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start",
        gap: "10px", padding: "20px",
        borderRadius: "var(--radius-md)",
        border: hover && !disabled && !loading ? "1px solid var(--accent)" : "1px solid var(--border)",
        backgroundColor: hover && !disabled && !loading ? "var(--bg-surface-hover)" : "var(--bg-surface)",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        textAlign: "left",
        transition: "border-color 0.15s, background-color 0.15s",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "32px", height: "32px", borderRadius: "var(--radius-sm)",
          backgroundColor: hover && !disabled ? "var(--accent-muted)" : "rgba(255,255,255,0.05)",
          color: hover && !disabled ? "var(--accent)" : "var(--text-muted)",
          transition: "background-color 0.15s, color 0.15s",
        }}>
          <ClipboardList size={16} />
        </span>
        {tema.es_predefinido && (
          <span style={{
            fontSize: "11px", fontWeight: 500, padding: "2px 7px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--accent-muted)", color: "var(--accent)",
          }}>
            Oficial
          </span>
        )}
      </div>
      <div>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "4px", lineHeight: 1.35 }}>
          {loading ? "Generando…" : tema.nombre}
        </p>
        {tema.descripcion && (
          <p style={{
            fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {tema.descripcion}
          </p>
        )}
      </div>
    </button>
  );
}

function LoadingSpinner() {
  return (
    <span style={{
      display: "inline-block", width: "16px", height: "16px", flexShrink: 0,
      border: "2px solid var(--border)", borderTopColor: "var(--accent)",
      borderRadius: "50%", animation: "spin 0.8s linear infinite",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}
