import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { Project, User, WorkCenter } from '../../types';
import { Plus, Search, Building2, Briefcase } from 'lucide-react';
import MeatballMenu from '../../components/UI/MeatballMenu';
import Modal from '../../components/UI/Modal';
import SearchableSelect from '../../components/UI/SearchableSelect';
import MultiSearchableSelect from '../../components/UI/MultiSearchableSelect';
import WorkCenterForm from '../WorkCenters/WorkCenterForm';

const Projects = () => {
    const navigate = useNavigate();
    const { projects, contracts, users, currentUser, addProject, updateProject, deleteProject, addUser, workCenters } = useApp();
    const [searchTerm, setSearchTerm] = useState('');

    // Filter State
    const [filterCompany, setFilterCompany] = useState<string[]>([]);
    const [filterCenter, setFilterCenter] = useState<string[]>([]);
    const [filterProvince, setFilterProvince] = useState<string[]>([]);
    const [filterDocStatus, setFilterDocStatus] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');

    const labelStyle: React.CSSProperties = {
        position: 'absolute',
        left: '0.6rem',
        top: '-0.5rem',
        backgroundColor: 'white',
        padding: '0 0.25rem',
        fontSize: '0.65rem',
        color: 'var(--text-secondary)',
        fontWeight: 600,
        zIndex: 1
    };

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // Quick Add Company State
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newCompanyEmail, setNewCompanyEmail] = useState('');

    // Delete Confirmation Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    // Quick Add Work Center State
    const [isWorkCenterModalOpen, setIsWorkCenterModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Project>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canEdit = currentUser?.role === 'COORDINATOR' || currentUser?.role === 'MANAGER';

    const companies = users.filter(u => u.role === 'COMPANY');

    const [searchParams, setSearchParams] = useSearchParams();
    const contractIdFilter = searchParams.get('contractId');

    const filteredProjects = projects.filter(p => {
        // Filter by company assignment if user is a COMPANY
        if (currentUser?.role === 'COMPANY' && !(p.companyIds || []).includes(currentUser.id)) {
            return false;
        }

        // Filter by Contract ID if present in URL
        if (contractIdFilter && p.contractId !== contractIdFilter) {
            return false;
        }

        // Advanced Filters
        if (filterCompany.length > 0 && !(p.companyIds || []).some(cid => filterCompany.includes(cid))) return false;
        if (filterCenter.length > 0 && !filterCenter.includes(p.workCenterId)) return false;

        const projectWc = workCenters.find(wc => wc.id === p.workCenterId);
        if (filterProvince.length > 0 && (!projectWc || !filterProvince.includes(projectWc.province || ''))) return false;

        if (filterDocStatus && p.documentationStatus !== filterDocStatus) return false;
        if (filterDateStart && p.fechaSolicitud < filterDateStart) return false;
        if (filterDateEnd && p.fechaSolicitud > filterDateEnd) return false;

        // Search filter (global)
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            p.code.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            (workCenters.find(wc => wc.id === p.workCenterId)?.name || '').toLowerCase().includes(searchLower);

        return matchesSearch;
    }).sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
    });

    const handleOpenModal = (project?: Project) => {
        if (project) {
            setEditingProject(project);
            setFormData(project);
        } else {
            setFormData({
                code: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                fechaSolicitud: new Date().toISOString().split('T')[0],
                companyIds: [],
                contactIds: [],
                managerId: currentUser?.id,
                workCenterId: '',
                companyStatus: 'INACTIVA',
                documentationStatus: 'NO_VERIFICADA'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: contrato, centro de trabajo y empresa son obligatorios
        if (!formData.contractId || !formData.workCenterId || (formData.companyIds || []).length === 0) {
            alert('Por favor, selecciona Contrato, Centro de Trabajo y al menos una Empresa.');
            return;
        }

        setIsSubmitting(true);
        try {
            const projectData = {
                ...formData,
                code: formData.code || `PRJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
            } as Project;

            if (editingProject) {
                updateProject({ ...editingProject, ...projectData } as Project);
            } else {
                const { id, ...dataWithoutId } = projectData as any;
                await addProject({
                    id: Math.random().toString(36).substr(2, 9),
                    ...dataWithoutId
                } as Project);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Error al guardar el proyecto. Consulta la consola para más detalles.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (project: Project) => {
        setProjectToDelete(project);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (projectToDelete) {
            deleteProject(projectToDelete.id);
            setIsDeleteModalOpen(false);
            setProjectToDelete(null);
        }
    };

    const handleUpdateStatus = (projectId: string, status: Project['companyStatus']) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            updateProject({ ...project, companyStatus: status });
        }
    };

    const handleCompanySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newCompany: User = {
            id: Math.random().toString(36).substr(2, 9),
            role: 'COMPANY',
            name: newCompanyName,
            email: newCompanyEmail,
            contacts: []
        };
        addUser(newCompany);
        setIsCompanyModalOpen(false);
        setNewCompanyName('');
        setNewCompanyEmail('');

        // Auto-select the new company
        setFormData(prev => ({
            ...prev,
            companyIds: [...(prev.companyIds || []), newCompany.id]
        }));
    };

    const availableContacts = (formData.companyIds || [])
        .flatMap(companyId => {
            const company = users.find(u => u.id === companyId);
            return company?.contacts || [];
        });

    const allAvailableContacts = users.flatMap(u => u.contacts || []);

    const workCenterOptions = workCenters.map(wc => ({
        id: wc.id,
        label: `${wc.name} (${(wc.province || '').toUpperCase()}) - ${(wc.type || 'OFICINA').charAt(0) + (wc.type || 'OFICINA').slice(1).toLowerCase()}`,
        searchValue: `${wc.name} ${wc.province || ''}`
    }));

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Proyectos</h2>
                    <p className="text-secondary">Gestión de proyectos y asignación de empresas</p>
                </div>
                {canEdit && (
                    <button
                        className="btn btn-primary"
                        onClick={() => handleOpenModal()}
                    >
                        <Plus size={18} />
                        Nuevo Proyecto
                    </button>
                )}
            </div>

            <div className="card mb-6">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <span style={labelStyle}>Buscador</span>
                        <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Código/Objeto/Descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                        />
                    </div>

                    <div style={{ minWidth: '220px', position: 'relative' }}>
                        <span style={labelStyle}>Empresas</span>
                        <MultiSearchableSelect
                            options={companies.map(c => ({ id: c.id, label: c.name, searchValue: c.name }))}
                            value={filterCompany}
                            onChange={(ids) => setFilterCompany(ids)}
                            placeholder="Todas las Empresas"
                        />
                    </div>

                    <div style={{ minWidth: '220px', position: 'relative' }}>
                        <span style={labelStyle}>Centros de Trabajo</span>
                        <MultiSearchableSelect
                            options={workCenters.map(wc => ({ id: wc.id, label: wc.name, searchValue: wc.name }))}
                            value={filterCenter}
                            onChange={(ids) => setFilterCenter(ids)}
                            placeholder="Todos los Centros"
                        />
                    </div>

                    <div style={{ minWidth: '220px', position: 'relative' }}>
                        <span style={labelStyle}>Provincia</span>
                        <MultiSearchableSelect
                            options={['MÁLAGA', 'SEVILLA', 'JAÉN', 'CÓRDOBA', 'CEUTA', 'MELILLA', 'GRANADA'].map(p => ({ id: p, label: p, searchValue: p }))}
                            value={filterProvince}
                            onChange={(ids) => setFilterProvince(ids)}
                            placeholder="Todas las Provincias"
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <span style={labelStyle}>Estado documentación</span>
                        <select
                            value={filterDocStatus}
                            onChange={(e) => setFilterDocStatus(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                                fontSize: filterDocStatus === '' ? '0.75rem' : '0.875rem',
                                backgroundColor: 'white',
                                color: filterDocStatus === '' ? 'var(--text-secondary)' : 'inherit'
                            }}
                        >
                            <option value="">Selecciona estado documentación</option>
                            <option value="NO_VERIFICADA" style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>No Verificada</option>
                            <option value="VERIFICADA" style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>Verificada</option>
                        </select>
                    </div>

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={labelStyle}>Fecha solicitud (Desde - Hasta)</span>
                        <div style={{ display: 'flex', gap: '0.25rem', width: '100%', alignItems: 'center' }}>
                            <input
                                type="date"
                                value={filterDateStart}
                                onChange={(e) => setFilterDateStart(e.target.value)}
                                style={{ padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8rem', width: '50%' }}
                            />
                            <span className="text-secondary" style={{ fontSize: '0.75rem' }}>-</span>
                            <input
                                type="date"
                                value={filterDateEnd}
                                onChange={(e) => setFilterDateEnd(e.target.value)}
                                style={{ padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8rem', width: '50%' }}
                            />
                        </div>
                    </div>

                </div>
                {(searchTerm || filterCompany.length > 0 || filterCenter.length > 0 || filterDocStatus || filterDateStart || filterDateEnd) && (
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            className="text-primary text-sm font-bold"
                            onClick={() => {
                                setSearchTerm('');
                                setFilterCompany([]);
                                setFilterCenter([]);
                                setFilterProvince([]);
                                setFilterDocStatus('');
                                setFilterDateStart('');
                                setFilterDateEnd('');
                            }}
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                )}
            </div>

            {contractIdFilter && (
                <div style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#EEF2FF',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid var(--primary-light)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                        <Briefcase size={16} />
                        <span style={{ fontWeight: 500 }}>
                            Mostrando proyectos del Contrato: {contracts.find(c => c.id === contractIdFilter)?.code || 'Desconocido'}
                        </span>
                    </div>
                    <button
                        className="btn btn-sm btn-outline"
                        onClick={() => setSearchParams({})}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', height: 'auto' }}
                    >
                        Limpiar Filtro
                    </button>
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Código</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Objeto del contrato</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Centro de Trabajo</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Provincia</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', minWidth: '120px' }}>Solicitud</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Contacto Principal</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Resp. Contrato</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Estado Empresa</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', minWidth: '140px' }}>Documentación</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Empresas</th>
                            <th style={{ width: '150px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProjects.map(project => (
                            <tr
                                key={project.id}
                                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                                onClick={() => navigate(`/projects/${project.id}`)}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <td style={{ padding: '1rem', fontWeight: 500 }}>{project.code || '-'}</td>
                                <td style={{ padding: '1rem' }}>{project.description}</td>
                                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                    {workCenters.find(wc => wc.id === project.workCenterId)?.name || 'N/A'}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                    {workCenters.find(wc => wc.id === project.workCenterId)?.province || 'N/A'}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                    {project.fechaSolicitud ? project.fechaSolicitud.split('-').reverse().join('/') : '-'}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                    {(() => {
                                        const contact = allAvailableContacts.find(c => c.id === project.mainContactId);
                                        if (!contact) return '-';
                                        const company = users.find(u => u.contacts?.some(c => c.id === contact.id));
                                        return (
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/companies?expand=${company?.id}`);
                                                }}
                                                style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                                            >
                                                {contact.firstName} {contact.lastName}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                    {(() => {
                                        const contact = allAvailableContacts.find(c => c.id === project.contractManagerId);
                                        if (!contact) return '-';
                                        const company = users.find(u => u.contacts?.some(c => c.id === contact.id));
                                        return (
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/companies?expand=${company?.id}`);
                                                }}
                                                style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                                            >
                                                {contact.firstName} {contact.lastName}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        display: 'inline-block',
                                        backgroundColor: project.companyStatus === 'ACTIVA' ? '#DEF7EC' : (project.companyStatus === 'TERMINADO' ? '#FEF3C7' : '#F3F4F6'),
                                        color: project.companyStatus === 'ACTIVA' ? '#03543F' : (project.companyStatus === 'TERMINADO' ? '#92400E' : '#4B5563')
                                    }}>
                                        {project.companyStatus}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        display: 'inline-block',
                                        backgroundColor: project.documentationStatus === 'VERIFICADA' ? '#DEF7EC' : '#FDE8E8',
                                        color: project.documentationStatus === 'VERIFICADA' ? '#03543F' : '#9B1C1C'
                                    }}>
                                        {project.documentationStatus === 'VERIFICADA' ? 'VERIFICADA' : 'NO VERIFICADA'}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {(project.companyIds || []).map(cid => {
                                            const company = users.find(u => u.id === cid);
                                            if (!company) return null;
                                            return (
                                                <span
                                                    key={cid}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/companies?expand=${cid}`);
                                                    }}
                                                    style={{
                                                        padding: '0.2rem 0.6rem',
                                                        backgroundColor: '#F3F4FB',
                                                        border: '1px solid #E0E7FF',
                                                        borderRadius: 'var(--radius-sm)',
                                                        color: 'var(--primary)',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#E0E7FF';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#F3F4FB';
                                                    }}
                                                >
                                                    {company.name}
                                                </span>
                                            );
                                        })}
                                        {(project.companyIds || []).length === 0 && <span className="text-secondary italic">Sin empresas</span>}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                        {canEdit && (
                                            <>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(project.id, 'ACTIVA'); }}
                                                    disabled={project.companyStatus === 'ACTIVA'}
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        padding: '0.25rem 0.5rem',
                                                        height: 'auto',
                                                        backgroundColor: project.companyStatus === 'ACTIVA' ? '#E5E7EB' : '#DEF7EC',
                                                        color: project.companyStatus === 'ACTIVA' ? '#9CA3AF' : '#03543F',
                                                        border: 'none',
                                                        cursor: project.companyStatus === 'ACTIVA' ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    Activar
                                                </button>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(project.id, 'TERMINADO'); }}
                                                    disabled={project.companyStatus === 'TERMINADO'}
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        padding: '0.25rem 0.5rem',
                                                        height: 'auto',
                                                        backgroundColor: project.companyStatus === 'TERMINADO' ? '#E5E7EB' : '#FEF3C7',
                                                        color: project.companyStatus === 'TERMINADO' ? '#9CA3AF' : '#92400E',
                                                        border: 'none',
                                                        cursor: project.companyStatus === 'TERMINADO' ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    Terminar
                                                </button>
                                                <MeatballMenu items={[
                                                    { label: 'Editar', onClick: () => handleOpenModal(project) },
                                                    { label: 'Borrar', onClick: () => handleDeleteClick(project), variant: 'danger' as const }
                                                ]} />
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Project Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <div className="flex gap-md">
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Código</label>
                            <input
                                type="text"
                                placeholder="Auto-generado si vacío"
                                value={formData.code || ''}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Fecha Solicitud</label>
                            <input
                                required
                                type="date"
                                value={formData.fechaSolicitud || ''}
                                onChange={e => setFormData({ ...formData, fechaSolicitud: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                    </div>



                    <div>
                        <label className="text-sm font-bold block mb-2">Contrato Asociado</label>
                        <select
                            required
                            value={formData.contractId || ''}
                            onChange={e => setFormData({ ...formData, contractId: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                        >
                            <option value="">Seleccionar Contrato</option>
                            {contracts.map(c => (
                                <option key={c.id} value={c.id}>{c.code} - {c.description}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-bold block mb-2">Objeto del contrato</label>
                        <input
                            type="text"
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold block">Centro de Trabajo</label>
                            <button
                                type="button"
                                className="text-primary text-sm flex items-center gap-1"
                                onClick={() => setIsWorkCenterModalOpen(true)}
                            >
                                <Plus size={14} /> Nuevo Centro
                            </button>
                        </div>
                        <SearchableSelect
                            options={workCenterOptions}
                            value={formData.workCenterId || ''}
                            onChange={(id) => setFormData({ ...formData, workCenterId: id })}
                            placeholder="Seleccionar Centro de Trabajo..."
                        />
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
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold block">Empresas Asignadas *</label>
                            <button
                                type="button"
                                className="text-primary text-sm flex items-center gap-1"
                                onClick={() => setIsCompanyModalOpen(true)}
                            >
                                <Plus size={14} /> Nueva Empresa
                            </button>
                        </div>
                        <MultiSearchableSelect
                            options={companies.map(c => ({ id: c.id, label: c.name, searchValue: c.name }))}
                            value={formData.companyIds || []}
                            onChange={(ids) => setFormData({ ...formData, companyIds: ids })}
                            placeholder="Seleccionar empresas..."
                        />
                    </div>

                    <div className="flex gap-md">
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Contactos</label>
                            <MultiSearchableSelect
                                options={availableContacts.map(c => ({ id: c.id, label: `${c.firstName} ${c.lastName}`, searchValue: `${c.firstName} ${c.lastName}` }))}
                                value={formData.contactIds || []}
                                onChange={(ids) => setFormData({ ...formData, contactIds: ids })}
                                placeholder="Seleccionar contactos..."
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Contacto principal</label>
                            <select
                                value={formData.mainContactId || ''}
                                onChange={e => setFormData({ ...formData, mainContactId: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'white' }}
                            >
                                <option value="">Seleccionar...</option>
                                {availableContacts.map(c => (
                                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                ))}
                            </select>

                            <label className="text-sm font-bold block mt-3 mb-2">Responsable del contrato</label>
                            <select
                                value={formData.contractManagerId || ''}
                                onChange={e => setFormData({ ...formData, contractManagerId: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'white' }}
                            >
                                <option value="">Seleccionar...</option>
                                {availableContacts.map(c => (
                                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-md justify-between" style={{ marginTop: '1rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Quick Add Company Modal */}
            <Modal
                isOpen={isCompanyModalOpen}
                onClose={() => setIsCompanyModalOpen(false)}
                title="Nueva Empresa"
            >
                <form onSubmit={handleCompanySubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{
                        padding: '1rem',
                        backgroundColor: '#EEF2FF',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <Building2 size={24} className="text-primary" />
                        <div className="text-sm text-secondary">
                            Esta empresa estará disponible inmediatamente para asignarla al proyecto.
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold block mb-2">Razón Social</label>
                        <input
                            required
                            type="text"
                            value={newCompanyName}
                            onChange={e => setNewCompanyName(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-bold block mb-2">Correo electrónico</label>
                        <input
                            required
                            type="email"
                            value={newCompanyEmail}
                            onChange={e => setNewCompanyEmail(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                        />
                    </div>

                    <div className="flex gap-md justify-between" style={{ marginTop: '1rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setIsCompanyModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Crear Empresa</button>
                    </div>
                </form>
            </Modal>

            {/* Quick Add Work Center Modal */}
            <WorkCenterForm
                isOpen={isWorkCenterModalOpen}
                onClose={() => setIsWorkCenterModalOpen(false)}
                editingWorkCenter={null}
                onCreated={(newWc: WorkCenter) => {
                    setFormData(prev => ({ ...prev, workCenterId: newWc.id }));
                }}
            />

            {/* Custom Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Borrar Proyecto"
            >
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ marginBottom: '1rem' }}>¿Estás seguro de que deseas borrar este proyecto? Esta acción no se puede deshacer.</p>
                    <div style={{ padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        <p><strong>Objeto del contrato:</strong> {projectToDelete?.description}</p>
                        <p><strong>Centro de Trabajo:</strong> {workCenters.find(wc => wc.id === projectToDelete?.workCenterId)?.name}</p>
                    </div>
                </div>
                <div className="flex justify-between">
                    <button className="btn btn-outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
                    <button className="btn btn-danger" onClick={confirmDelete}>Borrar Proyecto</button>
                </div>
            </Modal>
        </div>
    );
};

export default Projects;
