
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { User, Building2, Briefcase } from 'lucide-react';

const Login = () => {
    const { users, setCurrentUser } = useApp();
    const navigate = useNavigate();

    const handleLogin = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            setCurrentUser(user);
            navigate('/');
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
                    {users.map(user => (
                        <button
                            key={user.id}
                            onClick={() => handleLogin(user.id)}
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
