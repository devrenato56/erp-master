"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, BookOpen } from "lucide-react";
import { useBreakpoint } from "@/lib/use-breakpoint";
import { apiFetch } from "@/lib/api";

interface ModuloListItem {
  id: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  resumen_ia: string | null;
  completado: boolean;
}

export default function ModulosPage() {
  const router = useRouter();
  const { isMobile } = useBreakpoint();
  const [modulos, setModulos] = useState<ModuloListItem[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    apiFetch<ModuloListItem[]>("/modulos")
      .then(setModulos)
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const completados = modulos.filter((m) => m.completado).length;

  return (
    <div style={{ padding: isMobile ? "32px 16px" : "48px 48px", maxWidth: "860px", margin: "0 auto" }}>
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
          Curso
        </p>
        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
          Módulos
        </h1>
        {!cargando && modulos.length > 0 && (
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            {completados} de {modulos.length} completados
          </p>
        )}
      </div>

      {cargando ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ height: "80px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", opacity: 0.5 }} />
          ))}
        </div>
      ) : modulos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <BookOpen size={32} style={{ marginBottom: "12px", opacity: 0.4 }} />
          <p style={{ fontSize: "14px" }}>No hay módulos disponibles todavía.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden", backgroundColor: "var(--border)" }}>
          {modulos.map((modulo, idx) => (
            <ModuloRow
              key={modulo.id}
              modulo={modulo}
              numero={idx + 1}
              onClick={() => router.push(`/modulos/${modulo.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ModuloRow({
  modulo,
  numero,
  onClick,
}: {
  modulo: ModuloListItem;
  numero: number;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: "16px",
        padding: "18px 24px",
        backgroundColor: hover ? "var(--bg-surface-hover)" : "var(--bg-surface)",
        border: "none", cursor: "pointer", textAlign: "left", width: "100%",
        transition: "background-color 0.12s",
      }}
    >
      <div style={{ flexShrink: 0, width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {modulo.completado ? (
          <CheckCircle2 size={24} style={{ color: "var(--accent)" }} />
        ) : (
          <span style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "30px", height: "30px",
            border: "1.5px solid var(--border-strong)",
            borderRadius: "50%",
            fontSize: "13px", fontWeight: 600, color: "var(--text-muted)",
          }}>
            {numero}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "3px" }}>
          {modulo.nombre}
        </p>
        {modulo.descripcion && (
          <p style={{ fontSize: "13px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {modulo.descripcion}
          </p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        {modulo.completado && (
          <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--accent)", backgroundColor: "var(--accent-muted)", padding: "2px 8px", borderRadius: "99px" }}>
            Completado
          </span>
        )}
        <ArrowRight size={14} style={{ color: hover ? "var(--accent)" : "var(--text-muted)", transition: "color 0.12s" }} />
      </div>
    </button>
  );
}
