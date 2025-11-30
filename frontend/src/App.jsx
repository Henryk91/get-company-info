import { useState, useEffect } from 'react';
import Login from './components/Login';
import SearchForm from './components/SearchForm';
import MapView from './components/MapView';
import PlacesTable from './components/PlacesTable';
import { authAPI, placesAPI } from './services/api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentQuery, setCurrentQuery] = useState(null);
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState('');

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

  if (loading && !isAuthenticated) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <header style={styles.header}>
        <h1>Company Info Finder</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </header>
      <main style={styles.main}>
        <div style={styles.container}>
          <SearchForm onSearch={handleSearch} loading={loading} />
          {error && <div style={styles.error}>{error}</div>}
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
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1rem',
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

