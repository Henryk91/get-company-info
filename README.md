# Company Info Finder

A full-stack application for fetching and managing business data from Google Places API. Built with FastAPI (backend) and React (frontend), featuring JWT authentication, database persistence, and interactive maps.

## Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 🗺️ **Google Places Integration** - Text Search and Place Details API
- 💾 **Database Persistence** - PostgreSQL or SQLite support
- 📊 **Data Visualization** - Interactive table with CSV export
- 🗺️ **Map Display** - OpenStreetMap integration showing business locations
- 🔄 **Data Refresh** - Update stale data with refresh functionality
- ⚡ **API Usage Control** - Limit Place Details API calls to manage costs
- 🐳 **Docker Support** - Easy deployment with Docker Compose

## Project Structure

```
get-company-info/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py       # FastAPI application
│   │   ├── models.py     # Database models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── database.py   # Database configuration
│   │   ├── auth.py       # JWT authentication
│   │   ├── google_places.py  # Google Places API integration
│   │   └── routers/      # API routes
│   ├── requirements.txt  # Python dependencies
│   ├── Dockerfile        # Backend Docker image
│   └── .env.example      # Backend environment template
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API service layer
│   │   └── App.jsx       # Main application
│   ├── package.json      # Node dependencies
│   ├── Dockerfile        # Production frontend image
│   └── Dockerfile.dev    # Development frontend image
├── docker-compose.yml    # Local development setup
├── docker-compose.prod.yml  # Production setup
├── setup.sh              # Setup script
├── run.sh                # Local run script
└── README.md             # This file
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker and Docker Compose (optional, for containerized deployment)
- Google Places API key ([Get one here](https://developers.google.com/maps/documentation/places/web-service/get-api-key))

## Quick Start

### Option 1: Using Docker (Recommended)

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd get-company-info
   cp .env.example .env
   ```

2. **Edit `.env` file:**
   ```env
   GOOGLE_PLACES_API_KEY=your-api-key-here
   SECRET_KEY=your-secret-key-min-32-chars
   DB_TYPE=postgres
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=company_info
   ```

3. **Run with Docker:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Option 2: Local Development

1. **Run setup script:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Edit `.env` file** (same as above)

3. **Run the application:**
   ```bash
   chmod +x run.sh
   ./run.sh
   ```

   Or manually:
   ```bash
   # Terminal 1 - Backend
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Configuration

### Environment Variables

#### Backend (.env or backend/.env)

- `DB_TYPE`: Database type - `postgres` or `sqlite` (default: `sqlite`)
- `DATABASE_URL`: Database connection string
  - PostgreSQL: `postgresql://user:password@host:port/dbname`
  - SQLite: `sqlite:///./company_info.db`
- `SECRET_KEY`: JWT secret key (minimum 32 characters)
- `GOOGLE_PLACES_API_KEY`: Your Google Places API key

#### Frontend

- `VITE_API_URL`: Backend API URL (default: `http://localhost:8000`)

### Database Configuration

#### Using SQLite (Default)
```env
DB_TYPE=sqlite
DATABASE_URL=sqlite:///./company_info.db
```

#### Using PostgreSQL
```env
DB_TYPE=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/company_info
```

## Usage

### 1. Register/Login

- First time users need to register with username, email, and password
- Existing users can login with username and password
- JWT tokens are stored in browser localStorage

### 2. Search for Places

1. Enter a **city** (e.g., "New York")
2. Enter a **business category** (e.g., "restaurants", "hotels", "coffee shops")
3. Optionally set **Max Place Details** to limit API calls
4. Click "Search Places"

The system will:
- Check if this search combination already exists
- If exists, return cached data
- If new, fetch from Google Places API and save to database

### 3. View Results

- **Map View**: Interactive OpenStreetMap showing all business locations
- **Table View**: Detailed information about each business
- **CSV Export**: Download results as CSV file

### 4. Refresh Data

To update stale data:
1. Check "Refresh Text Search" to re-fetch places
2. Check "Refresh Place Details" to update detailed information
3. Set "Max details to fetch" to limit API calls
4. Click "Refresh Data"

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Places
- `POST /api/places/search` - Search for places
- `GET /api/places/queries` - Get all search queries
- `GET /api/places/queries/{id}` - Get specific query with places
- `GET /api/places/queries/{id}/places` - Get places for a query
- `POST /api/places/refresh` - Refresh places data

See full API documentation at http://localhost:8000/docs

## Production Deployment

### Using Docker Compose

1. **Create production `.env` file:**
   ```bash
   cp .env.example .env
   # Edit with production values
   ```

2. **Run production setup:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

### Manual Deployment

1. **Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   # Serve dist/ folder with nginx or similar
   ```

## Database Schema

### Users
- User authentication and profile information

### Search Queries
- Stores city + category search combinations
- Tracks created/updated timestamps

### Places
- Business information from Google Places API
- Links to search queries
- Tracks whether Place Details API was called
- Stores created/updated timestamps

## Google Places API Usage

### Text Search API
- Called when searching for new city + category combinations
- Returns list of places matching the search

### Place Details API
- Called optionally to get detailed information
- Can be limited using `max_details` parameter
- Updates existing place records with additional data

**Cost Management:**
- Text Search: ~$32 per 1000 requests
- Place Details: ~$17 per 1000 requests
- Use `max_details` parameter to limit Place Details calls

## Troubleshooting

### Backend Issues

**Database connection errors:**
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running (if using PostgreSQL)
- Check database credentials

**Google Places API errors:**
- Verify `GOOGLE_PLACES_API_KEY` is set correctly
- Check API key has Places API enabled
- Verify billing is enabled on Google Cloud project

### Frontend Issues

**CORS errors:**
- Ensure backend CORS settings include frontend URL
- Check `VITE_API_URL` matches backend URL

**Authentication errors:**
- Clear browser localStorage
- Re-login to get new JWT token

### Docker Issues

**Port conflicts:**
- Change ports in `docker-compose.yml`
- Ensure ports 8000, 5173, 5432 are available

**Build failures:**
- Check Docker is running
- Verify all environment variables are set
- Check Docker logs: `docker-compose logs`

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Running Tests

```bash
# Backend tests (when implemented)
cd backend
pytest

# Frontend tests (when implemented)
cd frontend
npm test
```

## Security Considerations

- **JWT Secret Key**: Use a strong, random secret key in production
- **API Keys**: Never commit API keys to version control
- **CORS**: Configure CORS origins appropriately for production
- **Database**: Use strong passwords and secure connections
- **HTTPS**: Use HTTPS in production environments

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions:
- Check the troubleshooting section
- Review API documentation at `/docs`
- Check Google Places API documentation

---

**Note**: This application uses Google Places API which has usage costs. Monitor your API usage in Google Cloud Console.

