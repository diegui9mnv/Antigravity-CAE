import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Briefcase, LogOut, Building2, MapPin, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import '../../index.css';

const Sidebar = () => {
    const { currentUser, setCurrentUser } = useApp();
    return (
        <aside style={{
            width: '250px',
            height: '100vh',
            backgroundColor: 'var(--surface)', // Use CSS variable
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            top: 0
        }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.25rem' }}>Coordinación en Seguridad y Salud para la C.H. Guadalquivir</h2>
            </div>

            <nav style={{ flex: 1, padding: '1rem' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li>
                        <NavLink
                            to="/"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                backgroundColor: isActive ? '#EEF2FF' : 'transparent', // Light indigo bg
                                textDecoration: 'none',
                                marginBottom: '0.5rem',
                                transition: 'all 0.2s'
                            })}
                        >
                            <LayoutDashboard size={20} />
                            <span>Panel de control</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/contracts"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                                textDecoration: 'none',
                                marginBottom: '0.5rem',
                                transition: 'all 0.2s'
                            })}
                        >
                            <FileText size={20} />
                            <span>Contratos</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/projects"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                                textDecoration: 'none',
                                marginBottom: '0.5rem',
                                transition: 'all 0.2s'
                            })}
                        >
                            <Briefcase size={20} />
                            <span>Proyectos</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/companies"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                                textDecoration: 'none',
                                marginBottom: '0.5rem',
                                transition: 'all 0.2s'
                            })}
                        >
                            <Building2 size={20} />
                            <span>Empresas</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/work-centers"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                                textDecoration: 'none',
                                marginBottom: '0.5rem',
                                transition: 'all 0.2s'
                            })}
                        >
                            <MapPin size={20} />
                            <span>Centros de Trabajo</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/templates"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                                textDecoration: 'none',
                                marginBottom: '0.5rem',
                                transition: 'all 0.2s'
                            })}
                        >
                            <FileText size={20} />
                            <span>Plantillas</span>
                        </NavLink>
                    </li>
                    {currentUser?.role === 'MANAGER' && (
                        <li>
                            <NavLink
                                to="/users"
                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                    backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                                    textDecoration: 'none',
                                    marginBottom: '0.5rem',
                                    transition: 'all 0.2s'
                                })}
                            >
                                <Users size={20} />
                                <span>Usuarios</span>
                            </NavLink>
                        </li>
                    )}
                </ul>
            </nav>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                <button
                    onClick={() => setCurrentUser(null)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--error)',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-md)'
                    }}>
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
