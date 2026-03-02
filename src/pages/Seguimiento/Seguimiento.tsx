import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Settings, Trash2, CalendarCheck, Save, FileText, Download, Mail, CheckCircle, Pencil } from 'lucide-react';
import type { FollowUpMeeting, FollowUpMeetingConfig } from '../../types';
import Modal from '../../components/UI/Modal';
import MultiSearchableSelect from '../../components/UI/MultiSearchableSelect';
import SignaturePad from '../../components/SignaturePad';

const PROVINCES: string[] = ['MÁLAGA', 'SEVILLA', 'JAÉN', 'CÓRDOBA', 'CEUTA', 'MELILLA', 'GRANADA'];

type MeetingStatus = 'PROGRAMADA' | 'EN_CURSO' | 'REALIZADA' | 'CANCELADA';
const STATUS_COLORS: Record<MeetingStatus, string> = {
    PROGRAMADA: '#3B82F6',
    EN_CURSO: '#F59E0B',
    REALIZADA: '#10B981',
    CANCELADA: '#EF4444',
};

const BLANK_MEETING: Omit<FollowUpMeeting, 'id'> = {
    contractId: '',
    reason: '',
    date: '',
    time: '10:00',
    type: 'PRESENCIAL',
    location: '',
    status: 'PROGRAMADA',
    provinces: [],
    workCenterIds: [],
    companyIds: [],
};

const BLANK_CONFIG: Omit<FollowUpMeetingConfig, 'id' | 'meeting'> = {
    numeroReunion: 1,
    revisionInformacion: '',
    observacionesIntercambio: '',
    solapesEmpresas: '',
    accidentesTrabajo: '',
    emergencia: '',
    otrosTemas: '',
    ruegosPreguntas: '',
    signatures: [],
};

