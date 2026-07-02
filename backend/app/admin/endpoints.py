from __future__ import annotations

import subprocess
import threading
from pathlib import Path

from fastapi import APIRouter, Header, HTTPException

from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["admin"])

_seed_running = False
_seed_done = False
_seed_output: list[str] = []


def _verify_secret(admin_secret: str = Header(None)) -> None:
    if not settings.admin_secret:
        raise HTTPException(503, detail="ADMIN_SECRET no está configurado en el servidor")
    if admin_secret != settings.admin_secret:
        raise HTTPException(403, detail="admin_secret inválido")


@router.post("/seed")
async def run_seed(admin_secret: str = Header(None)):
    _verify_secret(admin_secret)
    global _seed_running, _seed_done, _seed_output

    if _seed_running:
        return {"status": "already_running", "detail": "El seed ya está en ejecución"}

    def _run():
        global _seed_running, _seed_done, _seed_output
        _seed_running = True
        _seed_done = False
        _seed_output = []
        try:
            result = subprocess.run(
                ["python", "/app/scripts/seed_modulos_1_2.py"],
                cwd="/app/backend",
                capture_output=True,
                text=True,
                timeout=300,
            )
            _seed_output = (result.stdout or "").split("\n") + (result.stderr or "").split("\n")
            if result.returncode != 0:
                _seed_output.append(f"\n[ERROR] Seed falló con código {result.returncode}")
        except subprocess.TimeoutExpired:
            _seed_output.append("\n[ERROR] Seed excedió el tiempo máximo (300s)")
        except Exception as e:
            _seed_output.append(f"\n[ERROR] Excepción durante seed: {e}")
        finally:
            _seed_done = True
            _seed_running = False

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    return {"status": "started", "detail": "Seed iniciado en segundo plano. Ver logs para seguimiento."}


@router.get("/seed/status")
async def seed_status(admin_secret: str = Header(None)):
    _verify_secret(admin_secret)
    return {
        "running": _seed_running,
        "done": _seed_done,
        "output_preview": "\n".join(_seed_output[-40:]) if _seed_output else "",
    }
