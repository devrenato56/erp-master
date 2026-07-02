"""
Seed de contenido educativo para los Módulos 1 y 2 del ERP-Chatbot.

Lee los archivos Markdown de contenido/modulo_1_fundamentos/ y
contenido/modulo_2_implementacion/, los fragmenta, genera embeddings
locales (all-MiniLM-L6-v2 / 384 dims) y los inserta en Supabase como
documentos aprobados y compartidos, vinculados al tema correspondiente.

PREREQUISITOS:
  - El schema de Supabase debe estar aplicado (incluyendo la columna
    storage_path NOT NULL en la tabla documento).
  - Los módulos y sub-temas deben existir en la tabla modulo/tema.
    Si no existen, el script los crea.
  - Variables de entorno en backend/.env:
      SUPABASE_URL
      SUPABASE_SERVICE_ROLE_KEY
      EMBEDDING_MODEL  (opcional, default: all-MiniLM-L6-v2)

USO:
  cd backend
  python ../scripts/seed_modulos_1_2.py

  # Con un usuario específico como propietario de los documentos:
  SEED_USER_ID=<uuid> python ../scripts/seed_modulos_1_2.py

El script es idempotente: si ya existe un documento con el mismo
storage_path para el mismo tema, lo omite y continúa.
"""

from __future__ import annotations

import os
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv
load_dotenv(ROOT / "backend" / ".env")

from supabase import create_client, Client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_KEY  = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
SEED_USER_ID = os.environ.get("SEED_USER_ID", "")

supabase: Client = create_client(SUPABASE_URL, SERVICE_KEY)

EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# ── Catálogo de contenido ─────────────────────────────────────────────────────
# Estructura: list de módulos, cada uno con su nombre, descripción y sub-temas.
# El campo "archivo" es relativo a ROOT/contenido/.

