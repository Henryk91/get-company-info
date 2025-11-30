import { useState, useEffect } from 'react';
import { placesAPI, SearchQuery } from '../services/api';
import { AxiosError } from 'axios';

interface PreviousSearchesProps {
  onSelectSearch: (queryData: SearchQuery) => void;
  currentQueryId?: number;
  refreshTrigger?: number;
}

const PreviousSearches = ({ onSelectSearch, currentQueryId, refreshTrigger }: PreviousSearchesProps) => {
  const [searches, setSearches] = useState<SearchQuery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadSearches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const loadSearches = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await placesAPI.getQueries();
      // Sort by created_at descending (newest first)
      const sorted = response.data.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });
      setSearches(sorted);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail: string }>;
      setError(axiosError.response?.data?.detail || 'Failed to load previous searches');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateString;
    }
  };

  const handleSelect = async (queryId: number) => {
    try {
      const response = await placesAPI.getQuery(queryId);
      onSelectSearch(response.data);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail: string }>;
      setError(axiosError.response?.data?.detail || 'Failed to load search');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={loadSearches} style={styles.refreshButton} title="Refresh list">
          ↻
        </button>
      </div>
      {error && <div style={styles.error}>{error}</div>}
      {searches.length === 0 ? (
        <div style={styles.empty}>No previous searches found</div>
      ) : (
        <div style={styles.list}>
          {searches.map((search) => (
            <div
              key={search.id}
              onClick={() => handleSelect(search.id)}
              style={{
                ...styles.searchItem,
                ...(currentQueryId === search.id ? styles.activeItem : {}),
              }}
            >
              <div style={styles.searchHeader}>
                <strong style={styles.searchText}>
                  {search.category} in {search.city}
                </strong>
                <span style={styles.badge}>{search.places?.length || 0} places</span>
              </div>
              <div style={styles.searchMeta}>
                <span style={styles.date}>Created: {formatDate(search.created_at)}</span>
                {search.updated_at && search.updated_at !== search.created_at && (
                  <span style={styles.date}>Updated: {formatDate(search.updated_at)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '1.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  refreshButton: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    fontSize: '1.2rem',
    color: '#666',
    transition: 'all 0.2s',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  empty: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  searchItem: {
    padding: '1rem',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#fff',
  },
  activeItem: {
    borderColor: '#007bff',
    backgroundColor: '#f0f7ff',
    boxShadow: '0 2px 4px rgba(0,123,255,0.2)',
  },
  searchHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  searchText: {
    fontSize: '1rem',
    color: '#333',
  },
  badge: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  searchMeta: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.875rem',
    color: '#666',
  },
  date: {
    fontSize: '0.875rem',
  },
};

export default PreviousSearches;

