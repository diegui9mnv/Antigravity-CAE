import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { ProjectDocument, DocumentStatus } from '../../types';
import { FileText, Folder, ExternalLink, AlertTriangle, Plus, Users } from 'lucide-react';
import MeatballMenu from '../UI/MeatballMenu';

interface DocumentListProps {
    projectId: string;
}

const DocumentList: React.FC<DocumentListProps> = ({ projectId }) => {
    const { documents, currentUser, addDocument, updateDocumentStatus, deleteDocument, projects, workCenters } = useApp();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedCategory, setSelectedCategory] = React.useState<string>('Otros');
    const [dragOverCategory, setDragOverCategory] = React.useState<string | null>(null);

    const project = projects.find(p => p.id === projectId);
    const workCenter = workCenters.find(wc => String(wc.id) === String(project?.workCenterId));
    const projectDocs = documents.filter(d => d.projectId === projectId);
    const isCoordinator = currentUser?.role === 'COORDINATOR';
    const isManager = currentUser?.role === 'MANAGER';
    const canManage = isCoordinator || isManager;

    const CATEGORIES = [
        'Anexo I',
        'Anexo II',
        'Anexo III',
        'Anexo IV',
        'Listado de trabajadores',
        'Información de riesgos',
        'Reuniones',
        'Otros'
    ];

    const addFiles = (files: FileList | null, category: string) => {
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Url = event.target?.result as string;
                const newDoc: ProjectDocument = {
                    id: Math.random().toString(36).substr(2, 9),
                    projectId,
                    name: file.name,
                    url: base64Url,
                    status: 'BORRADOR',
                    category: category,
                    uploadedBy: currentUser?.id || '',
                    uploadedAt: new Date().toISOString(),
                    signatures: []
                };
                addDocument(newDoc);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        addFiles(e.target.files, selectedCategory);
    };

    const handleDrop = (e: React.DragEvent, category: string) => {
        e.preventDefault();
        setDragOverCategory(null);
        addFiles(e.dataTransfer.files, category);
    };

    const handleDragOver = (e: React.DragEvent, category: string) => {
        e.preventDefault();
        setDragOverCategory(category);
    };

    const handleDragLeave = () => {
        setDragOverCategory(null);
    };

    const getStatusColor = (status: DocumentStatus) => {
        switch (status) {
            case 'BORRADOR': return 'var(--text-secondary)';
            case 'PRESENTADO': return 'var(--primary)';
            case 'ACEPTADO': return 'var(--success)';
            case 'RECHAZADO': return 'var(--error)';
            default: return 'var(--text-secondary)';
        }
    };


    return (
        <div className="card">
            <div className="flex justify-between items-center mb-4">
                <h3>Gestión Documental</h3>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleUpload}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {CATEGORIES.map(category => {
                    const docsInCategory = projectDocs.filter(d => d.category === category || (!d.category && category === 'Otros'));

                    if (category === 'Información de riesgos') {
                        return (
                            <div
                                key={category}
                                style={{
                                    border: dragOverCategory === category ? '2px dashed var(--primary)' : '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    transition: 'border 0.2s'
                                }}
                                onDragOver={(e) => handleDragOver(e, category)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, category)}
                            >
                                {dragOverCategory === category && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        zIndex: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        pointerEvents: 'none'
                                    }}>
                                        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
                                            <ExternalLink size={20} />
                                            Suelta los archivos aquí
                                        </div>
                                    </div>
                                )}
                                <div
                                    style={{
                                        padding: '0.75rem 1rem',
                                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                                        borderBottom: '1px solid var(--border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontWeight: 600
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <AlertTriangle size={18} className="text-primary" />
                                        {category}
                                        <span className="text-xs text-secondary font-normal">(Vinculado al Centro de Trabajo)</span>
                                    </div>
                                    {canManage && (
                                        <button
                                            className="btn btn-sm btn-outline"
                                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                            onClick={() => {
                                                setSelectedCategory(category);
                                                fileInputRef.current?.click();
                                            }}
                                        >
                                            <Plus size={14} /> Subir
                                        </button>
                                    )}
                                </div>
                                <div style={{ padding: '0.5rem' }}>
                                    {workCenter?.riskInfoUrl ? (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem',
                                            backgroundColor: 'var(--surface)',
                                            borderRadius: 'var(--radius-sm)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <FileText size={18} className="text-primary" />
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{workCenter.riskInfoFileName || 'Información de Riesgos'}</div>
                                                    <div className="text-xs text-secondary">Centro: {workCenter.name}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (workCenter.riskInfoUrl?.startsWith('data:')) {
                                                        const parts = workCenter.riskInfoUrl.split(';base64,');
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
                                                    } else if (workCenter.riskInfoUrl) {
                                                        window.open(workCenter.riskInfoUrl, '_blank');
                                                    }
                                                }}
                                                className="btn btn-sm btn-outline"
                                                style={{ padding: '0.4rem' }}
                                                title="Ver documento original"
                                            >
                                                <ExternalLink size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-secondary italic p-4 text-center">
                                            No se ha definido información de riesgos para este centro {workCenter?.name ? `(${workCenter.name})` : ''}.
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={category}
                            style={{
                                border: dragOverCategory === category ? '2px dashed var(--primary)' : '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                position: 'relative',
                                transition: 'border 0.2s'
                            }}
                            onDragOver={(e) => handleDragOver(e, category)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, category)}
                        >
                            {dragOverCategory === category && (
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    zIndex: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pointerEvents: 'none'
                                }}>
                                    <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
                                        <ExternalLink size={20} />
                                        Suelta los archivos aquí
                                    </div>
                                </div>
                            )}
                            <div
                                style={{
                                    padding: '0.75rem 1rem',
                                    backgroundColor: 'var(--background-alt)',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                                    {(category === 'Listado de trabajadores' || category === 'Reuniones') ? <Users size={18} className="text-secondary" /> : <Folder size={18} className="text-secondary" />}
                                    {category}
                                    <span style={{
                                        marginLeft: '0.5rem',
                                        fontSize: '0.7rem',
                                        backgroundColor: 'var(--border)',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '4px',
                                        color: 'var(--text-secondary)'
                                    }}>{docsInCategory.length}</span>
                                </div>
                                {canManage && category !== 'Información de riesgos' && (
                                    <button
                                        className="btn btn-sm btn-outline"
                                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            fileInputRef.current?.click();
                                        }}
                                    >
                                        <Plus size={14} /> Subir
                                    </button>
                                )}
                            </div>
                            <div style={{ padding: '0.5rem', display: 'grid', gap: '0.5rem' }}>
                                {docsInCategory.length === 0 ? (
                                    <div className="text-xs text-secondary italic p-4 text-center">Sin documentos.</div>
                                ) : (
                                    docsInCategory.map(doc => (
                                        <div
                                            key={doc.id}
                                            onClick={() => {
                                                if (doc.url.startsWith('data:')) {
                                                    // Convert data URI to blob for better handling of large files
                                                    const parts = doc.url.split(';base64,');
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
                                                } else {
                                                    window.open(doc.url, '_blank');
                                                }
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0.75rem',
                                                borderRadius: 'var(--radius-sm)',
                                                backgroundColor: 'var(--surface)',
                                                border: '1px solid var(--border)',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--background-alt)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--surface)';
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ color: 'var(--primary)' }}>
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{doc.name}</div>
                                                    <div className="text-xs text-secondary">
                                                        {doc.statusDate
                                                            ? `${doc.status}: ${new Date(doc.statusDate).toLocaleDateString()}`
                                                            : `Subido: ${new Date(doc.uploadedAt).toLocaleDateString()}`
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={{
                                                    padding: '0.1rem 0.5rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    backgroundColor: `${getStatusColor(doc.status)}20`,
                                                    color: getStatusColor(doc.status),
                                                    border: `1px solid ${getStatusColor(doc.status)}`
                                                }}>
                                                    {doc.status}
                                                </span>

                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <MeatballMenu
                                                        items={[
                                                            { label: 'Ver y Firmar', onClick: () => window.open(`/signing/${doc.id}?type=document`, '_blank', 'width=1200,height=900') },
                                                            { label: 'Presentar', onClick: () => updateDocumentStatus(doc.id, 'PRESENTADO') },
                                                            { label: 'Aceptar', onClick: () => updateDocumentStatus(doc.id, 'ACEPTADO') },
                                                            { label: 'Rechazar', onClick: () => updateDocumentStatus(doc.id, 'RECHAZADO'), variant: 'danger' },
                                                            ...((isCoordinator || isManager) ? [{
                                                                label: 'Eliminar',
                                                                onClick: () => {
                                                                    if (window.confirm(`¿Estás seguro de que deseas eliminar el documento "${doc.name}"?`)) {
                                                                        deleteDocument(doc.id);
                                                                    }
                                                                },
                                                                variant: 'danger' as const
                                                            }] : [])
                                                        ]}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DocumentList;
