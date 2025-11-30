import { useState, useEffect } from 'react';
import Login from './components/Login';
import SearchForm from './components/SearchForm';
import MapView from './components/MapView';
import PlacesTable from './components/PlacesTable';
import PreviousSearches from './components/PreviousSearches';
import { authAPI, placesAPI } from './services/api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentQuery, setCurrentQuery] = useState(null);
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState('');
  const [refreshSearches, setRefreshSearches] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      await authAPI.getMe();
      setIsAuthenticated(true);
    } catch (err) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setCurrentQuery(null);
    setPlaces([]);
  };

  const handleSearch = async (searchData) => {
    setError('');
    setLoading(true);

    try {
      const response = await placesAPI.search(searchData);
      setCurrentQuery(response.data);
      setPlaces(response.data.places || []);
      // Trigger refresh of previous searches list
      setRefreshSearches(prev => prev + 1);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (refreshData) => {
    setError('');
    setLoading(true);

    try {
      const response = await placesAPI.refresh(refreshData);
      setCurrentQuery(response.data);
      setPlaces(response.data.places || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred while refreshing');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSearch = (queryData) => {
    setCurrentQuery(queryData);
    setPlaces(queryData.places || []);
    setError('');
  };

  if (loading && !isAuthenticated) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            style={styles.sidebarToggle}
            title="Toggle Previous Searches"
          >
            ☰
          </button>
          <h1>Company Info Finder</h1>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </header>
      <main style={styles.main}>
        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            style={styles.overlay} 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Sidebar */}
        <div 
          style={{
            ...styles.sidebar,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          <div style={styles.sidebarHeader}>
            <h2 style={styles.sidebarTitle}>Previous Searches</h2>
            <button 
              onClick={() => setSidebarOpen(false)} 
              style={styles.sidebarClose}
            >
              ×
            </button>
          </div>
          <PreviousSearches 
            onSelectSearch={(queryData) => {
              handleSelectSearch(queryData);
              setSidebarOpen(false);
            }} 
            currentQueryId={currentQuery?.id}
            refreshTrigger={refreshSearches}
          />
        </div>
        <div style={styles.container}>
          {/* Search Form at Top */}
          <div style={styles.searchSection}>
            <SearchForm onSearch={handleSearch} loading={loading} />
            {error && <div style={styles.error}>{error}</div>}
          </div>
          {/* Current Search Info */}
          {currentQuery && (
            <div style={styles.currentSearch}>
              <h2 style={styles.currentSearchTitle}>
                {currentQuery.category} in {currentQuery.city}
              </h2>
              <p style={styles.currentSearchMeta}>
                {places.length} places found
                {currentQuery.created_at && (
                  <span> • Created: {new Date(currentQuery.created_at).toLocaleString()}</span>
                )}
              </p>
            </div>
          )}
          {/* Results */}
          {places.length > 0 && (
            <>
              <MapView places={places} />
              <PlacesTable
                places={places}
                onRefresh={handleRefresh}
                queryId={currentQuery?.id}
                loading={loading}
              />
            </>
          )}
          {currentQuery && places.length === 0 && !loading && (
            <div style={styles.empty}>No places found for this search</div>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  header: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  sidebarToggle: {
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: 'white',
    padding: '0.5rem 0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1.2rem',
    transition: 'background-color 0.2s',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid white',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  main: {
    padding: '2rem',
    position: 'relative',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 200,
    transition: 'opacity 0.3s',
  },
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '350px',
    height: '100vh',
    backgroundColor: 'white',
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
    zIndex: 300,
    transition: 'transform 0.3s ease-in-out',
    overflowY: 'auto',
    paddingTop: '60px', // Account for header
  },
  sidebarHeader: {
    position: 'sticky',
    top: 0,
    backgroundColor: 'white',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #dee2e6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  sidebarTitle: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#333',
  },
  sidebarClose: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#666',
    padding: 0,
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '1',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
  },
  searchSection: {
    marginBottom: '2rem',
  },
  currentSearch: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  currentSearchTitle: {
    margin: 0,
    marginBottom: '0.5rem',
    fontSize: '1.5rem',
    color: '#333',
  },
  currentSearchMeta: {
    margin: 0,
    color: '#666',
    fontSize: '0.875rem',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '1rem',
    borderRadius: '4px',
    marginTop: '1rem',
  },
  empty: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
    backgroundColor: 'white',
    borderRadius: '8px',
  },
};

export default App;

