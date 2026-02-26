import { useState } from 'react';
import { Plus, Search, MapPin, Phone, Building2, Trash2, Edit2, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { WorkCenter } from '../../types';
import WorkCenterForm from './WorkCenterForm';

const WorkCenters = () => {
    const { workCenters, deleteWorkCenter } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingWorkCenter, setEditingWorkCenter] = useState<WorkCenter | null>(null);

    const filteredWorkCenters = workCenters.filter(wc =>
        wc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wc.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wc.province.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (wc: WorkCenter) => {
        setEditingWorkCenter(wc);
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este centro de trabajo?')) {
            deleteWorkCenter(id);
        }
    };

    const closeModal = () => {
        setIsFormOpen(false);
        setEditingWorkCenter(null);
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div>
                    <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Centros de Trabajo</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Gestión de embalses y oficinas
                    </p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="btn btn-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'transform 0.2s'
                    }}
                >
                    <Plus size={20} />
                    Nuevo Centro
                </button>
            </div>

            <div style={{
                backgroundColor: 'var(--surface)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <Search size={20} color="var(--text-secondary)" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, dirección o provincia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        fontSize: '1rem',
                        background: 'transparent',
                        color: 'var(--text-primary)'
                    }}
                />
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.5rem'
            }}>
                {filteredWorkCenters.map(wc => (
                    <div
                        key={wc.id}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem',
                            border: '1px solid var(--border)',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: wc.type === 'EMBALSE' ? '#E0F2FE' : '#F0FDF4',
                                color: wc.type === 'EMBALSE' ? '#0369A1' : '#15803D'
                            }}>
                                {wc.type === 'EMBALSE' ? <Building2 size={24} /> : <Building2 size={24} />}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleEdit(wc)}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'white',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(wc.id)}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'white',
                                        color: 'var(--error)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{wc.name}</h3>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>{wc.type}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                <MapPin size={16} />
                                <span>{wc.address}, {wc.zipCode}, {wc.province}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                <Phone size={16} />
                                <span>{wc.phone}</span>
                            </div>
                        </div>

                        {wc.riskInfoFileName && (
                            <div style={{
                                marginTop: '0.5rem',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: '#F8FAFC',
                                border: '1px dashed var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <FileText size={16} color="var(--primary)" />
                                <span style={{ fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {wc.riskInfoFileName}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (wc.riskInfoUrl?.startsWith('data:')) {
                                            const parts = wc.riskInfoUrl.split(';base64,');
                                            const contentType = parts[0].split(':')[1];
                                            const raw = window.atob(parts[1]);
                                            const rawLength = raw.length;
                                            const uInt8Array = new Uint8Array(rawLength);
                                            for (let i = 0; i < rawLength; ++i) {
                                                uInt8Array[i] = raw.charCodeAt(i);
                                            }
                                            const blob = new Blob([uInt8Array], { type: contentType });
                                            const url = URL.createObjectURL(blob);
                                            window.open(url, '_blank');
                                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                                        } else if (wc.riskInfoUrl) {
                                            window.open(wc.riskInfoUrl, '_blank');
                                        }
                                    }}
                                    style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--primary)',
                                        fontWeight: 600,
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0
                                    }}
                                >
                                    Ver
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {isFormOpen && (
                <WorkCenterForm
                    isOpen={isFormOpen}
                    onClose={closeModal}
                    editingWorkCenter={editingWorkCenter}
                />
            )}
        </div>
    );
};

export default WorkCenters;
