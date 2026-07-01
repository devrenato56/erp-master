"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ClipboardList, FileText, ArrowRight } from "lucide-react";
import { useSession } from "@/lib/supabase/session-context";
import { useBreakpoint } from "@/lib/use-breakpoint";
import { apiFetch } from "@/lib/api";

interface Progreso {
  temas_estudiados: number;
  evaluaciones_realizadas: number;
  puntaje_promedio_20: number | null;
  mejor_puntaje_20: number | null;
}

export default function DashboardPage() {
  const { user } = useSession();
  const router = useRouter();
  const { isMobile } = useBreakpoint();
  const [progreso, setProgreso] = useState<Progreso | null>(null);

  useEffect(() => {
    apiFetch<Progreso>("/perfil/progreso")
      .then(setProgreso)
      .catch(() => {});
  }, []);

  const nombre = (user?.user_metadata?.nombre as string | undefined) ?? user?.email ?? "";
  const saludo = nombre ? `Hola, ${nombre.split(" ")[0]}` : "Bienvenido";

  const acciones = [
    {
      href: "/chat",
      icon: MessageSquare,
      titulo: "Ir al chat",
      descripcion: "Consultá dudas sobre ERP con el asistente.",
    },
    {
      href: "/evaluaciones",
      icon: ClipboardList,
      titulo: "Hacer una evaluación",
      descripcion: "Ponete a prueba con preguntas generadas desde los documentos.",
    },
    {
      href: "/documentos",
      icon: FileText,
      titulo: "Mis documentos",
      descripcion: "Subí materiales propios para personalizar el asistente.",
    },
  ];

  return (
    <div style={{ padding: isMobile ? "32px 16px" : "48px 48px", maxWidth: "800px" }}>
      {/* Saludo */}
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
          Inicio
        </p>
        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
          {saludo}
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Tu asistente de capacitación en sistemas ERP.
        </p>
      </div>

      {/* Stats de progreso */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: "1px",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--border)",
          marginBottom: "36px",
          overflow: "hidden",
        }}
      >
        {[
          { label: "Temas estudiados", value: progreso?.temas_estudiados },
          { label: "Evaluaciones", value: progreso?.evaluaciones_realizadas },
          {
            label: "Puntaje promedio",
            value: progreso?.puntaje_promedio_20 != null
              ? `${progreso.puntaje_promedio_20.toFixed(1)}/20`
              : null,
          },
          {
            label: "Mejor puntaje",
            value: progreso?.mejor_puntaje_20 != null
              ? `${progreso.mejor_puntaje_20.toFixed(1)}/20`
              : null,
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{ backgroundColor: "var(--bg-surface)", padding: "20px 24px" }}
          >
            <p
              style={{
                fontSize: "22px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "4px",
                lineHeight: 1,
              }}
            >
              {progreso === null ? "—" : (value ?? "—")}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Acciones rápidas */}
      <p
        style={{
          fontSize: "11px",
          fontWeight: 500,
          letterSpacing: "0.08em",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}
      >
        ¿Qué querés hacer?
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {acciones.map(({ href, icon: Icon, titulo, descripcion }) => (
          <AccionCard
            key={href}
            icon={<Icon size={16} />}
            titulo={titulo}
            descripcion={descripcion}
            onClick={() => router.push(href)}
          />
        ))}
      </div>
    </div>
  );
}

function AccionCard({
  icon,
  titulo,
  descripcion,
  onClick,
}: {
  icon: React.ReactNode;
  titulo: string;
  descripcion: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "16px 20px",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${hover ? "var(--accent)" : "var(--border)"}`,
        backgroundColor: hover ? "var(--bg-surface-hover)" : "var(--bg-surface)",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 0.15s, background-color 0.15s",
        width: "100%",
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "34px",
          height: "34px",
          borderRadius: "var(--radius-sm)",
          backgroundColor: hover ? "var(--accent-muted)" : "rgba(255,255,255,0.05)",
          color: hover ? "var(--accent)" : "var(--text-muted)",
          flexShrink: 0,
          transition: "background-color 0.15s, color 0.15s",
        }}
      >
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "2px" }}>
          {titulo}
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{descripcion}</p>
      </div>
      <ArrowRight
        size={14}
        style={{
          color: hover ? "var(--accent)" : "var(--text-muted)",
          flexShrink: 0,
          transition: "color 0.15s",
        }}
      />
    </button>
  );
}