const Seguimiento: React.FC = () => {
    const {
        followUpMeetings, addFollowUpMeeting, updateFollowUpMeeting, deleteFollowUpMeeting,
        saveFollowUpConfig, generateFollowUpActa, notifyFollowUpMeeting,
        contracts, workCenters, companies, currentUser
    } = useApp();

    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<FollowUpMeeting | null>(null);
    const [form, setForm] = useState<Omit<FollowUpMeeting, 'id'>>(BLANK_MEETING);

    const [showConfigModal, setShowConfigModal] = useState(false);
    const [configMeetingId, setConfigMeetingId] = useState<string | null>(null);
    const [configForm, setConfigForm] = useState<Omit<FollowUpMeetingConfig, 'id' | 'meeting'>>(BLANK_CONFIG);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Signature Sub-modal State
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [newSignature, setNewSignature] = useState({ company: '', name: '', role: '' });

    /* ── Filters ── */
    const [filterReason, setFilterReason] = useState('');
    const [filterDateSince, setFilterDateSince] = useState('');
    const [filterDateUntil, setFilterDateUntil] = useState('');
    const [filterStatus, setFilterStatus] = useState<MeetingStatus | ''>('');
    const [filterProvinces, setFilterProvinces] = useState<string[]>([]);
    const [filterCenters, setFilterCenters] = useState<string[]>([]);
    const [filterCompanies, setFilterCompanies] = useState<string[]>([]);

    const filteredMeetings = useMemo(() => {
        return followUpMeetings.filter(m => {
            if (filterReason && !m.reason.toLowerCase().includes(filterReason.toLowerCase())) return false;
            if (filterStatus && m.status !== filterStatus) return false;
            if (filterDateSince && m.date < filterDateSince) return false;
            if (filterDateUntil && m.date > filterDateUntil) return false;

            if (filterProvinces.length > 0 && !(m.provinces || []).some(p => filterProvinces.includes(p))) return false;
            if (filterCenters.length > 0 && !(m.workCenterIds || []).some(cid => filterCenters.includes(cid))) return false;
            if (filterCompanies.length > 0 && !(m.companyIds || []).some(cid => filterCompanies.includes(cid))) return false;

            return true;
        });
    }, [followUpMeetings, filterReason, filterStatus, filterDateSince, filterDateUntil, filterProvinces, filterCenters, filterCompanies]);

    // Always derive configMeeting from the live followUpMeetings so config.id is never stale
    const configMeeting = useMemo(
        () => followUpMeetings.find(m => String(m.id) === String(configMeetingId)) ?? null,
        [followUpMeetings, configMeetingId]
    );

    // Notification state
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [notifyMeeting, setNotifyMeeting] = useState<FollowUpMeeting | null>(null);
    const [notifySelectedContacts, setNotifySelectedContacts] = useState<string[]>([]);

    // Filtered contracts for coordinators
    const userContracts = useMemo(() => {
        if (currentUser?.role === 'COORDINATOR') {
            return contracts.filter(c => c.coordinatorId === currentUser.id);
        }
        return contracts;
    }, [contracts, currentUser]);

    /* ── Meeting modal helpers ── */
    const openCreate = () => {
        setEditingMeeting(null);
        setForm({ ...BLANK_MEETING });
        setShowMeetingModal(true);
    };

    const openEdit = (m: FollowUpMeeting) => {
        setEditingMeeting(m);
        setForm({ ...m });
        setShowMeetingModal(true);
    };

    const handleSubmitMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.reason || !form.date || !form.contractId) {
            alert('Por favor, rellena los campos requeridos: Contrato, Motivo y Fecha.');
            return;
        }
        setSaving(true);
        try {
            if (editingMeeting) {
                await updateFollowUpMeeting({ ...form, id: editingMeeting.id });
            } else {
                await addFollowUpMeeting({ ...form, id: `temp-${Date.now()}` });
            }
            setShowMeetingModal(false);
        } catch (e) {
            alert('Error al guardar la reunión.');
        } finally {
            setSaving(false);
        }
    };

    /* ── Config modal helpers ── */
    const openConfig = (m: FollowUpMeeting) => {
        setConfigMeetingId(String(m.id));
        const existing = m.config;
        setConfigForm(existing ? {
            numeroReunion: existing.numeroReunion,
            revisionInformacion: existing.revisionInformacion || '',
            observacionesIntercambio: existing.observacionesIntercambio || '',
            solapesEmpresas: existing.solapesEmpresas || '',
            accidentesTrabajo: existing.accidentesTrabajo || '',
            emergencia: existing.emergencia || '',
            otrosTemas: existing.otrosTemas || '',
            ruegosPreguntas: existing.ruegosPreguntas || '',
            signatures: existing.signatures || [],
        } : { ...BLANK_CONFIG });
        setShowConfigModal(true);
    };

    const handleSubmitConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!configMeeting) return;
        setSaving(true);
        try {
            await saveFollowUpConfig({
                ...configForm,
                id: configMeeting.config?.id,
                meeting: configMeeting.id as any,
            });
            setShowConfigModal(false);
        } catch (e) {
            alert('Error al guardar la configuración del acta.');
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateActa = async () => {
        if (!configMeeting) return;
        setGenerating(true);
        try {
            // First save config, then generate acta
            await saveFollowUpConfig({
                ...configForm,
                id: configMeeting.config?.id,
                meeting: configMeeting.id as any,
            });
            await generateFollowUpActa(String(configMeeting.id));
            // Add a small delay so the user can actually see the "Success" state or the loading finish
            setTimeout(() => {
                setGenerating(false);
                setShowConfigModal(false);
            }, 500);
        } catch (e) {
            setGenerating(false);
        }
    };

    const handleDownloadActa = (m: FollowUpMeeting) => {
        if (!m.documentData) return;
        const link = document.createElement('a');
        link.href = m.documentData;
        link.download = `acta-seguimiento-${m.date}.docx`;
        link.click();
    };

    const handleAddSignature = (dataUrl: string) => {
        if (!newSignature.name.trim()) {
            alert('El nombre es obligatorio para la firma.');
            return;
        }

        const signatures = configForm.signatures || [];
        setConfigForm(f => ({
            ...f,
            signatures: [...signatures, { ...newSignature, data: dataUrl }]
        }));

        setShowSignatureModal(false);
        setNewSignature({ company: '', name: '', role: '' });
    };

    const handleRemoveSignature = (index: number) => {
        const signatures = [...(configForm.signatures || [])];
        signatures.splice(index, 1);
        setConfigForm(f => ({ ...f, signatures }));
    };

    /* ── Notification modal helpers ── */
    const openNotifyConfig = (m: FollowUpMeeting) => {
        setNotifyMeeting(m);
        const initialContacts = m.notificationContacts?.length
            ? m.notificationContacts.map(String)
            : [];
        setNotifySelectedContacts(initialContacts);
        setShowNotifyModal(true);
    };

    const handleSaveNotifyOptions = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notifyMeeting) return;
        setSaving(true);
        try {
            await updateFollowUpMeeting({
                ...notifyMeeting,
                notificationContacts: notifySelectedContacts,
            });
            setShowNotifyModal(false);
            setNotifyMeeting(null);
        } catch (e) {
            alert('Error al guardar los destinatarios.');
        } finally {
            setSaving(false);
        }
    };

    const handleNotify = async (m: FollowUpMeeting) => {
        if (m.isNotified) {
            await updateFollowUpMeeting({ ...m, isNotified: false });
            return;
        }

        if (window.confirm("¿Seguro que deseas enviar la convocatoria por correo a los destinatarios configurados?")) {
            const success = await notifyFollowUpMeeting(String(m.id));
            if (success) {
                await updateFollowUpMeeting({ ...m, isNotified: true });
                alert("Notificación enviada con éxito.");
            }
        }
    };

    /* ── Options for MultiSearchableSelect ── */
    const provinceOptions = useMemo(() => PROVINCES.map(p => ({
        id: p, label: p, searchValue: p
    })), []);

    const filteredWorkCenters = useMemo(() => workCenters.filter(wc =>
        form.provinces.length === 0 || form.provinces.includes(wc.province)
    ), [workCenters, form.provinces]);

    const workCenterOptions = useMemo(() => filteredWorkCenters.map(wc => ({
        id: wc.id, label: wc.name, subLabel: wc.province, searchValue: wc.name
    })), [filteredWorkCenters]);

    const companyOptions = useMemo(() => companies.map(c => ({
        id: c.id, label: c.name, searchValue: c.name
    })), [companies]);

    /* ── Render ── */
    return (
        <div className="p-md" style={{ position: 'relative' }}>
            {/* Loading Overlay */}
            {generating && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999,
                    color: 'white',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="flex flex-col items-center gap-4">
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '4px solid rgba(255,255,255,0.3)',
                            borderTop: '4px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <style>{`
                            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        `}</style>
                        <h3 className="text-xl font-bold">Generando Acta...</h3>
                        <p>Esto puede tardar unos segundos.</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold">Reuniones de Seguimiento</h2>
                    <p className="text-secondary">Gestión de reuniones de seguimiento de contratos.</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <Plus size={18} /> Nueva Reunión
                </button>
            </div>

            {/* Filters Bar */}
            <div style={{
                backgroundColor: 'white',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
                alignItems: 'end'
            }}>
                <div>
                    <label className="text-xs font-bold text-secondary uppercase mb-2 block">Motivo</label>
                    <input
                        style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                        value={filterReason}
                        onChange={e => setFilterReason(e.target.value)}
                        placeholder="Buscar por motivo..."
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-secondary uppercase mb-2 block">Desde</label>
                    <input
                        type="date"
                        style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                        value={filterDateSince}
                        onChange={e => setFilterDateSince(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-secondary uppercase mb-2 block">Hasta</label>
                    <input
                        type="date"
                        style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                        value={filterDateUntil}
                        onChange={e => setFilterDateUntil(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-secondary uppercase mb-2 block">Estado</label>
                    <select
                        style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem', backgroundColor: 'white' }}
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value as any)}
                    >
                        <option value="">Cualquier estado</option>
                        <option value="PROGRAMADA">PROGRAMADA</option>
                        <option value="EN_CURSO">EN CURSO</option>
                        <option value="REALIZADA">REALIZADA</option>
                        <option value="CANCELADA">CANCELADA</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-secondary uppercase mb-2 block">Provincias</label>
                    <MultiSearchableSelect
                        options={provinceOptions}
                        value={filterProvinces}
                        onChange={setFilterProvinces}
                        placeholder="Filtrar por provincia..."
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-secondary uppercase mb-2 block">Centros</label>
                    <MultiSearchableSelect
                        options={workCenterOptions}
                        value={filterCenters}
                        onChange={setFilterCenters}
                        placeholder="Filtrar por centro..."
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-secondary uppercase mb-2 block">Empresas</label>
                    <MultiSearchableSelect
                        options={companyOptions}
                        value={filterCompanies}
                        onChange={setFilterCompanies}
                        placeholder="Filtrar por empresa..."
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn btn-outline"
                        style={{ flex: 1 }}
                        onClick={() => {
                            setFilterReason('');
                            setFilterDateSince('');
                            setFilterDateUntil('');
                            setFilterStatus('');
                            setFilterProvinces([]);
                            setFilterCenters([]);
                            setFilterCompanies([]);
                        }}
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {/* Table */}
            {filteredMeetings.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <CalendarCheck size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                    <p>No hay reuniones de seguimiento creadas todavía.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Motivo</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Fecha</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Estado</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Centros</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Empresas</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMeetings.map(m => {
                                const status = m.status as MeetingStatus;
                                const centerNames = (m.workCenterIds || []).map(id => {
                                    const wc = workCenters.find(w => String(w.id) === String(id));
                                    return wc ? wc.name : null;
                                }).filter(Boolean).join(', ');

                                return (
                                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => openConfig(m)}>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ fontWeight: 'bold' }}>{m.reason}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                {m.provinces?.join(', ') || 'Sin provincia'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                                            {m.date} {m.time && <span style={{ color: 'var(--text-secondary)' }}>{m.time.split(':').slice(0, 2).join(':')}</span>}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{
                                                display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '9999px',
                                                fontSize: '0.75rem', fontWeight: 600,
                                                backgroundColor: STATUS_COLORS[status] + '22',
                                                color: STATUS_COLORS[status]
                                            }}>{m.status}</span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {centerNames || '—'}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                {(m.companyIds || []).map(cid => {
                                                    const company = companies.find(c => String(c.id) === String(cid));
                                                    return company ? (
                                                        <span
                                                            key={cid}
                                                            style={{
                                                                padding: '0.2rem 0.5rem',
                                                                backgroundColor: '#F3F4FB',
                                                                border: '1px solid #E0E7FF',
                                                                borderRadius: '4px',
                                                                fontSize: '0.7rem',
                                                                color: 'var(--primary)'
                                                            }}
                                                        >
                                                            {company.name}
                                                        </span>
                                                    ) : null;
                                                })}
                                                {(m.companyIds || []).length === 0 && <span style={{ fontStyle: 'italic', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Sin empresas</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div className="flex" style={{ flexWrap: 'nowrap', gap: '1rem', justifyContent: 'center' }}>
                                                {/* Download Acta button */}
                                                {m.documentData && (
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ padding: '0.3rem 0.6rem' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownloadActa(m);
                                                        }}
                                                        title="Descargar Acta"
                                                    >
                                                        <Download size={14} />
                                                    </button>
                                                )}

                                                {/* Complete button */}
                                                {m.status !== 'REALIZADA' && (
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.8rem' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm('¿Estás seguro de que deseas marcar esta reunión como REALIZADA? Se deshabilitarán las opciones de edición y configuración.')) {
                                                                updateFollowUpMeeting({ ...m, status: 'REALIZADA' });
                                                            }
                                                        }}
                                                        title="Completar reunión"
                                                    >
                                                        <CheckCircle size={14} /> Completar
                                                    </button>
                                                )}

                                                {/* Notification config button */}
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.3rem 0.6rem' }}
                                                    disabled={m.status === 'REALIZADA'}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openNotifyConfig(m);
                                                    }}
                                                    title={m.status === 'REALIZADA' ? "No se puede configurar una reunión realizada" : "Configurar notificación"}
                                                >
                                                    <Settings size={14} />
                                                </button>

                                                {/* Send email / notified tick */}
                                                <button
                                                    className={`btn ${m.isNotified ? 'btn-primary' : 'btn-outline'}`}
                                                    style={{ padding: '0.3rem 0.6rem' }}
                                                    disabled={m.status === 'REALIZADA'}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleNotify(m);
                                                    }}
                                                    title={m.status === 'REALIZADA' ? "No se puede notificar una reunión realizada" : (m.isNotified ? "Notificación enviada" : "Enviar notificación")}
                                                >
                                                    {m.isNotified ? <CheckCircle size={14} /> : <Mail size={14} />}
                                                </button>

                                                {/* Edit button */}
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.3rem 0.6rem' }}
                                                    disabled={m.status === 'REALIZADA'}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEdit(m);
                                                    }}
                                                    title={m.status === 'REALIZADA' ? "No se puede editar una reunión realizada" : "Editar reunión"}
                                                >
                                                    <Pencil size={14} />
                                                </button>

                                                {/* Delete button */}
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ color: 'var(--error)', padding: '0.3rem 0.6rem' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm('¿Eliminar esta reunión de seguimiento?')) deleteFollowUpMeeting(String(m.id));
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Meeting Modal ── */}
            <Modal
                isOpen={showMeetingModal}
                onClose={() => setShowMeetingModal(false)}
                title={editingMeeting ? 'Editar Reunión' : 'Nueva Reunión de Seguimiento'}
            >
                <form onSubmit={handleSubmitMeeting} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                    {/* Contrato */}
                    <div style={{ gridColumn: '1/-1' }}>
                        <label className="text-sm font-bold block mb-2">Contrato *</label>
                        <select
                            style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'white' }}
                            value={form.contractId}
                            onChange={e => setForm(f => ({ ...f, contractId: e.target.value }))}
                        >
                            <option value="">Seleccionar contrato...</option>
                            {userContracts.map(c => <option key={c.id} value={c.id}>{c.code} — {c.description}</option>)}
                        </select>
                    </div>

                    {/* Motivo */}
                    <div style={{ gridColumn: '1/-1' }}>
                        <label className="text-sm font-bold block mb-2">Motivo de reunión *</label>
                        <textarea
                            style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', resize: 'vertical', fontFamily: 'inherit' }}
                            rows={2}
                            value={form.reason}
                            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                            placeholder="Motivo de la reunión"
                        />
                    </div>

                    {/* Fecha */}
                    <div>
                        <label className="text-sm font-bold block mb-2">Fecha *</label>
                        <input
                            type="date"
                            style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            value={form.date}
                            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        />
                    </div>

                    {/* Hora */}
                    <div>
                        <label className="text-sm font-bold block mb-2">Hora</label>
                        <input
                            type="time"
                            style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            value={form.time}
                            onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                        />
                    </div>

                    {/* Tipo */}
                    <div>
                        <label className="text-sm font-bold block mb-2">Tipo de reunión</label>
                        <select
                            style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'white' }}
                            value={form.type}
                            onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                        >
                            <option value="PRESENCIAL">Presencial</option>
                            <option value="ONLINE">Online (Teams)</option>
                        </select>
                    </div>

                    {/* Enlace Teams o Lugar */}
                    {form.type === 'ONLINE' ? (
                        <div>
                            <label className="text-sm font-bold block mb-2">Enlace Teams</label>
                            <input
                                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                value={form.teamsLink || ''}
                                onChange={e => setForm(f => ({ ...f, teamsLink: e.target.value }))}
                                placeholder="https://teams.microsoft.com/..."
                                disabled={editingMeeting?.status === 'REALIZADA'}
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="text-sm font-bold block mb-2">Lugar</label>
                            <textarea
                                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', minHeight: '80px' }}
                                value={form.location || ''}
                                disabled={editingMeeting?.status === 'REALIZADA'}
                                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                                placeholder="Ej: Sala de reuniones, Planta 2..."
                            />
                        </div>
                    )}

                    {/* Provincias */}
                    <div style={{ gridColumn: '1/-1' }}>
                        <label className="text-sm font-bold block mb-2">Provincias</label>
                        <MultiSearchableSelect
                            options={provinceOptions}
                            value={form.provinces}
                            onChange={(vals) => setForm(f => ({ ...f, provinces: vals }))}
                            placeholder="Seleccionar provincias..."
                            disabled={editingMeeting?.status === 'REALIZADA'}
                        />
                    </div>

                    {/* Centros de trabajo */}
                    <div style={{ gridColumn: '1/-1' }}>
                        <label className="text-sm font-bold block mb-2">Centros de trabajo</label>
                        <MultiSearchableSelect
                            options={workCenterOptions}
                            value={form.workCenterIds}
                            onChange={(vals) => setForm(f => ({ ...f, workCenterIds: vals }))}
                            placeholder="Seleccionar centros..."
                            disabled={editingMeeting?.status === 'REALIZADA'}
                        />
                    </div>

                    {/* Empresas */}
                    <div style={{ gridColumn: '1/-1' }}>
                        <label className="text-sm font-bold block mb-2">Empresas</label>
                        <MultiSearchableSelect
                            options={companyOptions}
                            value={form.companyIds}
                            onChange={(vals) => setForm(f => ({ ...f, companyIds: vals }))}
                            placeholder="Seleccionar empresas..."
                            disabled={editingMeeting?.status === 'REALIZADA'}
                        />
                    </div>

                    <div className="flex gap-4 justify-end" style={{ gridColumn: '1/-1', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setShowMeetingModal(false)}>Cancelar</button>
                        {editingMeeting?.status !== 'REALIZADA' && (
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        )}
                    </div>
                </form>
            </Modal>

            {/* ── Acta Config Modal ── */}
            <Modal
                isOpen={showConfigModal}
                onClose={() => setShowConfigModal(false)}
                title="Configuración del Acta"
                maxWidth="1000px"
            >
                <div style={{ width: '100%' }}>
                    <p className="text-secondary mb-6">Reunión: <strong>{configMeeting?.reason}</strong> — {configMeeting?.date}</p>

                    <form onSubmit={handleSubmitConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div>
                            <label className="text-sm font-bold block mb-2">Número de Reunión</label>
                            <input
                                type="number"
                                style={{ width: '100%', maxWidth: '120px', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                min={1}
                                value={configForm.numeroReunion || ''}
                                disabled={configMeeting?.status === 'REALIZADA'}
                                onChange={e => setConfigForm(f => ({ ...f, numeroReunion: parseInt(e.target.value) || 0 }))}
                            />
                        </div>
                        {[
                            { key: 'revisionInformacion', label: 'Revisión de la información suministrada en la reunión inicial' },
                            { key: 'observacionesIntercambio', label: 'Observaciones al intercambio de información' },
                            { key: 'solapesEmpresas', label: 'Existencia de solapes entre empresas concurrentes' },
                            { key: 'accidentesTrabajo', label: 'Accidentes de trabajo' },
                            { key: 'emergencia', label: 'Emergencia' },
                            { key: 'otrosTemas', label: 'Otros temas' },
                            { key: 'ruegosPreguntas', label: 'Ruegos y preguntas' },
                        ].map(({ key, label }) => (
                            <div key={key}>
                                <label className="text-sm font-bold block mb-2">{label}</label>
                                <textarea
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        maxWidth: '100%',
                                        padding: '0.6rem',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border)',
                                        resize: 'vertical',
                                        minHeight: '80px',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                    value={(configForm as any)[key] || ''}
                                    onChange={e => setConfigForm(f => ({ ...f, [key]: e.target.value }))}
                                    placeholder="(Opcional)"
                                    disabled={configMeeting?.status === 'REALIZADA'}
                                />
                            </div>
                        ))}

                        {/* Signatures Section */}
                        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-md font-bold text-primary">Firmas del Acta</h3>
                                {configMeeting?.status !== 'REALIZADA' && (
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setShowSignatureModal(true)}
                                    >
                                        <Plus size={16} /> Añadir Firma
                                    </button>
                                )}
                            </div>

                            {(configForm.signatures || []).length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {(configForm.signatures || []).map((sig, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', backgroundColor: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{sig.name}</div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                    {sig.company && <span>{sig.company}</span>}
                                                    {sig.company && sig.role && <span> — </span>}
                                                    {sig.role && <span>{sig.role}</span>}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <img src={sig.data} alt="Firma" style={{ height: '30px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white' }} />
                                                {configMeeting?.status !== 'REALIZADA' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSignature(idx)}
                                                        style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
                                                        title="Eliminar Firma"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-secondary italic text-sm">No hay firmas añadidas. Las firmas se incluirán en la tabla de firmas del documento generado.</p>
                            )}
                        </div>

                        <div className="flex gap-4 justify-end" style={{ marginTop: '1rem' }}>
                            <button type="button" className="btn btn-outline" onClick={() => setShowConfigModal(false)}>Cerrar</button>
                            {configMeeting?.status !== 'REALIZADA' && (
                                <>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Datos'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleGenerateActa}
                                        style={{ backgroundColor: 'var(--success)', border: 'none' }}
                                        disabled={generating}
                                    >
                                        <FileText size={16} /> Generar Acta
                                    </button>
                                </>
                            )}
                        </div>
                    </form>
                </div>
            </Modal>

            {/* ── Notification Config Modal ── */}
            <Modal
                isOpen={showNotifyModal}
                onClose={() => setShowNotifyModal(false)}
                title="Opciones de Notificación"
            >
                <form onSubmit={handleSaveNotifyOptions} style={{ display: 'grid', gap: '1rem' }}>
                    <p className="text-sm text-secondary mb-2">
                        Selecciona los contactos que recibirán la convocatoria por correo electrónico cuando pulses el botón de notificar.
                    </p>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                        {notifyMeeting?.companyIds?.map(cid => {
                            const comp = companies.find(c => String(c.id) === String(cid));
                            if (!comp || !comp.contacts || comp.contacts.length === 0) return null;
                            return (
                                <div key={comp.id} style={{ marginBottom: '1rem' }}>
                                    <div className="text-sm font-bold mb-2 text-primary">{comp.name}</div>
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        {comp.contacts.map(contact => (
                                            <label key={contact.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={notifySelectedContacts.includes(String(contact.id))}
                                                    disabled={notifyMeeting?.status === 'REALIZADA'}
                                                    onChange={(e) => {
                                                        const contactId = String(contact.id);
                                                        if (e.target.checked) {
                                                            setNotifySelectedContacts([...notifySelectedContacts, contactId]);
                                                        } else {
                                                            setNotifySelectedContacts(notifySelectedContacts.filter(id => id !== contactId));
                                                        }
                                                    }}
                                                />
                                                {contact.firstName} {contact.lastName} ({contact.email})
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {(!notifyMeeting?.companyIds || notifyMeeting.companyIds.length === 0) && (
                            <div className="text-center text-sm text-secondary italic">No hay empresas asignadas a esta reunión.</div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" className="btn btn-outline" onClick={() => setShowNotifyModal(false)}>
                            {notifyMeeting?.status === 'REALIZADA' ? 'Cerrar' : 'Cancelar'}
                        </button>
                        {notifyMeeting?.status !== 'REALIZADA' && (
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Guardando...' : 'Guardar Destinatarios'}
                            </button>
                        )}
                    </div>
                </form>
            </Modal>

            {/* ── Add Signature Sub-Modal ── */}
            {showSignatureModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: 'var(--radius-md)', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 className="text-lg font-bold">Datos de la Firma</h3>

                        <div>
                            <label className="text-sm font-bold block mb-2">Empresa</label>
                            <select
                                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'white' }}
                                value={newSignature.company}
                                onChange={e => setNewSignature(s => ({ ...s, company: e.target.value }))}
                            >
                                <option value="">(Ninguna)</option>
                                {configMeeting?.companyIds?.map(cid => {
                                    const c = companies.find(comp => String(comp.id) === String(cid));
                                    return c ? <option key={c.id} value={c.name}>{c.name}</option> : null;
                                })}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-bold block mb-2">Nombre *</label>
                            <input
                                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                value={newSignature.name}
                                onChange={e => setNewSignature(s => ({ ...s, name: e.target.value }))}
                                placeholder="Nombre completo"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold block mb-2">Cargo</label>
                            <input
                                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                value={newSignature.role}
                                onChange={e => setNewSignature(s => ({ ...s, role: e.target.value }))}
                                placeholder="Ej: Recurso Preventivo, Coordinador..."
                            />
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <label className="text-sm font-bold block mb-2">Dibujar Firma</label>
                            {/* Signature Pad occupies the available space inline or over */}
                            <div style={{ position: 'relative', minHeight: '150px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                <SignaturePad
                                    isInline={true}
                                    onSave={handleAddSignature}
                                    onCancel={() => {
                                        setShowSignatureModal(false);
                                        setNewSignature({ company: '', name: '', role: '' });
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Seguimiento;
