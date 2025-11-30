import { useState } from 'react';

const SearchForm = ({ onSearch, loading }) => {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [maxDetails, setMaxDetails] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({
      city: city.trim(),
      category: category.trim(),
      max_details: maxDetails ? parseInt(maxDetails) : null,
    });
  };

  return (
    <>
      <style>{`
        .search-form {
          display: flex !important;
          flex-direction: column !important;
          gap: 1rem;
          background-color: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }
        @media (min-width: 768px) {
          .search-form {
            flex-direction: row !important;
            align-items: flex-end;
          }
          .search-form .input-group {
            margin-bottom: 0;
            flex: 1;
            min-width: 0;
          }
          .search-form .search-button {
            margin-top: 0;
            align-self: flex-end;
            white-space: nowrap;
          }
        }
      `}</style>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="input-group" style={styles.inputGroup}>
          <label style={styles.label}>City:</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g., New York"
            required
            style={styles.input}
          />
        </div>
        <div className="input-group" style={styles.inputGroup}>
          <label style={styles.label}>Business Category:</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., restaurants, hotels, coffee shops"
            required
            style={styles.input}
          />
        </div>
        <div className="input-group" style={styles.inputGroup}>
          <label style={styles.label}>Max Place Details (optional):</label>
          <input
            type="number"
            value={maxDetails}
            onChange={(e) => setMaxDetails(e.target.value)}
            placeholder="Limit API calls"
            min="0"
            style={styles.input}
          />
        </div>
        <button type="submit" disabled={loading} className="search-button" style={loading ? { ...styles.button, opacity: 0.6, cursor: 'not-allowed' } : styles.button}>
          {loading ? 'Searching...' : 'Search Places'}
        </button>
      </form>
    </>
  );
};

const styles = {
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#333',
    fontSize: '0.875rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  button: {
    padding: '0.75rem 2rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    alignSelf: 'flex-end',
  },
  buttonFullWidth: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
};

export default SearchForm;

