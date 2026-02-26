
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { User, Building2, Briefcase } from 'lucide-react';
import api from '../../services/api';

const Login = () => {
    const { users, setCurrentUser } = useApp();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (email: string) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get JWT Token from Django
            const response = await api.post('/token/', {
                email,
                password: 'admin' // Hardcoded default password for all mock users in DB for now
            });

            const accessToken = response.data.access;
            const refreshToken = response.data.refresh;

            // 2. Save tokens in localStorage for the Axios Interceptor
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);

            // 3. Find full user details from Context (soon to be API too)
            const user = users.find(u => u.email === email);
            if (user) {
                setCurrentUser(user);
                navigate('/');
            } else {
                setError("El usuario no existe en la base de datos local");
            }
        } catch (err: any) {
            console.error("Login failed:", err);
            setError(err.response?.data?.detail || "Error en el servidor al autenticar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: 'var(--background)'
        }}>
            <div className="card" style={{ width: '400px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '2rem', color: 'var(--primary)' }}>Contract Manager</h2>
                <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Selecciona un rol para entrar</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {error && (
                        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: 'var(--radius-md)' }}>
                            {error}
                        </div>
                    )}

                    {users.map(user => (
                        <button
                            key={user.id}
                            disabled={loading}
                            onClick={() => handleLogin(user.email)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--surface)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textAlign: 'left'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                            <div style={{
                                padding: '0.5rem',
                                backgroundColor: 'var(--background)',
                                borderRadius: '50%',
                                color: 'var(--primary)'
                            }}>
                                {user.role === 'MANAGER' && <Briefcase size={20} />}
                                {user.role === 'COORDINATOR' && <User size={20} />}
                                {user.role === 'COMPANY' && <Building2 size={20} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600 }}>{user.name}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {user.role === 'MANAGER' ? 'Gestor de Contrato' :
                                        user.role === 'COORDINATOR' ? 'Coordinador' : 'Empresa'}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Login;
