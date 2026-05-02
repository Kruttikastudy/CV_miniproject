"""
FastAPI application entry point for the Object Recognition Game backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.detect import router as detect_router
from model import get_model

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Object Recognition Game API",
    description="YOLOv8-powered object & color detection backend",
    version="1.0.0",
)

# CORS — allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
app.include_router(detect_router)


@app.get("/health")
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Startup: pre-load the YOLO model so the first request isn't slow
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    print("⏳ Loading YOLOv8 model...")
    get_model()
    print("✅ Model loaded and ready!")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
