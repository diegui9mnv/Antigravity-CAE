import React from 'react';
import { useApp } from '../../context/AppContext';
import { FileText, Upload, Trash2, Calendar, FileDown } from 'lucide-react';
import type { DocumentTemplate } from '../../types';

const Templates = () => {
    const { templates, addTemplate, deleteTemplate } = useApp();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [selectedCategory, setSelectedCategory] = React.useState('Anexo I');
    const [dragOver, setDragOver] = React.useState(false);

    const categories = [
        'Anexo I',
        'Anexo II',
        'Anexo III',
        'Anexo IV',
        'Listado de trabajadores',
        'Reuniones',
        'Otros'
    ];

    const processFiles = (files: FileList | null) => {
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Data = event.target?.result as string;
                const newTemplate: DocumentTemplate = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: `${selectedCategory} - Plantilla`,
                    category: selectedCategory,
                    fileData: base64Data,
                    fileName: file.name,
                    updatedAt: new Date().toISOString()
                };
                addTemplate(newTemplate);
            };
            reader.readAsDataURL(file);
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        processFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-md">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold">Gestión de Plantillas</h2>
                    <p className="text-secondary">Sube y gestiona las plantillas de Word para la generación automática de documentos.</p>
                </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
                <div className="card" style={{ height: 'fit-content' }}>
                    <h4 className="mb-4">Categorías</h4>
                    <div className="flex flex-col gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                                style={{ justifyContent: 'flex-start' }}
                            >
                                <FileText size={18} />
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="flex justify-between items-center mb-6">
                        <h4 style={{ margin: 0 }}>Plantillas para {selectedCategory}</h4>
                        <button
                            className="btn btn-primary"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={18} />
                            Subir Plantilla
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                            multiple
                        />
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            border: dragOver ? '2px dashed var(--primary)' : '2px dashed transparent',
                            borderRadius: 'var(--radius-md)',
                            padding: dragOver ? '1rem' : '0',
                            transition: 'all 0.2s',
                            backgroundColor: dragOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                            minHeight: '200px'
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                    >
                        {templates.filter(t => t.category === selectedCategory).map(template => (
                            <div
                                key={template.id}
                                className="flex items-center justify-between p-md"
                                style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--background)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: 'var(--surface)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--primary)',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <FileDown size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold">{template.fileName}</div>
                                        <div className="text-sm text-secondary flex items-center gap-2">
                                            <Calendar size={14} />
                                            Actualizado: {formatDate(template.updatedAt)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = template.fileData;
                                            link.download = template.fileName;
                                            link.click();
                                        }}
                                        title="Descargar"
                                    >
                                        <FileDown size={18} />
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        style={{ color: 'var(--error)' }}
                                        onClick={() => {
                                            if (window.confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
                                                deleteTemplate(template.id);
                                            }
                                        }}
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {templates.filter(t => t.category === selectedCategory).length === 0 && (
                            <div style={{
                                padding: '3rem',
                                textAlign: 'center',
                                border: '2px dashed var(--border)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-secondary)'
                            }}>
                                <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem', margin: '0 auto' }} />
                                <p>No hay plantillas subidas para esta categoría.</p>
                                <p className="text-sm">Arrastra archivos aquí o usa el botón de arriba para subir plantillas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Templates;
