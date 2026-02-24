import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Building2, Mail, Phone, CheckCircle } from 'lucide-react';
import DocumentList from '../../components/Documents/DocumentList';
import MeetingList from '../../components/Meetings/MeetingList';
import Modal from '../../components/UI/Modal';

const ProjectDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { projects, contracts, workCenters, users, updateProject, setHeaderActions } = useApp();
    const [isAuthorizeModalOpen, setIsAuthorizeModalOpen] = React.useState(false);

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString;
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    };

    const project = projects.find(p => p.id === id);

    if (!project) return <div>Proyecto no encontrado</div>;

    const contract = contracts.find(c => c.id === project.contractId);

    const assignedCompanies = (project.companyIds || []).map(cid => users.find(u => u.id === cid)).filter(Boolean);
    const allContacts = assignedCompanies.flatMap(c => c?.contacts || []);

    const mainContact = allContacts.find(c => c.id === project.mainContactId);
    const contractManager = allContacts.find(c => c.id === project.contractManagerId);
    const selectedContacts = (project.contactIds || []).map(cid => allContacts.find(c => c.id === cid)).filter(Boolean);

    // Memoize the header action button to prevent render loops
    const headerButton = React.useMemo(() => {
        if (!project || project.documentationStatus === 'VERIFICADA') return null;

        return (
            <button
                className="btn btn-primary btn-sm"
                style={{
                    padding: '0.4rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.875rem'
                }}
                onClick={() => setIsAuthorizeModalOpen(true)}
            >
                <CheckCircle size={18} />
                Autorizar Proyecto
            </button>
        );
    }, [project?.id, project?.documentationStatus]);

    React.useEffect(() => {
        setHeaderActions(headerButton);
        return () => setHeaderActions(null);
    }, [headerButton, setHeaderActions]);

    const handleConfirmAuthorize = () => {
        if (project) {
            updateProject({ ...project, documentationStatus: 'VERIFICADA' });
            setIsAuthorizeModalOpen(false);
        }
    };

    return (
        <div>
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    marginBottom: '1rem',
                    color: 'var(--text-secondary)'
                }}
            >
                <ArrowLeft size={20} />
                Volver
            </button>

            <div className="card mb-6">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h2 style={{ marginBottom: '0.5rem' }}>{project.code} - {project.description}</h2>
                        <div className="text-secondary" style={{ marginBottom: '1rem' }}>
                            Centro: {workCenters.find(wc => wc.id === project.workCenterId)?.name || 'N/A'} | Contrato: {contract?.code}
                        </div>
                        <div className="flex" style={{ gap: '3rem' }}>
                            <div>
                                <div className="text-sm font-bold text-secondary">Fecha Solicitud</div>
                                <div>{formatDate(project.fechaSolicitud)}</div>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-secondary">Inicio</div>
                                <div>{formatDate(project.startDate)}</div>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-secondary">Finalización</div>
                                <div>{formatDate(project.endDate)}</div>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '200px' }}>
                        <div>
                            <label className="text-xs font-bold text-secondary block mb-1">Estado Empresa</label>
                            <select
                                value={project.companyStatus}
                                onChange={(e) => updateProject({ ...project, companyStatus: e.target.value as any })}
                                style={{
                                    width: '100%',
                                    padding: '0.4rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    backgroundColor: project.companyStatus === 'ACTIVA' ? '#DEF7EC' : (project.companyStatus === 'TERMINADO' ? '#FEF3C7' : '#F3F4F6'),
                                    color: project.companyStatus === 'ACTIVA' ? '#03543F' : (project.companyStatus === 'TERMINADO' ? '#92400E' : '#4B5563')
                                }}
                            >
                                <option value="INACTIVA">INACTIVA</option>
                                <option value="ACTIVA">ACTIVA</option>
                                <option value="TERMINADO">TERMINADO</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-secondary block mb-1">Estado Documentación</label>
                            <select
                                value={project.documentationStatus}
                                onChange={(e) => updateProject({ ...project, documentationStatus: e.target.value as any })}
                                style={{
                                    width: '100%',
                                    padding: '0.4rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    backgroundColor: project.documentationStatus === 'VERIFICADA' ? '#DEF7EC' : '#FDE8E8',
                                    color: project.documentationStatus === 'VERIFICADA' ? '#03543F' : '#9B1C1C'
                                }}
                            >
                                <option value="NO_VERIFICADA">NO VERIFICADA</option>
                                <option value="VERIFICADA">VERIFICADA</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <div className="text-sm font-bold text-secondary mb-2">Contacto Principal</div>
                            {mainContact ? (
                                <div>
                                    <div style={{ fontWeight: 600 }}>{mainContact.firstName} {mainContact.lastName}</div>
                                    <div className="text-sm text-secondary">{mainContact.email}</div>
                                </div>
                            ) : <div className="text-secondary text-sm">No asignado</div>}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-secondary mb-2">Responsable Contrato</div>
                            {contractManager ? (
                                <div>
                                    <div style={{ fontWeight: 600 }}>{contractManager.firstName} {contractManager.lastName}</div>
                                    <div className="text-sm text-secondary">{contractManager.email}</div>
                                </div>
                            ) : <div className="text-secondary text-sm">No asignado</div>}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-secondary mb-2">Otros Contactos</div>
                            <div className="flex flex-wrap gap-2">
                                {selectedContacts.filter(c => c && c.id !== project.mainContactId && c.id !== project.contractManagerId).map(c => c && (
                                    <div key={c.id} style={{
                                        padding: '0.25rem 0.5rem',
                                        backgroundColor: 'var(--background)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.8rem',
                                        border: '1px solid var(--border)'
                                    }}>
                                        {c.firstName} {c.lastName}
                                    </div>
                                ))}
                                {selectedContacts.length === 0 && <div className="text-secondary text-sm">Ninguno extra</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assigned Companies Info */}
            <div className="card mb-6">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Building2 size={20} className="text-primary" />
                    Empresas Asignadas
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {(project.companyIds || []).map(cid => {
                        const company = users.find(u => u.id === cid);
                        if (!company) return null;
                        return (
                            <div key={cid} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)' }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{company.name}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div className="text-sm text-secondary flex items-center gap-2">
                                        <Mail size={14} /> {company.email || 'N/A'}
                                    </div>
                                    <div className="text-sm text-secondary flex items-center gap-2">
                                        <Phone size={14} /> {company.phone || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {(project.companyIds || []).length === 0 && (
                        <p className="text-secondary text-sm italic">No hay empresas asignadas a este proyecto.</p>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                <DocumentList projectId={project.id} />
                <MeetingList projectId={project.id} />
            </div>

            {/* Custom Authorization Modal */}
            <Modal
                isOpen={isAuthorizeModalOpen}
                onClose={() => setIsAuthorizeModalOpen(false)}
                title="Autorizar Proyecto"
            >
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ marginBottom: '1rem' }}>¿Estás seguro de que deseas autorizar este proyecto? El estado de documentación pasará a <strong>VERIFICADA</strong>.</p>
                    <div style={{ padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        <p style={{ marginBottom: '0.5rem' }}><strong>Objeto del contrato:</strong> {contract?.description}</p>
                        <p style={{ marginBottom: '0.5rem' }}><strong>Centro de Trabajo:</strong> {workCenters.find(wc => wc.id === project?.workCenterId)?.name}</p>
                        <p><strong>Código Proyecto:</strong> {project?.code}</p>
                    </div>
                </div>
                <div className="flex justify-between" style={{ gap: '1rem' }}>
                    <button className="btn btn-outline" onClick={() => setIsAuthorizeModalOpen(false)}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleConfirmAuthorize}>Confirmar Autorización</button>
                </div>
            </Modal>
        </div>
    );
};

export default ProjectDetails;
