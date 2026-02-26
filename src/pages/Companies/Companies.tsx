import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { CompanyContact } from '../../types';
import api from '../../services/api';
import { Plus, Search, Building2, UserPlus, Mail, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import Modal from '../../components/UI/Modal';
import MeatballMenu from '../../components/UI/MeatballMenu';

const Companies = () => {
    const { currentUser, companies, addCompany, updateCompany, deleteCompany } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [contactForm, setContactForm] = useState<Partial<CompanyContact>>({});
    const [editingContactId, setEditingContactId] = useState<string | null>(null);
    const [searchParams] = useSearchParams();
    const expandId = searchParams.get('expand');

    useEffect(() => {
        if (expandId) {
            setSelectedCompanyId(expandId);
            setTimeout(() => {
                const element = document.getElementById(`company-${expandId}`);
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [expandId]);

    const canEdit = currentUser?.role === 'MANAGER' || currentUser?.role === 'COORDINATOR';

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.cif || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (company?: any) => {
        if (company) {
            setFormData(company);
        } else {
            setFormData({});
        }
        setIsModalOpen(true);
    };

    const handleDeleteCompany = async (id: string) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta empresa?')) {
            try {
                await api.delete(`/companies/${id}/`);
                deleteCompany(id);
            } catch (error) {
                console.error("Error deleting company:", error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData.id) {
                const res = await api.put(`/companies/${formData.id}/`, formData);
                updateCompany(res.data);
            } else {
                const res = await api.post('/companies/', formData);
                addCompany(res.data);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving company:", error);
        }
    };

    const handleOpenContactModal = (contact?: CompanyContact) => {
        if (contact) {
            setContactForm(contact);
            setEditingContactId(contact.id);
        } else {
            setContactForm({});
            setEditingContactId(null);
        }
        setIsContactModalOpen(true);
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingContactId) {
                await api.put(`/contacts/${editingContactId}/`, contactForm);
            } else {
                await api.post('/contacts/', { ...contactForm, company: selectedCompanyId });
            }
            // Temporarily not reloading companies fully since we don't have loadCompanies anymore.
            // Ideally, we'd update the specific company's contacts array.
            // We can just rely on user refreshing if they want to see updated contacts, or update it manually
            // For now, reloading window is the easiest fix to refresh global state
            window.location.reload();
            setIsContactModalOpen(false);
            setContactForm({});
        } catch (error) {
            console.error("Error saving contact:", error);
        }
    };

    const handleDeleteContact = async (contactId: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este contacto?')) return;
        try {
            await api.delete(`/contacts/${contactId}/`);
            window.location.reload();
        } catch (error) {
            console.error("Error deleting contact:", error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Empresas</h2>
                    <p className="text-secondary">Gestión de empresas colaboradoras</p>
                </div>
                {canEdit && (
                    <button
                        className="btn btn-primary"
                        onClick={() => handleOpenModal()}
                    >
                        <Plus size={18} />
                        Nueva Empresa
                    </button>
                )}
            </div>

            <div className="card mb-6">
                <div style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar empresas..."
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

            <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                {filteredCompanies.map(company => (
                    <div key={company.id} id={`company-${company.id}`} style={{ display: 'grid', gap: '0.5rem' }}>
                        <div
                            className="card"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                borderLeft: selectedCompanyId === company.id ? '4px solid var(--primary)' : '1px solid var(--border)'
                            }}
                            onClick={() => setSelectedCompanyId(selectedCompanyId === company.id ? null : company.id)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    padding: '0.75rem',
                                    borderRadius: '50%',
                                    backgroundColor: '#EEF2FF',
                                    color: 'var(--primary)'
                                }}>
                                    <Building2 size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{company.name}</div>
                                    <div className="text-secondary text-sm">{company.cif} | {company.email}</div>
                                    <div className="text-secondary text-sm">{(company.contacts || []).length} Contactos registrados</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {selectedCompanyId === company.id ? <ChevronUp size={20} className="text-secondary" /> : <ChevronDown size={20} className="text-secondary" />}
                                {canEdit && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <MeatballMenu
                                            items={[
                                                { label: 'Editar Empresa', onClick: () => handleOpenModal(company) },
                                                { label: 'Eliminar Empresa', onClick: () => handleDeleteCompany(company.id), variant: 'danger' }
                                            ]}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedCompanyId === company.id && (
                            <div style={{
                                marginLeft: '2rem',
                                padding: '1.5rem',
                                backgroundColor: 'var(--background-alt)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                animation: 'slideDown 0.2s ease-out'
                            }}>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 style={{ margin: 0 }}>Contactos de {company.name}</h4>
                                    {canEdit && (
                                        <button
                                            className="btn btn-sm btn-outline text-primary border-primary"
                                            onClick={() => handleOpenContactModal()}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <UserPlus size={16} /> Nuevo Contacto
                                        </button>
                                    )}
                                </div>

                                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                    {(company.contacts || []).length > 0 ? (
                                        (company.contacts || []).map((contact: any) => (
                                            <div key={contact.id} className="card" style={{ padding: '1rem', position: 'relative', border: '1px solid var(--border)' }}>
                                                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{contact.firstName} {contact.lastName}</div>
                                                <div className="text-sm text-secondary mb-1 flex items-center gap-2">
                                                    <Mail size={14} /> {contact.email}
                                                </div>
                                                {contact.phone && (
                                                    <div className="text-sm text-secondary mb-1 flex items-center gap-2">
                                                        <Phone size={14} /> {contact.phone}
                                                    </div>
                                                )}
                                                {contact.position && (
                                                    <div className="text-xs font-bold text-primary uppercase mt-2">
                                                        {contact.position}
                                                    </div>
                                                )}
                                                {canEdit && (
                                                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                                                        <MeatballMenu
                                                            items={[
                                                                { label: 'Editar Contacto', onClick: () => handleOpenContactModal(contact) },
                                                                { label: 'Eliminar Contacto', onClick: () => handleDeleteContact(contact.id), variant: 'danger' }
                                                            ]}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-secondary text-sm italic py-4">No hay contactos registrados para esta empresa.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Entity Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={formData.id ? "Editar Empresa" : "Nueva Empresa"}
            >
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <div className="flex gap-md">
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Razón Social</label>
                            <input
                                required
                                type="text"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">CIF</label>
                            <input
                                type="text"
                                value={formData.cif || ''}
                                onChange={e => setFormData({ ...formData, cif: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                    </div>

                    <div className="flex gap-md">
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Correo electrónico</label>
                            <input
                                type="email"
                                value={formData.email || ''}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Teléfono</label>
                            <input
                                type="tel"
                                value={formData.phone || ''}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Vista Previa de Contactos</h4>
                        <div className="contacts-list">
                            {(formData.contacts || []).map((contact: any) => (
                                <div key={contact.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                                    <div>
                                        <strong>{contact.firstName} {contact.lastName}</strong> ({contact.position || 'Sin cargo'})
                                        <div className="text-secondary">{contact.email}</div>
                                    </div>
                                </div>
                            ))}
                            {(formData.contacts || []).length === 0 && <div className="text-secondary text-sm italic">Sin contactos iniciales. Se podrán añadir después desde la vista de desglose.</div>}
                        </div>
                    </div>

                    <div className="flex gap-md justify-between" style={{ marginTop: '1rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Guardar Empresa</button>
                    </div>
                </form>
            </Modal>

            {/* Contact Modal */}
            <Modal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                title={editingContactId ? "Editar Contacto" : "Nuevo Contacto"}
            >
                <form onSubmit={handleContactSubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <div className="flex gap-md">
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Nombre</label>
                            <input
                                required
                                type="text"
                                value={contactForm.firstName || ''}
                                onChange={e => setContactForm({ ...contactForm, firstName: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Apellidos</label>
                            <input
                                type="text"
                                value={contactForm.lastName || ''}
                                onChange={e => setContactForm({ ...contactForm, lastName: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold block mb-2">Correo electrónico</label>
                        <input
                            required
                            type="email"
                            value={contactForm.email || ''}
                            onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                        />
                    </div>

                    <div className="flex gap-md">
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Cargo</label>
                            <input
                                type="text"
                                value={contactForm.position || ''}
                                onChange={e => setContactForm({ ...contactForm, position: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Teléfono</label>
                            <input
                                type="tel"
                                value={contactForm.phone || ''}
                                onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                    </div>

                    <div className="flex gap-md justify-between" style={{ marginTop: '1rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setIsContactModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Guardar Contacto</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Companies;
