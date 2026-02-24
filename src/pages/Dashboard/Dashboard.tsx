import { useApp } from '../../context/AppContext';
import { FileText, Briefcase, Calendar } from 'lucide-react';

const Dashboard = () => {
    const { currentUser, contracts, projects, meetings } = useApp();

    const stats = [
        { label: 'Contratos Activos', value: contracts.length, icon: FileText, color: 'var(--primary)' },
        { label: 'Proyectos en Curso', value: projects.length, icon: Briefcase, color: 'var(--success)' },
        { label: 'Reuniones Pendientes', value: meetings.filter(m => m.status === 'PROGRAMADA').length, icon: Calendar, color: 'var(--warning)' },
        // { label: 'Usuarios', value: 3, icon: Users, color: 'var(--text-secondary)' }, // Mock count
    ];

    return (
        <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Bienvenido, {currentUser?.name}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {stats.map((stat, index) => (
                    <div key={index} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            padding: '1rem',
                            borderRadius: '50%',
                            backgroundColor: `${stat.color}20`,
                            color: stat.color
                        }}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{stat.value}</div>
                            <div className="text-secondary">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <h3>Actividad Reciente</h3>
                <p className="text-secondary">No hay actividad reciente para mostrar.</p>
            </div>
        </div>
    );
};

export default Dashboard;
