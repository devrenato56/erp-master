"""
Semilla de datos para la demo — Fase 8 / Plan A y Plan B.

Crea en la base de datos (nube o local) los datos mínimos para una demo
convincente sin depender de que el jurado suba archivos en vivo:

  - 1 usuario de demo con historial pre-cargado.
  - Sesiones de chat ya creadas (historial visible en el perfil).
  - 1 evaluación completada con puntaje.

PREREQUISITOS:
  - Los 5 temas predefinidos ya existen (seed de Fase 3, `supabase db reset`
    los aplica automáticamente junto con el schema).
  - Al menos 1 documento aprobado con chunks para cada tema (seed de Fase 3).
  - Las variables de entorno correctas en `backend/.env` (plan A o plan B).

USO:
  cd backend
  python ../scripts/seed_demo.py

El script es idempotente: si el usuario de demo ya existe, actualiza su
historial en lugar de fallar.
"""

from __future__ import annotations

import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ── Agregar backend/app al path para reutilizar el cliente de Supabase ──────
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv
load_dotenv(ROOT / "backend" / ".env")

from supabase import create_client, Client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_KEY  = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SERVICE_KEY)

# ── Configuración del usuario de demo ────────────────────────────────────────

DEMO_EMAIL    = "demo@chaterp.test"
DEMO_PASSWORD = "Demo1234!"
DEMO_NOMBRE   = "Usuario Demo"

# ── Helpers ───────────────────────────────────────────────────────────────────

def now_utc(offset_hours: int = 0) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=offset_hours)).isoformat()


def get_or_create_demo_user() -> str:
    """Devuelve el UUID del usuario de demo, creándolo si no existe."""
    # Buscar en auth.users vía admin API
    users = supabase.auth.admin.list_users()
    for u in users:
        if u.email == DEMO_EMAIL:
            print(f"  Usuario de demo ya existe: {u.id}")
            return u.id

    # Crear nuevo usuario
    res = supabase.auth.admin.create_user({
        "email": DEMO_EMAIL,
        "password": DEMO_PASSWORD,
        "email_confirm": True,
        "user_metadata": {"nombre": DEMO_NOMBRE},
    })
    uid = res.user.id
    print(f"  Usuario de demo creado: {uid}")
    return uid


def get_temas() -> list[dict]:
    res = supabase.table("tema").select("id, nombre").execute()
    return res.data or []


def seed_sesiones(user_id: str, temas: list[dict]) -> None:
    """Crea 3 sesiones de chat con mensajes de ejemplo."""
    mensajes_por_tema = [
        (
            temas[0]["id"],
            [
                ("usuario",   "¿Qué es un sistema ERP y para qué sirve?"),
                ("asistente", "Un ERP (Enterprise Resource Planning) es un sistema integrado de gestión empresarial que centraliza los procesos de una organización — finanzas, logística, recursos humanos, producción y ventas — en una única plataforma. Su objetivo es eliminar los silos de información y permitir la toma de decisiones en tiempo real con datos consistentes."),
                ("usuario",   "¿Cuáles son los módulos más comunes?"),
                ("asistente", "Los módulos más comunes en un ERP son: Contabilidad y finanzas, Gestión de inventarios y almacenes (WMS), Compras y proveedores, Ventas y CRM, Recursos Humanos y nómina, y Producción o manufactura (MRP). La mayoría de los ERPs modernos como SAP, Oracle o Odoo incluyen todos estos módulos con distintos niveles de personalización."),
            ],
        ),
        (
            temas[1 % len(temas)]["id"],
            [
                ("usuario",   "¿Qué es la gestión del cambio en la implementación de un ERP?"),
                ("asistente", "La gestión del cambio es el conjunto de estrategias y acciones planificadas para facilitar la transición de los usuarios hacia el nuevo sistema ERP. Incluye comunicación clara sobre los motivos del cambio, capacitación progresiva a los distintos perfiles de usuario, identificación de agentes de cambio internos, y mecanismos de retroalimentación continua."),
                ("usuario",   "¿Por qué fallan tantas implementaciones de ERP?"),
                ("asistente", "Las principales causas de fallo son: resistencia al cambio de los usuarios, subestimación del tiempo y costo del proyecto, falta de compromiso de la alta dirección, personalización excesiva que dificulta el mantenimiento, datos maestros de mala calidad migrados al nuevo sistema, y capacitación insuficiente antes del go-live."),
            ],
        ),
        (
            temas[2 % len(temas)]["id"],
            [
                ("usuario",   "¿Cómo se mide el éxito de una implementación ERP?"),
                ("asistente", "El éxito se mide con KPIs definidos antes del proyecto: reducción del tiempo de cierre contable, disminución de errores en inventario, aumento de la tasa de cumplimiento de pedidos a tiempo (OTD), reducción de costos operativos, y adopción efectiva por parte de los usuarios (medida como porcentaje de uso del sistema vs. procesos manuales paralelos)."),
            ],
        ),
    ]

    for tema_id, mensajes in mensajes_por_tema:
        # Crear sesión
        sesion_id = str(uuid.uuid4())
        supabase.table("sesion_chat").insert({
            "id": sesion_id,
            "usuario_id": user_id,
            "tema_id": tema_id,
            "iniciada_en": now_utc(offset_hours=len(mensajes) * 2),
        }).execute()

        # Insertar mensajes
        filas = [
            {
                "sesion_id": sesion_id,
                "rol_emisor": rol,
                "contenido": contenido,
                "enviado_en": now_utc(offset_hours=len(mensajes) - i),
            }
            for i, (rol, contenido) in enumerate(mensajes)
        ]
        supabase.table("mensaje").insert(filas).execute()

    print(f"  {len(mensajes_por_tema)} sesiones de chat creadas.")


