from fastapi import APIRouter

from app.api.executions import router as executions_router
from app.api.pipelines import executions_router as pipeline_executions_router
from app.api.pipelines import router as pipelines_router
from app.api.providers import router as providers_router
from app.api.templates import router as templates_router

api_router = APIRouter(prefix="/api")
api_router.include_router(templates_router)
api_router.include_router(executions_router)
api_router.include_router(providers_router)
api_router.include_router(pipelines_router)
api_router.include_router(pipeline_executions_router)
