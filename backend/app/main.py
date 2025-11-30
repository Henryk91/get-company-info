from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

@app.get("/")
def root():
    return {"message": "Company Info API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

