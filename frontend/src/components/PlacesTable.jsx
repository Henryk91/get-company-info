import { useState } from 'react';

const PlacesTable = ({ places, onRefresh, queryId, loading }) => {
  const [refreshTextSearch, setRefreshTextSearch] = useState(false);
  const [refreshDetails, setRefreshDetails] = useState(false);
  const [maxDetails, setMaxDetails] = useState('');

  const handleRefresh = () => {
    onRefresh({
      search_query_id: queryId,
      refresh_text_search: refreshTextSearch,
      refresh_details: refreshDetails,
      max_details: maxDetails ? parseInt(maxDetails) : null,
    });
  };

  const downloadCSV = () => {
    if (!places || places.length === 0) return;

    const headers = [
      'Name',
      'Address',
      'City',
      'Category',
      'Rating',
      'Total Ratings',
      'Phone',
      'Website',
      'Business Status',
      'Price Level',
      'Latitude',
      'Longitude',
    ];

    const rows = places.map(place => [
      place.name || '',
      place.formatted_address || place.address || '',
      place.city || '',
      place.category || '',
      place.rating || '',
      place.user_ratings_total || '',
      place.international_phone_number || place.phone_number || '',
      place.website || '',
      place.business_status || '',
      place.price_level || '',
      place.latitude || '',
      place.longitude || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `places_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!places || places.length === 0) {
    return <div style={styles.empty}>No places found</div>;
  }

  return (
    <div>
      <style>{`
        .places-table thead tr {
          background-color: #f8f9fa;
        }
        .places-table th {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 2px solid #dee2e6;
          font-weight: 600;
          color: #495057;
        }
        .places-table td {
          padding: 0.75rem;
          border-bottom: 1px solid #dee2e6;
        }
        .places-table tbody tr:hover {
          background-color: #f8f9fa;
        }
      `}</style>
      <div style={styles.actions}>
        <button onClick={downloadCSV} style={styles.downloadButton}>
          Download CSV
        </button>
        {queryId && (
          <div style={styles.refreshSection}>
            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={refreshTextSearch}
                  onChange={(e) => setRefreshTextSearch(e.target.checked)}
                />
                Refresh Text Search
              </label>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={refreshDetails}
                  onChange={(e) => setRefreshDetails(e.target.checked)}
                />
                Refresh Place Details
              </label>
            </div>
            <div style={styles.refreshInput}>
              <input
                type="number"
                value={maxDetails}
                onChange={(e) => setMaxDetails(e.target.value)}
                placeholder="Max details to fetch"
                min="0"
                style={styles.input}
              />
              <button
                onClick={handleRefresh}
                disabled={loading || (!refreshTextSearch && !refreshDetails)}
                style={styles.refreshButton}
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        )}
      </div>
      <div style={styles.tableContainer}>
        <table className="places-table" style={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Rating</th>
              <th>Total Ratings</th>
              <th>Phone</th>
              <th>Website</th>
              <th>Status</th>
              <th>Has Details</th>
            </tr>
          </thead>
          <tbody>
            {places.map((place) => (
              <tr key={place.id}>
                <td>{place.name}</td>
                <td>{place.formatted_address || place.address || '-'}</td>
                <td>{place.rating ? place.rating.toFixed(1) : '-'}</td>
                <td>{place.user_ratings_total || '-'}</td>
                <td>{place.international_phone_number || place.phone_number || '-'}</td>
                <td>
                  {place.website ? (
                    <a href={place.website} target="_blank" rel="noopener noreferrer">
                      Visit
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td>{place.business_status || '-'}</td>
                <td>{place.has_details ? '✓' : '✗'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  actions: {
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  downloadButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  refreshSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  checkboxGroup: {
    display: 'flex',
    gap: '1rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  },
  refreshInput: {
    display: 'flex',
    gap: '0.5rem',
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '150px',
  },
  refreshButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#ffc107',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  tableContainer: {
    overflowX: 'auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  empty: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
};

export default PlacesTable;

