"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Building2, MessageSquare } from "lucide-react";
import { useSession } from "@/lib/supabase/session-context";
import { useBreakpoint } from "@/lib/use-breakpoint";
import { apiFetch } from "@/lib/api";

interface Progreso {
  temas_estudiados: number;
  evaluaciones_realizadas: number;
  puntaje_promedio_20: number | null;
  mejor_puntaje_20: number | null;
}

interface ModuloListItem {
  id: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  resumen_ia: string | null;
  completado: boolean;
}

export default function DashboardPage() {
  const { user } = useSession();
  const router = useRouter();
  const { isMobile } = useBreakpoint();
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [modulos, setModulos] = useState<ModuloListItem[]>([]);
  const [cargandoModulos, setCargandoModulos] = useState(true);

  useEffect(() => {
    apiFetch<Progreso>("/perfil/progreso").then(setProgreso).catch(() => {});
    apiFetch<ModuloListItem[]>("/modulos")
      .then(setModulos)
      .catch(() => {})
      .finally(() => setCargandoModulos(false));
  }, []);

  const nombre = (user?.user_metadata?.nombre as string | undefined) ?? user?.email ?? "";
  const saludo = nombre ? `Hola, ${nombre.split(" ")[0]}` : "Bienvenido";
  const modulosCompletados = modulos.filter((m) => m.completado).length;

  return (
    <div style={{ padding: isMobile ? "32px 16px" : "48px 48px", maxWidth: "860px", margin: "0 auto" }}>
      {/* Saludo */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
          Inicio
        </p>
        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
          {saludo}
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Tu plataforma de capacitación en sistemas ERP.
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: "1px",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--border)",
        marginBottom: "40px",
        overflow: "hidden",
      }}>
        {[
          { label: "Módulos completados", value: modulos.length ? `${modulosCompletados}/${modulos.length}` : "—" },
          { label: "Evaluaciones", value: progreso?.evaluaciones_realizadas },
          { label: "Puntaje promedio", value: progreso?.puntaje_promedio_20 != null ? `${progreso.puntaje_promedio_20.toFixed(1)}/20` : null },
          { label: "Mejor puntaje", value: progreso?.mejor_puntaje_20 != null ? `${progreso.mejor_puntaje_20.toFixed(1)}/20` : null },
        ].map(({ label, value }) => (
          <div key={label} style={{ backgroundColor: "var(--bg-surface)", padding: "20px 24px" }}>
            <p style={{ fontSize: "22px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px", lineHeight: 1 }}>
              {progreso === null && label !== "Módulos completados" ? "—" : (value ?? "—")}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Ruta de aprendizaje */}
      <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "16px" }}>
        Tu ruta de aprendizaje
      </p>

      {cargandoModulos ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: "72px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", opacity: 0.5 }} />
          ))}
        </div>
      ) : modulos.length === 0 ? (
        <p style={{ fontSize: "14px", color: "var(--text-muted)", padding: "24px 0" }}>
          No hay módulos disponibles todavía.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden", backgroundColor: "var(--border)" }}>
          {modulos.map((modulo, idx) => (
            <ModuloCard
              key={modulo.id}
              modulo={modulo}
              numero={idx + 1}
              onClick={() => router.push(`/modulos/${modulo.id}`)}
            />
          ))}
        </div>
      )}

      {/* Accesos rápidos */}
      <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "12px", marginTop: "40px" }}>
        Accesos rápidos
      </p>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "8px" }}>
        <AccionCard
          icon={<Building2 size={15} />}
          titulo="Mi empresa"
          descripcion="Analizá un caso de empresa real con el asistente."
          onClick={() => router.push("/empresa")}
        />
        <AccionCard
          icon={<MessageSquare size={15} />}
          titulo="Chat general"
          descripcion="Preguntás sobre ERP sin asociarlo a un módulo."
          onClick={() => router.push("/chat")}
        />
      </div>
    </div>
  );
}

function ModuloCard({
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
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "16px 20px",
        backgroundColor: hover ? "var(--bg-surface-hover)" : "var(--bg-surface)",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "background-color 0.12s",
      }}
    >
      {/* Número / estado */}
      <div style={{ flexShrink: 0, width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {modulo.completado ? (
          <CheckCircle2 size={22} style={{ color: "var(--accent)" }} />
        ) : (
          <span style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "26px", height: "26px",
            border: "1.5px solid var(--border-strong)",
            borderRadius: "50%",
            fontSize: "12px", fontWeight: 600, color: "var(--text-muted)",
          }}>
            {numero}
          </span>
        )}
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "2px" }}>
          {modulo.nombre}
        </p>
        {modulo.descripcion && (
          <p style={{ fontSize: "13px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {modulo.descripcion}
          </p>
        )}
      </div>

      {/* Estado badge + flecha */}
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

function AccionCard({ icon, titulo, descripcion, onClick }: { icon: React.ReactNode; titulo: string; descripcion: string; onClick: () => void }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1,
        display: "flex", alignItems: "center", gap: "12px",
        padding: "14px 16px",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${hover ? "var(--accent)" : "var(--border)"}`,
        backgroundColor: hover ? "var(--bg-surface-hover)" : "var(--bg-surface)",
        cursor: "pointer", textAlign: "left",
        transition: "border-color 0.15s, background-color 0.15s",
      }}
    >
      <span style={{ color: hover ? "var(--accent)" : "var(--text-muted)", display: "flex", flexShrink: 0, transition: "color 0.15s" }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "1px" }}>{titulo}</p>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{descripcion}</p>
      </div>
    </button>
  );
}