def seed_evaluacion(user_id: str, temas: list[dict]) -> None:
    """Crea 1 evaluación completada con puntaje aprobatorio."""
    tema_id = temas[0]["id"]
    tema_nombre = temas[0]["nombre"]

    # Crear evaluación
    eval_id = str(uuid.uuid4())
    supabase.table("evaluacion").insert({
        "id": eval_id,
        "tema_id": tema_id,
        "titulo": f"Evaluación — {tema_nombre}",
        "generada_en": now_utc(offset_hours=5),
    }).execute()

    # Crear preguntas de ejemplo
    preguntas = [
        {
            "id": str(uuid.uuid4()),
            "evaluacion_id": eval_id,
            "tipo": "opcion_multiple",
            "enunciado": "¿Qué significa el acrónimo ERP?",
            "opciones": ["a) Enterprise Resource Planning", "b) Extended Resource Processing", "c) Enterprise Retail Platform", "d) Electronic Resource Program"],
            "respuesta_correcta": "a) Enterprise Resource Planning",
        },
        {
            "id": str(uuid.uuid4()),
            "evaluacion_id": eval_id,
            "tipo": "verdadero_falso",
            "enunciado": "Un ERP integra los procesos de distintas áreas de la empresa en un único sistema.",
            "opciones": ["Verdadero", "Falso"],
            "respuesta_correcta": "Verdadero",
        },
        {
            "id": str(uuid.uuid4()),
            "evaluacion_id": eval_id,
            "tipo": "abierta",
            "enunciado": "Explica brevemente por qué la gestión del cambio es crítica en una implementación de ERP.",
            "opciones": None,
            "respuesta_correcta": None,
        },
    ]
    supabase.table("pregunta").insert(preguntas).execute()

    # Crear intento completado
    intento_id = str(uuid.uuid4())
    puntaje_total = round(2.0 / 3.0 + 0.8 / 3.0, 4)  # OM correcto + VF correcto + abierta parcial
    sobre_20 = round(puntaje_total * 20, 2)

    supabase.table("intento_evaluacion").insert({
        "id": intento_id,
        "usuario_id": user_id,
        "evaluacion_id": eval_id,
        "puntaje_total": puntaje_total,
        "completado_en": now_utc(offset_hours=4),
    }).execute()

    # Respuestas
    respuestas = [
        {
            "intento_id": intento_id,
            "pregunta_id": preguntas[0]["id"],
            "respuesta_dada": "a) Enterprise Resource Planning",
            "puntaje_obtenido": 1.0,
            "feedback_llm": None,
        },
        {
            "intento_id": intento_id,
            "pregunta_id": preguntas[1]["id"],
            "respuesta_dada": "Verdadero",
            "puntaje_obtenido": 1.0,
            "feedback_llm": None,
        },
        {
            "intento_id": intento_id,
            "pregunta_id": preguntas[2]["id"],
            "respuesta_dada": "La gestión del cambio es importante porque los usuarios necesitan adaptarse al nuevo sistema y sin capacitación la implementación puede fallar.",
            "puntaje_obtenido": 0.8,
            "feedback_llm": "Buena respuesta. Mencionás la capacitación como factor clave. Para completarla, podrías agregar que la resistencia al cambio es la principal causa de fallo en implementaciones ERP y que la gestión del cambio debe comenzar antes del go-live.",
        },
    ]
    supabase.table("respuesta_usuario").insert(respuestas).execute()

    print(f"  Evaluación creada: '{tema_nombre}', puntaje {sobre_20}/20 ({'aprobado' if sobre_20 >= 11 else 'desaprobado'}).")


def main() -> None:
    print("\n=== Seed de demo — ChatERP ===\n")

    temas = get_temas()
    if not temas:
        print("ERROR: No hay temas en la base de datos.")
        print("  Aplicá el schema primero: supabase db reset (plan B) o verificá que el seed de Fase 3 esté aplicado (plan A).")
        sys.exit(1)
    print(f"  {len(temas)} temas encontrados: {[t['nombre'] for t in temas]}")

    print("\n[1] Creando usuario de demo...")
    user_id = get_or_create_demo_user()

    print("\n[2] Creando sesiones de chat con historial...")
    seed_sesiones(user_id, temas)

    print("\n[3] Creando evaluación completada...")
    seed_evaluacion(user_id, temas)

    print(f"""
=== Seed completado ===

Usuario de demo:
  Email    : {DEMO_EMAIL}
  Contraseña: {DEMO_PASSWORD}

El perfil del usuario ya muestra:
  - 3 sesiones de chat en el historial
  - 1 evaluación completada

Podés iniciar sesión en http://localhost:3000 (plan B) o en la URL de
Vercel (plan A) con las credenciales anteriores para verificar.
""")


if __name__ == "__main__":
    main()
