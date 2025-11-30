from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from .database import engine, Base
from .routers import auth, places

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Company Info API",
    description="API for fetching and managing business data from Google Places API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(places.router)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Serve static files (frontend) if they exist
# In Docker, frontend/dist is at /app/frontend/dist
# In local dev, it's at ../../frontend/dist relative to this file
frontend_dist = os.path.join(os.path.dirname(__file__), "../../frontend/dist")
if not os.path.exists(frontend_dist):
    # Try Docker path
    frontend_dist = "/app/frontend/dist"

if os.path.exists(frontend_dist):
    # Mount static assets
    assets_path = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
    
    # Serve index.html for all non-API routes (must be last)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Don't interfere with API routes or docs
        if (full_path.startswith("api") or 
            full_path.startswith("docs") or 
            full_path.startswith("openapi.json") or 
            full_path == "health"):
            return {"error": "Not found"}
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"error": "Frontend not found"}

