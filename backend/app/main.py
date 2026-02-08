from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.database import engine
from app.models import Base


@asynccontextmanager
async def lifespan(_application: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


def create_app() -> FastAPI:
    application = FastAPI(title="LLM Prompt Lab", lifespan=lifespan)
    _configure_cors(application)
    _register_routes(application)
    return application


def _configure_cors(application: FastAPI) -> None:
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def _register_routes(application: FastAPI) -> None:
    @application.get("/health")
    def health_check():
        return {"status": "healthy"}

    application.include_router(api_router)


app = create_app()
