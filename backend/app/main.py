from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import time
from .database import engine, Base
from .routers import auth, places
from .logging_config import setup_logging, get_logger

# Setup logging
setup_logging()
logger = get_logger(__name__)

logger.info("Starting application...")

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified successfully")
except Exception as e:
    logger.error(f"Error creating database tables: {str(e)}", exc_info=True)
    raise

app = FastAPI(
    title="Company Info API",
    description="API for fetching and managing business data from Google Places API",
    version="1.0.0"
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url.path} - Client: {request.client.host if request.client else 'unknown'}")
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Log response
        logger.info(
            f"Response: {request.method} {request.url.path} - "
            f"Status: {response.status_code} - "
            f"Time: {process_time:.3f}s"
        )
        
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"Error processing request: {request.method} {request.url.path} - "
            f"Time: {process_time:.3f}s - "
            f"Error: {str(e)}",
            exc_info=True
        )
        raise

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("CORS middleware configured")

# Include routers
app.include_router(auth.router)
app.include_router(places.router)
logger.info("Routers registered")

@app.get("/health")
def health_check():
    logger.debug("Health check requested")
    return {"status": "healthy"}

# Serve static files (frontend) if they exist
# In Docker, frontend/dist is at /app/frontend/dist
# In local dev, it's at ../../frontend/dist relative to this file
frontend_dist = os.path.join(os.path.dirname(__file__), "../../frontend/dist")
if not os.path.exists(frontend_dist):
    # Try Docker path
    frontend_dist = "/app/frontend/dist"

if os.path.exists(frontend_dist):
    logger.info(f"Frontend found at: {frontend_dist}")
    # Mount static assets
    assets_path = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
        logger.info(f"Static assets mounted from: {assets_path}")
    
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
            logger.debug(f"Serving frontend for path: {full_path}")
            return FileResponse(index_path)
        logger.warning(f"Frontend index.html not found at: {index_path}")
        return {"error": "Frontend not found"}
else:
    logger.warning(f"Frontend not found at: {frontend_dist}")

logger.info("Application startup complete")

