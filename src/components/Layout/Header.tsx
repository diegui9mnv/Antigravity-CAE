
import { User, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Header = () => {
    const { headerActions } = useApp();

    return (
        <header style={{
            height: '64px',
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 10
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <h3 style={{ color: 'var(--text-main)', margin: 0 }}>Gestor de Contratos y Proyectos</h3>
                {headerActions && (
                    <div style={{ display: 'flex', alignItems: 'center', animation: 'fadeIn 0.2s' }}>
                        {headerActions}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <Bell size={20} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <User size={16} />
                    </div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>Usuario Demo</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
