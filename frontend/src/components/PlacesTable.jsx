import { useState, useMemo } from 'react';

const PlacesTable = ({ places, onRefresh, queryId, loading }) => {
  const [refreshTextSearch, setRefreshTextSearch] = useState(false);
  const [refreshDetails, setRefreshDetails] = useState(false);
  const [maxDetails, setMaxDetails] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

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
      'Place ID',
      'Name',
      'City',
      'Category',
      'Address',
      'Formatted Address',
      'Description',
      'Types',
      'Rating',
      'Total Ratings',
      'Price Level',
      'Opening Hours',
      'Phone',
      'International Phone',
      'Website',
      'Business Status',
      'Latitude',
      'Longitude',
      'Photo Reference',
      'Photo URL',
      'Has Details',
      'Created At',
      'Updated At',
    ];

    const rows = places.map(place => {
      // Format opening hours for CSV
      let openingHours = '';
      if (place.opening_hours) {
        try {
          const hours = JSON.parse(place.opening_hours);
          if (hours.weekday_text && Array.isArray(hours.weekday_text)) {
            openingHours = hours.weekday_text.join('; ');
          } else if (hours.open_now !== undefined) {
            openingHours = hours.open_now ? 'Open Now' : 'Closed Now';
          }
        } catch (e) {
          openingHours = place.opening_hours;
        }
      }
      
      // Format types for CSV
      let types = '';
      if (place.types) {
        try {
          const typesArray = JSON.parse(place.types);
          if (Array.isArray(typesArray)) {
            types = typesArray.join(', ');
          } else {
            types = place.types;
          }
        } catch (e) {
          types = place.types;
        }
      }
      
      // Format price level
      const priceLevel = place.price_level !== null && place.price_level !== undefined 
        ? '$'.repeat(place.price_level) 
        : '';
      
      return [
        place.place_id || '',
        place.name || '',
        place.city || '',
        place.category || '',
        place.address || '',
        place.formatted_address || '',
        place.description || '',
        types,
        place.rating || '',
        place.user_ratings_total || '',
        priceLevel,
        openingHours,
        place.phone_number || '',
        place.international_phone_number || '',
        place.website || '',
        place.business_status || '',
        place.latitude || '',
        place.longitude || '',
        place.photo_reference || '',
        place.photo_url || '',
        place.has_details ? 'Yes' : 'No',
        place.created_at || '',
        place.updated_at || '',
      ];
    });

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

  // Pagination logic
  const totalPages = Math.ceil((places?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPlaces = useMemo(() => {
    if (!places) return [];
    return places.slice(startIndex, endIndex);
  }, [places, startIndex, endIndex]);

  // Reset to page 1 when items per page changes
  const handleItemsPerPageChange = (newValue) => {
    setItemsPerPage(newValue);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
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
        .places-table tbody tr {
          transition: background-color 0.2s;
        }
        .places-table tbody tr:hover {
          background-color: #e9ecef;
        }
        .places-table .line-number-cell {
          text-align: center;
          background-color: #f8f9fa;
          position: sticky;
          left: 0;
          z-index: 4;
          font-weight: 500;
        }
        .places-table tbody tr:hover .line-number-cell {
          background-color: #e9ecef;
        }
        .places-table .line-number-header {
          width: 50px;
          text-align: center;
          position: sticky;
          left: 0;
          background-color: #f8f9fa;
          z-index: 5;
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
              <th className="line-number-header">#</th>
              <th>Photo</th>
              <th>Place ID</th>
              <th>Name</th>
              <th>City</th>
              <th>Category</th>
              <th>Address</th>
              <th>Formatted Address</th>
              <th>Description</th>
              <th>Types</th>
              <th>Rating</th>
              <th>Total Ratings</th>
              <th>Price Level</th>
              <th>Opening Hours</th>
              <th>Phone</th>
              <th>International Phone</th>
              <th>Website</th>
              <th>Business Status</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Has Details</th>
              <th>Created At</th>
              <th>Updated At</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPlaces.map((place, index) => {
              const lineNumber = startIndex + index + 1;
              // Parse opening hours if available
              let openingHoursDisplay = '-';
              if (place.opening_hours) {
                try {
                  const hours = JSON.parse(place.opening_hours);
                  if (hours.weekday_text && Array.isArray(hours.weekday_text)) {
                    openingHoursDisplay = hours.weekday_text.join('; ');
                  } else if (hours.open_now !== undefined) {
                    openingHoursDisplay = hours.open_now ? 'Open Now' : 'Closed Now';
                  }
                } catch (e) {
                  openingHoursDisplay = place.opening_hours;
                }
              }
              
              // Parse types if available
              let typesDisplay = '-';
              if (place.types) {
                try {
                  const types = JSON.parse(place.types);
                  if (Array.isArray(types)) {
                    typesDisplay = types.join(', ');
                  } else {
                    typesDisplay = place.types;
                  }
                } catch (e) {
                  typesDisplay = place.types;
                }
              }
              
              // Format price level
              const priceLevelDisplay = place.price_level !== null && place.price_level !== undefined 
                ? '$'.repeat(place.price_level) 
                : '-';
              
              // Format dates
              const formatDate = (dateString) => {
                if (!dateString) return '-';
                try {
                  const date = new Date(dateString);
                  return date.toLocaleString();
                } catch (e) {
                  return dateString;
                }
              };
              
              return (
                <tr 
                  key={place.id}
                  onClick={() => {
                    setSelectedPlace(place);
                    setShowModal(true);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="line-number-cell">{lineNumber}</td>
                  <td>
                    {place.photo_url ? (
                      <img 
                        src={place.photo_url} 
                        alt={place.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'inline';
                        }}
                      />
                    ) : (
                      <span style={{ color: '#999' }}>No photo</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{place.place_id || '-'}</td>
                  <td>{place.name || '-'}</td>
                  <td>{place.city || '-'}</td>
                  <td>{place.category || '-'}</td>
                  <td>{place.address || '-'}</td>
                  <td>{place.formatted_address || '-'}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {place.description || '-'}
                  </td>
                  <td style={{ maxWidth: '150px', fontSize: '0.875rem' }} title={typesDisplay}>
                    {typesDisplay.length > 50 ? typesDisplay.substring(0, 50) + '...' : typesDisplay}
                  </td>
                  <td>{place.rating ? place.rating.toFixed(1) : '-'}</td>
                  <td>{place.user_ratings_total || '-'}</td>
                  <td>{priceLevelDisplay}</td>
                  <td style={{ maxWidth: '150px', fontSize: '0.875rem' }} title={openingHoursDisplay}>
                    {openingHoursDisplay.length > 50 ? openingHoursDisplay.substring(0, 50) + '...' : openingHoursDisplay}
                  </td>
                  <td>{place.phone_number || '-'}</td>
                  <td>{place.international_phone_number || '-'}</td>
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
                  <td>{place.latitude ? place.latitude.toFixed(6) : '-'}</td>
                  <td>{place.longitude ? place.longitude.toFixed(6) : '-'}</td>
                  <td>{place.has_details ? '✓' : '✗'}</td>
                  <td style={{ fontSize: '0.875rem' }}>{formatDate(place.created_at)}</td>
                  <td style={{ fontSize: '0.875rem' }}>{formatDate(place.updated_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div style={styles.paginationContainer}>
        <div style={styles.paginationInfo}>
          <span>
            Showing {startIndex + 1} to {Math.min(endIndex, places.length)} of {places.length} places
          </span>
          <div style={styles.itemsPerPageSelector}>
            <label htmlFor="itemsPerPage" style={styles.itemsPerPageLabel}>
              Items per page:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              style={styles.itemsPerPageSelect}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={places.length}>All</option>
            </select>
          </div>
        </div>
        <div style={styles.paginationControls}>
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            style={currentPage === 1 ? styles.paginationButtonDisabled : styles.paginationButton}
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={currentPage === 1 ? styles.paginationButtonDisabled : styles.paginationButton}
          >
            Previous
          </button>
          <span style={styles.paginationPageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={currentPage === totalPages ? styles.paginationButtonDisabled : styles.paginationButton}
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            style={currentPage === totalPages ? styles.paginationButtonDisabled : styles.paginationButton}
          >
            Last
          </button>
        </div>
      </div>
      
      {/* Place Details Modal */}
      {showModal && selectedPlace && (
        <PlaceModal place={selectedPlace} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

// Place Details Modal Component
const PlaceModal = ({ place, onClose }) => {
  // Parse opening hours
  let openingHoursData = null;
  if (place.opening_hours) {
    try {
      openingHoursData = JSON.parse(place.opening_hours);
    } catch (e) {
      openingHoursData = { weekday_text: [place.opening_hours] };
    }
  }
  
  // Parse types
  let typesArray = [];
  if (place.types) {
    try {
      typesArray = JSON.parse(place.types);
    } catch (e) {
      typesArray = [place.types];
    }
  }
  
  // Format price level
  const priceLevel = place.price_level !== null && place.price_level !== undefined 
    ? '$'.repeat(place.price_level) 
    : 'Not specified';
  
  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <>
      <style>{`
        .modal-close-button:hover {
          background-color: #f0f0f0 !important;
        }
        .modal-close-button:active {
          background-color: #e0e0e0 !important;
        }
      `}</style>
      <div style={modalStyles.overlay} onClick={onClose}>
        <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={modalStyles.header}>
            <h2 style={modalStyles.title}>{place.name || 'Place Details'}</h2>
            <button className="modal-close-button" style={modalStyles.closeButton} onClick={onClose}>×</button>
          </div>
        
        <div style={modalStyles.content}>
          {/* Photo Section */}
          {place.photo_url && (
            <div style={modalStyles.photoSection}>
              <img 
                src={place.photo_url} 
                alt={place.name}
                style={modalStyles.photo}
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          )}
          
          {/* Basic Information */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Basic Information</h3>
            <div style={modalStyles.grid}>
              <div style={modalStyles.field}>
                <strong>Place ID:</strong>
                <span style={modalStyles.monospace}>{place.place_id || 'N/A'}</span>
              </div>
              <div style={modalStyles.field}>
                <strong>Name:</strong>
                <span>{place.name || 'N/A'}</span>
              </div>
              <div style={modalStyles.field}>
                <strong>Category:</strong>
                <span>{place.category || 'N/A'}</span>
              </div>
              <div style={modalStyles.field}>
                <strong>City:</strong>
                <span>{place.city || 'N/A'}</span>
              </div>
              <div style={modalStyles.field}>
                <strong>Business Status:</strong>
                <span>{place.business_status || 'N/A'}</span>
              </div>
              <div style={modalStyles.field}>
                <strong>Price Level:</strong>
                <span>{priceLevel}</span>
              </div>
            </div>
          </div>
          
          {/* Address Information */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Address</h3>
            <div style={modalStyles.grid}>
              <div style={modalStyles.field}>
                <strong>Address:</strong>
                <span>{place.address || 'N/A'}</span>
              </div>
              <div style={modalStyles.field}>
                <strong>Formatted Address:</strong>
                <span>{place.formatted_address || 'N/A'}</span>
              </div>
              <div style={modalStyles.field}>
                <strong>Coordinates:</strong>
                <span>
                  {place.latitude && place.longitude 
                    ? `${place.latitude.toFixed(6)}, ${place.longitude.toFixed(6)}`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Description */}
          {place.description && (
            <div style={modalStyles.section}>
              <h3 style={modalStyles.sectionTitle}>Description</h3>
              <p style={modalStyles.description}>{place.description}</p>
            </div>
          )}
          
          {/* Types */}
          {typesArray.length > 0 && (
            <div style={modalStyles.section}>
              <h3 style={modalStyles.sectionTitle}>Business Types</h3>
              <div style={modalStyles.tags}>
                {typesArray.map((type, index) => (
                  <span key={index} style={modalStyles.tag}>{type}</span>
                ))}
              </div>
            </div>
          )}
          
          {/* Ratings */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Ratings</h3>
            <div style={modalStyles.grid}>
              <div style={modalStyles.field}>
                <strong>Rating:</strong>
                <span>{place.rating ? `${place.rating.toFixed(1)} / 5.0` : 'N/A'}</span>
              </div>
              <div style={modalStyles.field}>
                <strong>Total Ratings:</strong>
                <span>{place.user_ratings_total || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          {/* Opening Hours */}
          {openingHoursData && (
            <div style={modalStyles.section}>
              <h3 style={modalStyles.sectionTitle}>Opening Hours</h3>
              {openingHoursData.weekday_text && openingHoursData.weekday_text.length > 0 ? (
                <ul style={modalStyles.hoursList}>
                  {openingHoursData.weekday_text.map((day, index) => (
                    <li key={index}>{day}</li>
                  ))}
                </ul>
              ) : openingHoursData.open_now !== undefined ? (
                <p>{openingHoursData.open_now ? 'Open Now' : 'Closed Now'}</p>
              ) : (
                <p>Hours not available</p>
              )}
            </div>
          )}
          
          {/* Contact Information */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Contact Information</h3>
            <div style={modalStyles.grid}>
              <div style={modalStyles.field}>
                <strong>Phone:</strong>
                <span>{place.phone_number || 'N/A'}</span>
              </div>
              <div style={modalStyles.field}>
                <strong>International Phone:</strong>
                <span>{place.international_phone_number || 'N/A'}</span>
              </div>
              <div style={modalStyles.field}>
                <strong>Website:</strong>
                {place.website ? (
                  <a href={place.website} target="_blank" rel="noopener noreferrer" style={modalStyles.link}>
                    {place.website}
                  </a>
                ) : (
                  <span>N/A</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Metadata */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Metadata</h3>
            <div style={modalStyles.grid}>
              <div style={modalStyles.field}>
                <strong>Has Details:</strong>
                <span>{place.has_details ? 'Yes' : 'No'}</span>
              </div>
              <div style={modalStyles.field}>
                <strong>Created At:</strong>
                <span>{formatDate(place.created_at)}</span>
              </div>
              <div style={modalStyles.field}>
                <strong>Updated At:</strong>
                <span>{formatDate(place.updated_at)}</span>
              </div>
              {place.photo_reference && (
                <div style={modalStyles.field}>
                  <strong>Photo Reference:</strong>
                  <span style={modalStyles.monospace}>{place.photo_reference}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
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
    overflowY: 'auto',
    maxHeight: '80vh',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  table: {
    width: '100%',
    minWidth: '2000px', // Ensure table doesn't compress too much
    borderCollapse: 'collapse',
  },
  paginationContainer: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  paginationInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  itemsPerPageSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  itemsPerPageLabel: {
    fontSize: '0.875rem',
    color: '#666',
  },
  itemsPerPageSelect: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  paginationButton: {
    padding: '0.5rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
  },
  paginationButtonDisabled: {
    padding: '0.5rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#f8f9fa',
    cursor: 'not-allowed',
    fontSize: '0.875rem',
    opacity: 0.5,
  },
  paginationPageInfo: {
    padding: '0 0.5rem',
    fontSize: '0.875rem',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '2rem',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    position: 'relative',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #dee2e6',
    position: 'sticky',
    top: 0,
    backgroundColor: 'white',
    zIndex: 10,
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    lineHeight: '1',
  },
  content: {
    padding: '1.5rem',
  },
  photoSection: {
    marginBottom: '2rem',
    textAlign: 'center',
  },
  photo: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  section: {
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #f0f0f0',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    marginBottom: '1rem',
    color: '#007bff',
    fontWeight: '600',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  description: {
    lineHeight: '1.6',
    color: '#555',
    margin: 0,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  tag: {
    backgroundColor: '#e9ecef',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.875rem',
    color: '#495057',
  },
  hoursList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    wordBreak: 'break-all',
  },
  monospace: {
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    backgroundColor: '#f8f9fa',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
  },
};

export default PlacesTable;

