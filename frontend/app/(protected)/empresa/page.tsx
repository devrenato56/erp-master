"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, MessageSquare, Trash2, X, Loader2 } from "lucide-react";
import { useBreakpoint } from "@/lib/use-breakpoint";
import { apiFetch } from "@/lib/api";

interface CasoOut {
  id: string;
  nombre: string;
  descripcion: string | null;
  modulo_id: string | null;
  documento_id: string | null;
  creado_en: string;
}

interface ModalConfirm {
  casoId: string;
  casoNombre: string;
}

export default function EmpresaPage() {
  const router = useRouter();
  const { isMobile } = useBreakpoint();
  const [casos, setCasos] = useState<CasoOut[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEliminar, setModalEliminar] = useState<ModalConfirm | null>(null);

  useEffect(() => {
    cargarCasos();
  }, []);

  function cargarCasos() {
    setCargando(true);
    apiFetch<CasoOut[]>("/casos-empresa")
      .then(setCasos)
      .catch(() => {})
      .finally(() => setCargando(false));
  }

  async function chatearCaso(caso: CasoOut) {
    try {
      const sesion = await apiFetch<{ sesion_id: string }>("/chat/sesiones", {
        method: "POST",
        body: JSON.stringify({ caso_empresa_id: caso.id }),
      });
      router.push(`/chat/${sesion.sesion_id}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "No se pudo iniciar el chat.");
    }
  }

  async function eliminarCaso(casoId: string) {
    await apiFetch(`/casos-empresa/${casoId}`, { method: "DELETE" });
    setCasos((prev) => prev.filter((c) => c.id !== casoId));
    setModalEliminar(null);
  }

  return (
    <div style={{ padding: isMobile ? "32px 16px" : "48px 48px", maxWidth: "860px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
            Análisis
          </p>
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
            Mi empresa
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Subí documentación de un ERP real o hipotético y chateá con el asistente sobre ese caso específico.
          </p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "9px 16px", borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--accent)", color: "#000",
            border: "none", cursor: "pointer",
            fontSize: "13px", fontWeight: 500, flexShrink: 0,
          }}
        >
          <Plus size={14} />
          Nuevo caso
        </button>
      </div>

      {/* Lista de casos */}
      {cargando ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ height: "90px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", opacity: 0.5 }} />
          ))}
        </div>
      ) : casos.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)" }}>
          <Building2 size={32} style={{ color: "var(--text-muted)", marginBottom: "12px", opacity: 0.4 }} />
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "4px" }}>Todavía no tenés casos de empresa</p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", opacity: 0.7 }}>
            Creá uno para analizar un ERP específico con el asistente.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {casos.map((caso) => (
            <CasoCard
              key={caso.id}
              caso={caso}
              onChatear={() => chatearCaso(caso)}
              onEliminar={() => setModalEliminar({ casoId: caso.id, casoNombre: caso.nombre })}
            />
          ))}
        </div>
      )}

      {/* Modal — Nuevo caso */}
      {modalNuevo && (
        <NuevoCasoModal
          onClose={() => setModalNuevo(false)}
          onCreado={() => { setModalNuevo(false); cargarCasos(); }}
        />
      )}

      {/* Modal — Confirmar eliminación */}
      {modalEliminar && (
        <ConfirmModal
          mensaje={`¿Eliminar el caso "${modalEliminar.casoNombre}"? Esta acción no se puede deshacer.`}
          labelConfirmar="Eliminar"
          danger
          onConfirmar={() => eliminarCaso(modalEliminar.casoId)}
          onCancelar={() => setModalEliminar(null)}
        />
      )}
    </div>
  );
}

function CasoCard({
  caso,
  onChatear,
  onEliminar,
}: {
  caso: CasoOut;
  onChatear: () => void;
  onEliminar: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: "16px",
        padding: "16px 20px",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${hover ? "var(--border-strong)" : "var(--border)"}`,
        backgroundColor: hover ? "var(--bg-surface-hover)" : "var(--bg-surface)",
        transition: "border-color 0.12s, background-color 0.12s",
      }}
    >
      <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--accent-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Building2 size={16} style={{ color: "var(--accent)" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "2px" }}>{caso.nombre}</p>
        {caso.descripcion && (
          <p style={{ fontSize: "13px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {caso.descripcion}
          </p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <button
          onClick={onChatear}
          title="Chatear sobre este caso"
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "7px 12px", borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--accent)", color: "#000",
            border: "none", cursor: "pointer",
            fontSize: "12px", fontWeight: 500,
          }}
        >
          <MessageSquare size={12} />
          Chatear
        </button>
        <button
          onClick={onEliminar}
          title="Eliminar caso"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "30px", height: "30px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            backgroundColor: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function NuevoCasoModal({
  onClose,
  onCreado,
}: {
  onClose: () => void;
  onCreado: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar() {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setGuardando(true);
    setError("");
    try {
      await apiFetch("/casos-empresa", {
        method: "POST",
        body: JSON.stringify({ nombre: nombre.trim(), descripcion: descripcion.trim() || null }),
      });
      onCreado();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo crear el caso.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)" }} />
      <div style={{
        position: "relative", zIndex: 1,
        width: "min(480px, 90vw)",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            Nuevo caso de empresa
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <label>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Nombre *</p>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. ERP de Restaurante La Fonda"
              style={{
                width: "100%", padding: "8px 12px", boxSizing: "border-box",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-base)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </label>

          <label>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Descripción (opcional)</p>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Contexto sobre la empresa y el ERP que usan…"
              rows={3}
              style={{
                width: "100%", padding: "8px 12px", boxSizing: "border-box",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-base)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </label>

          <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Podés adjuntar documentos del caso desde la sección <strong style={{ color: "var(--text-secondary)" }}>Documentos</strong> después de crear el caso.
          </p>

          {error && <p style={{ fontSize: "13px", color: "var(--danger)" }}>{error}</p>}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "24px" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "13px", cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 16px", borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--accent)", color: "#000",
              border: "none", cursor: guardando ? "default" : "pointer",
              fontSize: "13px", fontWeight: 500, opacity: guardando ? 0.7 : 1,
            }}
          >
            {guardando && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
            Crear caso
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ConfirmModal({
  mensaje,
  labelConfirmar,
  danger,
  onConfirmar,
  onCancelar,
}: {
  mensaje: string;
  labelConfirmar: string;
  danger?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onCancelar} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)" }} />
      <div style={{
        position: "relative", zIndex: 1,
        width: "min(400px, 90vw)",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "24px",
      }}>
        <p style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6, marginBottom: "24px" }}>{mensaje}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button
            onClick={onCancelar}
            style={{ padding: "8px 16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "13px", cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            style={{
              padding: "8px 16px", borderRadius: "var(--radius-sm)",
              backgroundColor: danger ? "var(--danger)" : "var(--accent)",
              color: danger ? "#fff" : "#000",
              border: "none", cursor: "pointer",
              fontSize: "13px", fontWeight: 500,
            }}
          >
            {labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
