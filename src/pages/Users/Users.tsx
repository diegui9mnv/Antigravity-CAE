import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { User } from '../../types';
import { Plus, Search, User as UserIcon, Shield, ShieldAlert, Mail } from 'lucide-react';
import MeatballMenu from '../../components/UI/MeatballMenu';
import Modal from '../../components/UI/Modal';

const Users = () => {
    const { users, currentUser, addUser, updateUser, deleteUser } = useApp();
    const [searchTerm, setSearchTerm] = useState('');

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({});

    const isManager = currentUser?.role === 'MANAGER';

    // Only show Managers and Coordinators in this screen (Companies are managed elsewhere)
    const filteredUsers = users.filter(u =>
        (u.role === 'MANAGER' || u.role === 'COORDINATOR') &&
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData(user);
        } else {
            setEditingUser(null);
            setFormData({
                role: 'COORDINATOR'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingUser) {
            updateUser({ ...editingUser, ...formData } as User);
        } else {
            addUser({
                id: `temp-${Date.now()}`,
                ...formData
            } as User);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            deleteUser(id);
        }
    };

    if (!isManager) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <ShieldAlert size={48} style={{ color: 'var(--error)', margin: '0 auto 1rem' }} />
                <h2>Acceso Denegado</h2>
                <p className="text-secondary">No tienes permisos para ver esta página.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Gestión de Usuarios</h2>
                    <p className="text-secondary">Administra los accesos de gestores y coordinadores</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => handleOpenModal()}
                >
                    <Plus size={18} />
                    Nuevo Usuario
                </button>
            </div>

            <div className="card mb-6">
                <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
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
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Usuario</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Contacto</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Rol</th>
                            <th style={{ width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: user.role === 'MANAGER' ? '#FEF3C7' : '#E0E7FF',
                                            color: user.role === 'MANAGER' ? '#D97706' : '#4F46E5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {user.role === 'MANAGER' ? <Shield size={20} /> : <UserIcon size={20} />}
                                        </div>
                                        <div style={{ fontWeight: 500 }}>{user.name}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        <Mail size={16} />
                                        {user.email}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        backgroundColor: user.role === 'MANAGER' ? '#FEF3C7' : '#E0E7FF',
                                        color: user.role === 'MANAGER' ? '#D97706' : '#4F46E5'
                                    }}>
                                        {user.role === 'MANAGER' ? 'Gestor Principal' : 'Coordinador'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {currentUser?.id !== user.id && ( // Prevent self-deletion
                                        <MeatballMenu items={[
                                            { label: 'Editar', onClick: () => handleOpenModal(user) },
                                            { label: 'Borrar', onClick: () => handleDelete(user.id), variant: 'danger' }
                                        ]} />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No se encontraron usuarios.
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label className="text-sm font-bold block mb-2">Nombre Completo</label>
                        <input
                            required
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej. Ana Sánchez"
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-bold block mb-2">Correo Electrónico</label>
                        <input
                            required
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="ana@coordinator.com"
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                        />
                        {!editingUser && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                La contraseña por defecto de momento será "admin".
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-bold block mb-2">Rol del Sistema</label>
                        <select
                            required
                            value={formData.role || 'COORDINATOR'}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                        >
                            <option value="COORDINATOR">Coordinador de Seguridad</option>
                            <option value="MANAGER">Gestor Principal</option>
                        </select>
                    </div>

                    <div className="flex gap-md justify-end mt-4">
                        <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Guardar</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Users;
