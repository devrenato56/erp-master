"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface RespuestaCalificada {
  pregunta_id: string;
  tipo: string;
  enunciado: string;
  respuesta_dada: string | null;
  puntaje_obtenido: number;
  feedback_llm: string | null;
}

interface ResultadoIntento {
  intento_id: string;
  evaluacion_id: string;
  puntaje_total: number | null;
  sobre_20: number | null;
  aprobado: boolean | null;
  completado_en: string | null;
  respuestas: RespuestaCalificada[];
}

export default function ResultadosPage({
  params,
}: {
  params: Promise<{ intentoId: string }>;
}) {
  const { intentoId } = use(params);
  const router = useRouter();

  const [resultado, setResultado] = useState<ResultadoIntento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ResultadoIntento>(`/evaluaciones/intentos/${intentoId}`)
      .then(setResultado)
      .catch(() => setError("No se pudo cargar el resultado."))
      .finally(() => setCargando(false));
  }, [intentoId]);

  if (cargando) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Cargando resultados…</p>
      </div>
    );
  }

  if (error || !resultado) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "12px" }}>
        <AlertCircle size={24} style={{ color: "var(--danger)" }} />
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{error ?? "Error al cargar"}</p>
        <button onClick={() => router.push("/evaluaciones")}
          style={{ fontSize: "13px", color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
          Volver a evaluaciones
        </button>
      </div>
    );
  }

  const { sobre_20, aprobado, respuestas } = resultado;
  const totalPreguntas = respuestas.length;
  const correctas = respuestas.filter((r) => r.puntaje_obtenido >= 0.9).length;

  return (
    <div style={{ padding: "40px 48px" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        {/* Navegación */}
        <button
          onClick={() => router.push("/evaluaciones")}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            fontSize: "13px", color: "var(--text-secondary)",
            background: "none", border: "none", cursor: "pointer", marginBottom: "32px",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
        >
          <ArrowLeft size={14} /> Nueva evaluación
        </button>

        {/* Tarjeta de puntaje principal — estilo hackO.dev */}
        <div style={{
          border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
          backgroundColor: "var(--bg-surface)",
          marginBottom: "32px", overflow: "hidden",
        }}>
          {/* Barra superior de color según resultado */}
          <div style={{
            height: "3px",
            backgroundColor: aprobado ? "var(--accent)" : "var(--danger)",
          }} />

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
            gap: "0",
          }}>
            {/* Puntaje */}
            <div style={{ padding: "28px 32px" }}>
              <p style={{
                fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em",
                color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px",
              }}>
                Puntaje
              </p>
              <p style={{
                fontSize: "42px", fontWeight: 700, lineHeight: 1,
                color: aprobado ? "var(--accent)" : "var(--danger)",
                marginBottom: "4px",
              }}>
                {sobre_20?.toFixed(2) ?? "—"}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>de 20</p>
            </div>

            <div style={{ backgroundColor: "var(--border)" }} />

            {/* Estado */}
            <div style={{ padding: "28px 32px" }}>
              <p style={{
                fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em",
                color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px",
              }}>
                Estado
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {aprobado
                  ? <CheckCircle size={20} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  : <XCircle size={20} style={{ color: "var(--danger)", flexShrink: 0 }} />
                }
                <p style={{
                  fontSize: "18px", fontWeight: 600,
                  color: aprobado ? "var(--accent)" : "var(--danger)",
                }}>
                  {aprobado ? "Aprobado" : "Desaprobado"}
                </p>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Umbral: 11/20
              </p>
            </div>

            <div style={{ backgroundColor: "var(--border)" }} />

            {/* Preguntas */}
            <div style={{ padding: "28px 32px" }}>
              <p style={{
                fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em",
                color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px",
              }}>
                Preguntas
              </p>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, marginBottom: "4px" }}>
                {correctas}/{totalPreguntas}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>correctas o completas</p>
            </div>
          </div>
        </div>

        {/* Detalle por pregunta */}
        <p style={{
          fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em",
          color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "16px",
        }}>
          Detalle de respuestas
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {respuestas.map((r, i) => (
            <RespuestaCard key={r.pregunta_id} respuesta={r} numero={i + 1} />
          ))}
        </div>

        {/* CTA para nueva evaluación */}
        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <button
            onClick={() => router.push("/evaluaciones")}
            style={{
              padding: "10px 24px", borderRadius: "var(--radius-sm)", border: "none",
              backgroundColor: "var(--accent)", color: "var(--bg-base)",
              fontSize: "14px", fontWeight: 500, cursor: "pointer",
            }}
          >
            Nueva evaluación
          </button>
        </div>

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tarjeta de respuesta individual
// ---------------------------------------------------------------------------

