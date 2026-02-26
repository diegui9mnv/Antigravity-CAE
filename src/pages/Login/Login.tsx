
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';

const Login = () => {
    const { users, setCurrentUser } = useApp();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/token/', { email, password });

            const accessToken = response.data.access;
            const refreshToken = response.data.refresh;

            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);

            // Fetch actual user from backend if possible, or fallback
            // But right now we can just find it in local users array, which might not be updated
            // For a robust implementation we should have an endpoint like /api/users/me/
            // Temporarily we will still rely on the 'users' from context or just fetch it.

            // Wait, AppContext already fetches users! Let's just find the user in there
            const user = users.find(u => u.email === email);
            if (user) {
                setCurrentUser(user);
                navigate('/');
            } else {
                // Fetch the specific user since they might not be in the mock initial load
                try {
                    const usersRes = await api.get('/users/');
                    const found = usersRes.data.find((u: any) => u.email === email);
                    if (found) {
                        setCurrentUser(found);
                        navigate('/');
                    } else {
                        setError("Usuario autenticado pero no encontrado en la base de datos.");
                    }
                } catch (e) {
                    setError("No se pudo obtener el perfil de usuario.");
                }
            }
        } catch (err: any) {
            console.error("Login failed:", err);
            setError(err.response?.data?.detail || "Correo o contraseña incorrectos.");
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
                <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Contract Manager</h2>
                <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Inicia sesión para continuar</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                    {error && (
                        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-bold block mb-2">Correo electrónico</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="text-sm font-bold block mb-2">Contraseña</label>
                        <input
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}
                    >
                        {loading ? 'Iniciando sesión...' : 'Entrar'}
                    </button>

                    <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                        <p>Usuarios de prueba:</p>
                        <p>Gestor: juan@manager.com / admin</p>
                        <p>Coord: ana@coordinator.com / admin</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