MODULOS = [
    {
        "nombre": "Fundamentos de Sistemas ERP",
        "descripcion": (
            "Introducción a los sistemas ERP: qué son, cómo evolucionaron, "
            "sus módulos principales, beneficios, riesgos y comparativa con "
            "soluciones tradicionales."
        ),
        "orden": 1,
        "subtemas": [
            {
                "nombre": "Qué es un ERP y su evolución histórica",
                "descripcion": (
                    "Definición de ERP, el problema que resuelve, y la "
                    "evolución desde los sistemas de inventario de los 60 "
                    "hasta los ERP con IA de los 2020s."
                ),
                "orden": 1,
                "archivo": "modulo_1_fundamentos/01_que_es_erp_y_evolucion.md",
            },
            {
                "nombre": "Módulos típicos de un ERP",
                "descripcion": (
                    "Descripción de los módulos estándar: Finanzas, Compras, "
                    "Inventario, Ventas, Producción, RRHH, Proyectos, CRM y BI. "
                    "Flujos de integración entre módulos."
                ),
                "orden": 2,
                "archivo": "modulo_1_fundamentos/02_modulos_tipicos.md",
            },
            {
                "nombre": "Beneficios y riesgos de adopción de un ERP",
                "descripcion": (
                    "Beneficios operativos y estratégicos de implementar un ERP. "
                    "Principales riesgos: resistencia al cambio, sobrecostos, "
                    "calidad de datos, vendor lock-in y factores de éxito."
                ),
                "orden": 3,
                "archivo": "modulo_1_fundamentos/03_beneficios_y_riesgos.md",
            },
            {
                "nombre": "ERP vs. software de gestión tradicional",
                "descripcion": (
                    "Comparativa entre ERP y sistemas en silos: integración, "
                    "fuente única de verdad, automatización, reportes en tiempo "
                    "real, control y escalabilidad."
                ),
                "orden": 4,
                "archivo": "modulo_1_fundamentos/04_erp_vs_tradicional.md",
            },
        ],
    },
    {
        "nombre": "Implementación de ERP",
        "descripcion": (
            "Metodología y prácticas para implementar un ERP con éxito: fases "
            "del proyecto, factores críticos, migración de datos y errores "
            "frecuentes a evitar."
        ),
        "orden": 2,
        "subtemas": [
            {
                "nombre": "Fases de un proyecto de implementación ERP",
                "descripcion": (
                    "Las 7 fases estándar: planificación, análisis y diseño "
                    "(Blueprint/Fit-Gap), configuración y desarrollo, pruebas, "
                    "capacitación, go-live y estabilización, y cierre."
                ),
                "orden": 1,
                "archivo": "modulo_2_implementacion/01_fases_implementacion.md",
            },
            {
                "nombre": "Factores críticos de éxito en una implementación ERP",
                "descripcion": (
                    "Los 8 factores determinantes: compromiso ejecutivo, "
                    "usuarios clave empoderados, alcance definido, calidad de "
                    "datos, gestión del cambio, metodología rigurosa, selección "
                    "del partner y soporte post-go-live."
                ),
                "orden": 2,
                "archivo": "modulo_2_implementacion/02_factores_criticos.md",
            },
            {
                "nombre": "Migración de datos en proyectos ERP",
                "descripcion": (
                    "Tipos de datos (maestros vs. transaccionales de apertura), "
                    "etapas de migración (inventario, mapeo, extracción, limpieza, "
                    "cargas de prueba, reconciliación y cutover) y herramientas."
                ),
                "orden": 3,
                "archivo": "modulo_2_implementacion/03_migracion_datos.md",
            },
            {
                "nombre": "Errores comunes en implementaciones ERP y cómo evitarlos",
                "descripcion": (
                    "Los errores más frecuentes por fase: selección incorrecta, "
                    "subestimación del esfuerzo, sobre-personalización, pruebas "
                    "insuficientes, capacitación tardía y soporte post-go-live "
                    "inadecuado."
                ),
                "orden": 4,
                "archivo": "modulo_2_implementacion/04_errores_comunes.md",
            },
        ],
    },
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def cargar_modelo_embeddings():
    """Importa sentence-transformers y retorna el modelo cargado."""
    try:
        from sentence_transformers import SentenceTransformer
        print(f"  Cargando modelo de embeddings: {EMBEDDING_MODEL} ...")
        model = SentenceTransformer(EMBEDDING_MODEL)
        print("  Modelo cargado.")
        return model
    except ImportError:
        print("ERROR: sentence-transformers no está instalado.")
        print("  Ejecutá: pip install sentence-transformers")
        sys.exit(1)


def generar_embeddings_batch(model, textos: list[str]) -> list[list[float]]:
    import numpy as np
    vectores = model.encode(textos, convert_to_numpy=True, batch_size=32, show_progress_bar=False)
    return vectores.tolist()


def fragmentar_texto(texto: str) -> list[str]:
    """Importa el chunker del backend para consistencia con el pipeline principal."""
    from app.base_conocimiento.chunking import fragmentar_texto as _fragmentar
    chunks = _fragmentar(texto)
    return [c.texto for c in chunks]


def get_or_create_seed_user() -> str:
    """
    Obtiene un usuario válido para asociar los documentos semilla.
    Prioridad: SEED_USER_ID env var → primer usuario en auth.users → error.
    """
    if SEED_USER_ID:
        print(f"  Usando SEED_USER_ID: {SEED_USER_ID}")
        return SEED_USER_ID

    users = supabase.auth.admin.list_users()
    if users:
        uid = users[0].id
        print(f"  SEED_USER_ID no definido. Usando primer usuario existente: {uid}")
        return uid

    print("ERROR: No hay usuarios en la base de datos y SEED_USER_ID no está definido.")
    print("  Creá un usuario primero o exportá SEED_USER_ID=<uuid>.")
    sys.exit(1)


def get_or_create_modulo(nombre: str, descripcion: str, orden: int) -> str:
    """Retorna el id del módulo, creándolo si no existe."""
    res = supabase.table("modulo").select("id").eq("nombre", nombre).execute()
    if res.data:
        return res.data[0]["id"]

    modulo_id = str(uuid.uuid4())
    supabase.table("modulo").insert({
        "id": modulo_id,
        "nombre": nombre,
        "descripcion": descripcion,
        "orden": orden,
    }).execute()
    print(f"    Módulo creado: '{nombre}' ({modulo_id})")
    return modulo_id


def get_or_create_tema(nombre: str, descripcion: str, orden: int, modulo_id: str) -> str:
    """Retorna el id del sub-tema, creándolo si no existe dentro del módulo."""
    res = (
        supabase.table("tema")
        .select("id")
        .eq("nombre", nombre)
        .eq("modulo_id", modulo_id)
        .execute()
    )
    if res.data:
        return res.data[0]["id"]

    tema_id = str(uuid.uuid4())
    supabase.table("tema").insert({
        "id": tema_id,
        "nombre": nombre,
        "descripcion": descripcion,
        "orden": orden,
        "modulo_id": modulo_id,
    }).execute()
    print(f"      Sub-tema creado: '{nombre}' ({tema_id})")
    return tema_id


def documento_ya_existe(storage_path: str, tema_id: str) -> bool:
    """Verifica si ya existe un documento con el mismo storage_path para el tema."""
    res = (
        supabase.table("documento")
        .select("id")
        .eq("storage_path", storage_path)
        .eq("tema_id", tema_id)
        .execute()
    )
    return bool(res.data)


def seed_subtema(
    model,
    user_id: str,
    modulo_nombre: str,
    subtema: dict,
    tema_id: str,
) -> None:
    """Procesa un sub-tema: lee el MD, fragmenta, genera embeddings e inserta."""
    archivo_rel = subtema["archivo"]
    archivo_path = ROOT / "contenido" / archivo_rel
    storage_path = f"seed/{archivo_rel}"

    if not archivo_path.exists():
        print(f"      ADVERTENCIA: archivo no encontrado: {archivo_path}")
        return

    if documento_ya_existe(storage_path, tema_id):
        print(f"      Ya existe, omitiendo: {storage_path}")
        return

    # Leer contenido
    texto = archivo_path.read_text(encoding="utf-8")
    print(f"      Leyendo: {archivo_rel} ({len(texto):,} chars)")

    # Fragmentar
    chunks_texto = fragmentar_texto(texto)
    print(f"      Fragmentos: {len(chunks_texto)}")

    # Generar embeddings en batch
    embeddings = generar_embeddings_batch(model, chunks_texto)

    # Insertar documento
    doc_id = str(uuid.uuid4())
    supabase.table("documento").insert({
        "id": doc_id,
        "usuario_id": user_id,
        "tema_id": tema_id,
        "nombre_archivo": archivo_path.name,
        "storage_path": storage_path,
        "visibilidad": "compartido",
        "estado_moderacion": "aprobado",
    }).execute()

    # Insertar chunks con embeddings
    filas_chunks = [
        {
            "documento_id": doc_id,
            "tema_id": tema_id,
            "texto": chunk_texto,
            "embedding": embedding,
            "orden": i + 1,
            "estado_moderacion": "aprobado",
        }
        for i, (chunk_texto, embedding) in enumerate(zip(chunks_texto, embeddings))
    ]

    # Insertar en lotes de 50 para evitar límites de tamaño de request
    BATCH = 50
    for start in range(0, len(filas_chunks), BATCH):
        supabase.table("chunk_documento").insert(filas_chunks[start:start + BATCH]).execute()

    print(f"      Insertado: documento {doc_id} con {len(filas_chunks)} chunks")


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    print("\n=== Seed de contenido educativo — Módulos 1 y 2 ===\n")

    # Cargar modelo de embeddings primero (tarda ~2-5s la primera vez)
    model = cargar_modelo_embeddings()

    # Obtener usuario propietario de los documentos
    print("\n[1] Resolviendo usuario propietario de documentos...")
    user_id = get_or_create_seed_user()

    total_docs = 0
    total_chunks = 0

    print("\n[2] Procesando módulos y sub-temas...\n")
    for modulo_data in MODULOS:
        print(f"  Módulo {modulo_data['orden']}: {modulo_data['nombre']}")

        modulo_id = get_or_create_modulo(
            nombre=modulo_data["nombre"],
            descripcion=modulo_data["descripcion"],
            orden=modulo_data["orden"],
        )

        for subtema_data in modulo_data["subtemas"]:
            print(f"    Sub-tema {subtema_data['orden']}: {subtema_data['nombre']}")

            tema_id = get_or_create_tema(
                nombre=subtema_data["nombre"],
                descripcion=subtema_data["descripcion"],
                orden=subtema_data["orden"],
                modulo_id=modulo_id,
            )

            seed_subtema(
                model=model,
                user_id=user_id,
                modulo_nombre=modulo_data["nombre"],
                subtema=subtema_data,
                tema_id=tema_id,
            )
            total_docs += 1

        print()

    print(f"\n=== Seed completado ===")
    print(f"  Módulos procesados : {len(MODULOS)}")
    print(f"  Sub-temas procesados: {total_docs}")
    print()
    print("Próximos pasos sugeridos:")
    print("  1. Generar resúmenes de módulo:")
    print("     POST /modulos/{modulo_id}/resumen  (requiere servidor en ejecución)")
    print("  2. Generar preguntas sugeridas por sub-tema vía el LLM")
    print("  3. Verificar en el frontend que los módulos aparecen en /modulos")
    print()


if __name__ == "__main__":
    main()
