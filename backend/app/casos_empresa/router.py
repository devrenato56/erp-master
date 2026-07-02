from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.auth import get_current_user_id
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/casos-empresa", tags=["casos-empresa"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CrearCasoRequest(BaseModel):
    nombre: str
    descripcion: str | None = None
    modulo_id: str | None = None
    documento_id: str | None = None


class CasoOut(BaseModel):
    id: str
    nombre: str
    descripcion: str | None
    modulo_id: str | None
    documento_id: str | None
    creado_en: str


# ---------------------------------------------------------------------------
# POST /casos-empresa — crear un caso de empresa
# ---------------------------------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED, response_model=CasoOut)
async def crear_caso(
    body: CrearCasoRequest,
    user_id: str = Depends(get_current_user_id),
):
    if not body.nombre.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "El nombre no puede estar vacío.")

    if body.modulo_id:
        mod_resp = (
            supabase.table("modulo")
            .select("id")
            .eq("id", body.modulo_id)
            .single()
            .execute()
        )
        if not mod_resp.data:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "El módulo indicado no existe.")

    if body.documento_id:
        doc_resp = (
            supabase.table("documento")
            .select("id, usuario_id")
            .eq("id", body.documento_id)
            .single()
            .execute()
        )
        if not doc_resp.data:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "El documento indicado no existe.")
        if doc_resp.data["usuario_id"] != user_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tenés acceso a ese documento.")

    resp = supabase.table("caso_empresa").insert({
        "usuario_id": user_id,
        "nombre": body.nombre.strip(),
        "descripcion": body.descripcion,
        "modulo_id": body.modulo_id,
        "documento_id": body.documento_id,
    }).execute()

    caso = resp.data[0]
    logger.info("[CASOS] Caso %s creado por user %s", caso["id"], user_id)
    return CasoOut(
        id=caso["id"],
        nombre=caso["nombre"],
        descripcion=caso["descripcion"],
        modulo_id=caso["modulo_id"],
        documento_id=caso["documento_id"],
        creado_en=caso["creado_en"],
    )


# ---------------------------------------------------------------------------
# GET /casos-empresa — lista los casos del usuario
# ---------------------------------------------------------------------------

@router.get("", response_model=list[CasoOut])
async def listar_casos(user_id: str = Depends(get_current_user_id)):
    resp = (
        supabase.table("caso_empresa")
        .select("id, nombre, descripcion, modulo_id, documento_id, creado_en")
        .eq("usuario_id", user_id)
        .order("creado_en", desc=True)
        .execute()
    )
    return [
        CasoOut(
            id=c["id"],
            nombre=c["nombre"],
            descripcion=c["descripcion"],
            modulo_id=c["modulo_id"],
            documento_id=c["documento_id"],
            creado_en=c["creado_en"],
        )
        for c in (resp.data or [])
    ]


# ---------------------------------------------------------------------------
# GET /casos-empresa/{caso_id} — detalle de un caso
# ---------------------------------------------------------------------------

@router.get("/{caso_id}", response_model=CasoOut)
async def obtener_caso(
    caso_id: str,
    user_id: str = Depends(get_current_user_id),
):
    resp = (
        supabase.table("caso_empresa")
        .select("id, nombre, descripcion, modulo_id, documento_id, creado_en, usuario_id")
        .eq("id", caso_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Caso de empresa no encontrado.")
    if resp.data["usuario_id"] != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No tenés acceso a este caso.")

    c = resp.data
    return CasoOut(
        id=c["id"],
        nombre=c["nombre"],
        descripcion=c["descripcion"],
        modulo_id=c["modulo_id"],
        documento_id=c["documento_id"],
        creado_en=c["creado_en"],
    )


# ---------------------------------------------------------------------------
# DELETE /casos-empresa/{caso_id} — eliminar un caso
# ---------------------------------------------------------------------------

@router.delete("/{caso_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_caso(
    caso_id: str,
    user_id: str = Depends(get_current_user_id),
):
    resp = (
        supabase.table("caso_empresa")
        .select("id, usuario_id")
        .eq("id", caso_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Caso de empresa no encontrado.")
    if resp.data["usuario_id"] != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No tenés acceso a este caso.")

    supabase.table("caso_empresa").delete().eq("id", caso_id).execute()
    logger.info("[CASOS] Caso %s eliminado por user %s", caso_id, user_id)
