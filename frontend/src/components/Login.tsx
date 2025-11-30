import { useState, FormEvent, ChangeEvent } from 'react';
import { authAPI } from '../services/api';
import { AxiosError } from 'axios';

interface LoginProps {
  onLogin: () => void;
}

interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface ErrorResponse {
  detail: string | ValidationError[];
}

const Login = ({ onLogin }: LoginProps) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const formatError = (error: ErrorResponse | null | undefined): string => {
    if (!error) return 'An error occurred';
    
    // Handle validation errors (422) - detail is an array
    if (Array.isArray(error.detail)) {
      return error.detail.map((err: ValidationError) => {
        // Extract field name from location (e.g., ['body', 'password'] -> 'password')
        const field = err.loc && err.loc.length > 1 
          ? String(err.loc[err.loc.length - 1])
          : 'field';
        // Capitalize first letter and replace underscores
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
        return `${fieldName}: ${err.msg}`;
      }).join('. ');
    }
    
    // Handle string error messages
    if (typeof error.detail === 'string') {
      return error.detail;
    }
    
    // Fallback
    return 'An error occurred';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await authAPI.login({
          username: formData.username,
          password: formData.password,
        });
        localStorage.setItem('token', response.data.access_token);
        onLogin();
      } else {
        await authAPI.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        // Auto login after registration
        const response = await authAPI.login({
          username: formData.username,
          password: formData.password,
        });
        localStorage.setItem('token', response.data.access_token);
        onLogin();
      }
    } catch (err) {
      console.error('Registration/Login error:', err);
      let errorMessage = 'An error occurred';
      
      try {
        const axiosError = err as AxiosError<ErrorResponse>;
        if (axiosError.response?.data) {
          errorMessage = formatError(axiosError.response.data);
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      } catch (formatErr) {
        console.error('Error formatting error message:', formatErr);
        errorMessage = 'An error occurred. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: 'username' | 'email' | 'password') => 
    (e: ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
    };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isLogin ? 'Login' : 'Register'}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={handleInputChange('username')}
            required
            style={styles.input}
          />
          {!isLogin && (
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange('email')}
              required
              style={styles.input}
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange('password')}
            required
            style={styles.input}
          />
          {error && (
            <div style={styles.error}>
              <strong>Error:</strong> {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          style={styles.toggle}
        >
          {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  button: {
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  toggle: {
    marginTop: '1rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#007bff',
    cursor: 'pointer',
    textDecoration: 'underline',
    width: '100%',
  },
  error: {
    color: '#721c24',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    padding: '0.75rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    marginTop: '0.5rem',
    marginBottom: '0.5rem',
  },
};

export default Login;

