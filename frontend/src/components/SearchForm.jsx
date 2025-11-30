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
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.inputGroup}>
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
      <div style={styles.inputGroup}>
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
      <div style={styles.inputGroup}>
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
      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? 'Searching...' : 'Search Places'}
      </button>
    </form>
  );
};

const styles = {
  form: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  inputGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  button: {
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