function RespuestaCard({ respuesta, numero }: { respuesta: RespuestaCalificada; numero: number }) {
  const puntaje = respuesta.puntaje_obtenido;
  const esAbierta = respuesta.tipo === "abierta";

  // Determinar estado visual
  const esCorrecta = esAbierta ? puntaje >= 0.6 : puntaje >= 0.9;
  const esParcial  = esAbierta && puntaje >= 0.3 && puntaje < 0.6;
  const esError    = puntaje < (esAbierta ? 0.3 : 0.9);

  const colorBorde = esCorrecta ? "var(--accent)" : esParcial ? "var(--border-strong)" : "rgba(239,68,68,0.3)";
  const colorIcono = esCorrecta ? "var(--accent)" : "var(--danger)";

  return (
    <div style={{
      border: `1px solid ${colorBorde}`,
      borderRadius: "var(--radius-md)",
      backgroundColor: "var(--bg-surface)",
      padding: "18px 20px",
    }}>
      {/* Header: número + tipo + ícono resultado */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            fontSize: "11px", fontWeight: 600, color: "var(--text-muted)",
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            {numero}.
          </span>
          <span style={{
            fontSize: "11px", fontWeight: 500, padding: "2px 7px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "rgba(255,255,255,0.05)", color: "var(--text-muted)",
          }}>
            {respuesta.tipo === "opcion_multiple" ? "Opción múltiple"
              : respuesta.tipo === "verdadero_falso" ? "V/F"
              : "Abierta"}
          </span>
          {esAbierta && (
            <span style={{
              fontSize: "11px", fontWeight: 500, padding: "2px 7px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: esCorrecta ? "var(--accent-muted)" : esParcial ? "rgba(255,255,255,0.06)" : "rgba(239,68,68,0.08)",
              color: esCorrecta ? "var(--accent)" : esParcial ? "var(--text-secondary)" : "var(--danger)",
            }}>
              {(puntaje * 20).toFixed(1)}/20
            </span>
          )}
        </div>
        {!esParcial && (
          esCorrecta
            ? <CheckCircle size={16} style={{ color: colorIcono, flexShrink: 0 }} />
            : <XCircle size={16} style={{ color: colorIcono, flexShrink: 0 }} />
        )}
      </div>

      {/* Enunciado */}
      <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.5, marginBottom: "10px" }}>
        {respuesta.enunciado}
      </p>

      {/* Respuesta dada */}
      <div style={{
        padding: "8px 12px", borderRadius: "var(--radius-sm)",
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "1px solid var(--border)",
        marginBottom: respuesta.feedback_llm ? "10px" : "0",
      }}>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "2px" }}>Tu respuesta</p>
        <p style={{ fontSize: "13px", color: respuesta.respuesta_dada ? "var(--text-primary)" : "var(--text-muted)", fontStyle: respuesta.respuesta_dada ? "normal" : "italic" }}>
          {respuesta.respuesta_dada ?? "Sin respuesta"}
        </p>
      </div>

      {/* Feedback LLM para abiertas */}
      {respuesta.feedback_llm && (
        <div style={{
          padding: "10px 12px", borderRadius: "var(--radius-sm)",
          backgroundColor: esCorrecta ? "var(--accent-muted)" : esParcial ? "rgba(255,255,255,0.03)" : "rgba(239,68,68,0.06)",
          borderLeft: `3px solid ${esCorrecta ? "var(--accent)" : esParcial ? "var(--border-strong)" : "var(--danger)"}`,
        }}>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 500 }}>
            Feedback
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {respuesta.feedback_llm}
          </p>
        </div>
      )}
    </div>
  );
}
