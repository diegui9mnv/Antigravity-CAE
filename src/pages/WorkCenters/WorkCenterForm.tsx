import React, { useState, useEffect } from 'react';
import { X, Upload, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { WorkCenter, Province } from '../../types';

interface WorkCenterFormProps {
    isOpen: boolean;
    onClose: () => void;
    editingWorkCenter: WorkCenter | null;
    onCreated?: (workCenter: WorkCenter) => void;
}

const PROVINCES: Province[] = ['MÁLAGA', 'SEVILLA', 'JAÉN', 'CÓRDOBA', 'CEUTA', 'MELILLA', 'GRANADA'];

const WorkCenterForm: React.FC<WorkCenterFormProps> = ({ isOpen, onClose, editingWorkCenter, onCreated }) => {
    const { addWorkCenter, updateWorkCenter } = useApp();
    const [formData, setFormData] = useState<Omit<WorkCenter, 'id'>>({
        name: '',
        type: 'OFICINA',
        address: '',
        zipCode: '',
        phone: '',
        province: 'MÁLAGA',
        riskInfoUrl: '',
        riskInfoFileName: ''
    });

    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (editingWorkCenter) {
            const { id, ...rest } = editingWorkCenter;
            setFormData(rest);
        }
    }, [editingWorkCenter]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setFormData(prev => ({ ...prev, riskInfoFileName: e.target.files![0].name }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // In a real app we would upload the file here
        const riskInfoUrl = file ? URL.createObjectURL(file) : formData.riskInfoUrl;

        if (editingWorkCenter) {
            updateWorkCenter({
                ...formData,
                id: editingWorkCenter.id,
                riskInfoUrl
            });
        } else {
            const newWc = {
                ...formData,
                id: Math.random().toString(36).substr(2, 9),
                riskInfoUrl
            };
            addWorkCenter(newWc);
            if (onCreated) onCreated(newWc);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                animation: 'scaleIn 0.3s ease-out'
            }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'white',
                    zIndex: 1
                }}>
                    <h2 style={{ margin: 0 }}>{editingWorkCenter ? 'Editar Centro' : 'Nuevo Centro de Trabajo'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Denominación</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nombre del centro"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tipo</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    outline: 'none',
                                    backgroundColor: 'white'
                                }}
                            >
                                <option value="OFICINA">Oficina</option>
                                <option value="EMBALSE">Embalse</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Provincia</label>
                            <select
                                name="province"
                                value={formData.province}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    outline: 'none',
                                    backgroundColor: 'white'
                                }}
                            >
                                {PROVINCES.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Dirección</label>
                        <input
                            type="text"
                            name="address"
                            required
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Calle, número, etc."
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Código Postal</label>
                            <input
                                type="text"
                                name="zipCode"
                                required
                                value={formData.zipCode}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Teléfono</label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Información de riesgos</label>
                        <div style={{
                            border: '2px dashed var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '2rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            backgroundColor: file ? '#F0FDF4' : '#F8FAFC',
                            transition: 'all 0.2s'
                        }}>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    cursor: 'pointer'
                                }}
                            />
                            {file || formData.riskInfoFileName ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                    <Check size={32} color="#15803D" />
                                    <span style={{ fontWeight: 500, color: '#15803D' }}>
                                        {file ? file.name : formData.riskInfoFileName}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Haga clic para cambiar el archivo</span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                    <Upload size={32} color="var(--text-tertiary)" />
                                    <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Haz clic o arrastra un archivo</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>PDF, DOCX o Imágenes soportadas</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{
                        marginTop: '1rem',
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'flex-end',
                        position: 'sticky',
                        bottom: 0,
                        backgroundColor: 'white',
                        padding: '1rem 0'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            {editingWorkCenter ? 'Guardar Cambios' : 'Crear Centro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WorkCenterForm;
