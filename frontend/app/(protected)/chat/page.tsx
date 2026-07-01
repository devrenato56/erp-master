"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useBreakpoint } from "@/lib/use-breakpoint";

interface Tema {
  id: string;
  nombre: string;
  descripcion: string | null;
  es_predefinido: boolean;
}

interface SesionResponse {
  sesion_id: string;
  tema_id: string;
  iniciada_en: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { isMobile } = useBreakpoint();
  const [temas, setTemas] = useState<Tema[]>([]);
  const [cargando, setCargando] = useState(true);
  const [iniciando, setIniciando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Tema[]>("/temas")
      .then(setTemas)
      .catch(() => setError("No se pudieron cargar los temas. Verificá tu conexión."))
      .finally(() => setCargando(false));
  }, []);

  async function handleSeleccionarTema(temaId: string) {
    if (iniciando) return;
    setIniciando(temaId);
    setError(null);
    try {
      const sesion = await apiFetch<SesionResponse>("/chat/sesiones", {
        method: "POST",
        body: JSON.stringify({ tema_id: temaId }),
      });
      router.push(`/chat/${sesion.sesion_id}`);
    } catch (err) {
      setError((err as Error).message);
      setIniciando(null);
    }
  }

  return (
    <div style={{ padding: isMobile ? "24px 16px" : "40px 48px", maxWidth: "800px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
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
          Asistente de ERP
        </p>
        <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
          Seleccioná un tema
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "480px" }}>
          El asistente responderá únicamente con documentos del tema que elijas. Podés cambiar de tema iniciando una nueva sesión.
        </p>
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: "13px", color: "var(--danger)", marginBottom: "20px" }}>{error}</p>
      )}

      {/* Cards de temas */}
      {cargando ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: "120px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border)",
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
          {temas.map((tema) => (
            <TemaCard
              key={tema.id}
              tema={tema}
              loading={iniciando === tema.id}
              disabled={iniciando !== null && iniciando !== tema.id}
              onClick={() => handleSeleccionarTema(tema.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TemaCard({
  tema,
  loading,
  disabled,
  onClick,
}: {
  tema: Tema;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "10px",
        padding: "20px",
        borderRadius: "var(--radius-md)",
        border: hover && !disabled && !loading
          ? "1px solid var(--accent)"
          : "1px solid var(--border)",
        backgroundColor: hover && !disabled && !loading
          ? "var(--bg-surface-hover)"
          : "var(--bg-surface)",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        textAlign: "left",
        transition: "border-color 0.15s, background-color 0.15s",
        width: "100%",
      }}
    >
      {/* Ícono + badge predefinido */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: hover && !disabled ? "var(--accent-muted)" : "rgba(255,255,255,0.05)",
            color: hover && !disabled ? "var(--accent)" : "var(--text-muted)",
            transition: "background-color 0.15s, color 0.15s",
          }}
        >
          <BookOpen size={16} />
        </span>
        {tema.es_predefinido && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              padding: "2px 7px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--accent-muted)",
              color: "var(--accent)",
              letterSpacing: "0.02em",
            }}
          >
            Oficial
          </span>
        )}
      </div>

      {/* Nombre */}
      <div>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-primary)",
            marginBottom: "4px",
            lineHeight: 1.35,
          }}
        >
          {loading ? "Iniciando..." : tema.nombre}
        </p>
        {tema.descripcion && (
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {tema.descripcion}
          </p>
        )}
      </div>
    </button>
  );
}
