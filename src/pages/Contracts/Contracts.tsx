import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { Contract } from '../../types';
import { Plus, Search, Filter, Briefcase } from 'lucide-react';
import MeatballMenu from '../../components/UI/MeatballMenu';
import Modal from '../../components/UI/Modal';

const Contracts = () => {
    const navigate = useNavigate();
    const { contracts, users, currentUser, addContract, updateContract, deleteContract } = useApp();
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Contract>>({});

    const isManager = currentUser?.role === 'MANAGER';
    const coordinators = users.filter(u => u.role === 'COORDINATOR');

    const filteredContracts = contracts.filter(c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (contract?: Contract) => {
        if (contract) {
            setEditingContract(contract);
            setFormData(contract);
        } else {
            setEditingContract(null);
            setFormData({
                code: `CTR-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                amount: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingContract) {
            updateContract({ ...editingContract, ...formData } as Contract);
        } else {
            addContract({
                id: Math.random().toString(36).substr(2, 9),
                ...formData
            } as Contract);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Estás seguro de borrar este contrato?')) {
            deleteContract(id);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Contratos</h2>
                    <p className="text-secondary">Gestión de contratos y asignación de coordinadores</p>
                </div>
                {isManager && (
                    <button
                        className="btn btn-primary"
                        onClick={() => handleOpenModal()}
                    >
                        <Plus size={18} />
                        Nuevo Contrato
                    </button>
                )}
            </div>

            <div className="card mb-6">
                <div className="flex gap-md">
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar contratos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 3rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button className="btn btn-outline">
                        <Filter size={18} />
                        Filtros
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Código</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Descripción</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Cliente</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Fechas</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Importe</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Coordinador</th>
                            <th style={{ width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredContracts.map(contract => (
                            <tr key={contract.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>{contract.code}</td>
                                <td style={{ padding: '1rem' }}>{contract.description}</td>
                                <td style={{ padding: '1rem' }}>{contract.clientName}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    <div style={{ color: 'var(--text-secondary)' }}>In: {contract.startDate}</div>
                                    <div style={{ color: 'var(--text-secondary)' }}>Fin: {contract.endDate}</div>
                                </td>
                                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(contract.amount)}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {users.find(u => u.id === contract.coordinatorId)?.name || '-'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => navigate(`/projects?contractId=${contract.id}`)}
                                            style={{ padding: '0.5rem', height: '32px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                            title="Ver Proyectos"
                                        >
                                            <Briefcase size={16} />
                                            <span style={{ fontSize: '0.75rem' }}>Proyectos</span>
                                        </button>
                                        {isManager && (
                                            <MeatballMenu items={[
                                                { label: 'Editar', onClick: () => handleOpenModal(contract) },
                                                { label: 'Borrar', onClick: () => handleDelete(contract.id), variant: 'danger' }
                                            ]} />
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingContract ? 'Editar Contrato' : 'Nuevo Contrato'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <div className="flex gap-md">
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Código</label>
                            <input
                                required
                                type="text"
                                value={formData.code || ''}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Importe</label>
                            <input
                                required
                                type="number"
                                value={formData.amount || 0}
                                onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold block mb-2">Descripción</label>
                        <input
                            required
                            type="text"
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                        />
                    </div>

                    <div className="flex gap-md">
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Cliente</label>
                            <input
                                required
                                type="text"
                                value={formData.clientName || ''}
                                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Contacto</label>
                            <input
                                type="text"
                                value={formData.contactName || ''}
                                onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                    </div>

                    <div className="flex gap-md">
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Fecha Inicio</label>
                            <input
                                required
                                type="date"
                                value={formData.startDate || ''}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Fecha Fin</label>
                            <input
                                required
                                type="date"
                                value={formData.endDate || ''}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold block mb-2">Coordinador Asignado</label>
                        <select
                            value={formData.coordinatorId || ''}
                            onChange={e => setFormData({ ...formData, coordinatorId: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                        >
                            <option value="">Seleccionar Coordinador</option>
                            {coordinators.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-md justify-between" style={{ marginTop: '1rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Guardar</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Contracts;
