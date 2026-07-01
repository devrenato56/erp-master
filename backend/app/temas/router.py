from fastapi import APIRouter, Depends
from app.core.auth import get_current_user_id
from app.core.supabase_client import supabase

router = APIRouter(prefix="/temas", tags=["temas"])


@router.get("")
async def listar_temas(user_id: str = Depends(get_current_user_id)):
    resp = (
        supabase.table("tema")
        .select("id, nombre, descripcion, es_predefinido")
        .order("nombre")
        .execute()
    )
    return resp.data
