import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Meeting } from '../../types';
import { FileText, Plus, Eye, CheckCircle, MapPin, Video, Clock, Calendar, Users, Mail, Settings } from 'lucide-react';
import Modal from '../UI/Modal';
import { jsPDF } from 'jspdf';

interface MeetingListProps {
    projectId: string;
}

const MeetingList: React.FC<MeetingListProps> = ({ projectId }) => {
    const { meetings, addMeeting, updateMeeting, notifyMeeting, companies, projects, contracts, users, currentUser, workCenters } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Meeting>>({});
    const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);

    const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
    const [notifyMeetingId, setNotifyMeetingId] = useState<string | null>(null);
    const [notifySelectedContacts, setNotifySelectedContacts] = useState<string[]>([]);

    const projectMeetings = meetings.filter(m => m.projectId === projectId);
    const project = projects.find(p => p.id === projectId);
    const workCenter = workCenters.find(wc => wc.id === project?.workCenterId);

    const isCoordinator = currentUser?.role === 'COORDINATOR';
    const isManager = currentUser?.role === 'MANAGER';
    const canManage = isCoordinator || isManager;

    const handleOpenModal = (meeting?: Meeting) => {
        if (meeting) {
            setFormData(meeting);
            setEditingMeetingId(meeting.id);
        } else {
            setFormData({
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                time: '10:00',
                status: 'PROGRAMADA',
                type: 'PRESENCIAL',
                location: workCenter?.name || '',
                attendees: [],
                minutes: ''
            });
            setEditingMeetingId(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMeetingId) {
            updateMeeting({
                ...formData
            } as Meeting);
        } else {
            const defaultContacts = [project?.mainContactId, project?.contractManagerId].filter(Boolean) as string[];
            addMeeting({
                id: `temp-${Math.random().toString(36).substr(2, 9)}`,
                projectId,
                notificationContacts: defaultContacts,
                ...formData
            } as Meeting);
        }
        setIsModalOpen(false);
    };

    const handleOpenNotifyModal = (meeting: Meeting) => {
        const initialContacts = meeting.notificationContacts?.length
            ? meeting.notificationContacts
            : [project?.mainContactId, project?.contractManagerId].filter(Boolean) as string[];
        setNotifySelectedContacts(initialContacts);
        setNotifyMeetingId(meeting.id);
        setIsNotifyModalOpen(true);
    };

    const handleSaveNotifyOptions = async (e: React.FormEvent) => {
        e.preventDefault();
        const meeting = meetings.find(m => m.id === notifyMeetingId);
        if (meeting) {
            await updateMeeting({ ...meeting, notificationContacts: notifySelectedContacts });
        }
        setIsNotifyModalOpen(false);
        setNotifyMeetingId(null);
    };

    const handleNotify = async (meeting: Meeting) => {
        if (meeting.isNotified) {
            await updateMeeting({ ...meeting, isNotified: false });
            return;
        }

        if (window.confirm("¿Seguro que deseas enviar la convocatoria por correo a los destinatarios configurados?")) {
            const success = await notifyMeeting(meeting.id);
            if (success) {
                await updateMeeting({ ...meeting, isNotified: true });
            }
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString;
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    };

    const generatePDF = (meeting: Meeting) => {
        const doc = new jsPDF();
        const contract = contracts.find(c => c.id === project?.contractId);

        doc.setFontSize(20);
        doc.text('Acta de Reunión', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`Proyecto: ${project?.description}`, 20, 40);
        doc.text(`Contrato: ${contract?.code}`, 20, 50);
        doc.text(`Fecha: ${formatDate(meeting.startDate)} ${meeting.startDate !== meeting.endDate ? `- ${formatDate(meeting.endDate)}` : ''}`, 20, 60);
        doc.text(`Hora: ${meeting.time}`, 20, 70);
        doc.text(`Tipo: ${meeting.type}`, 20, 80);
        doc.text(`Lugar: ${meeting.location}`, 20, 90);
        doc.text(`Motivo: ${meeting.reason}`, 20, 100);

        doc.text('Asistentes:', 20, 120);
        const coordinator = users.find(u => u.id === project?.managerId);
        doc.text(`- ${coordinator?.name} (Coordinador)`, 30, 130);

        let y = 140;
        project?.companyIds.forEach(cId => {
            const comp = users.find(u => u.id === cId);
            if (comp) {
                doc.text(`- ${comp.name} (Empresa)`, 30, y);
                y += 10;
            }
        });

        if (meeting.minutes) {
            y += 10;
            doc.setFont('helvetica', 'bold');
            doc.text('Minutas / Notas:', 20, y);
            doc.setFont('helvetica', 'normal');
            y += 10;
            const splitText = doc.splitTextToSize(meeting.minutes, 170);
            doc.text(splitText, 20, y);
            y += (splitText.length * 7);
        }

        doc.text('Firmas:', 20, y + 20);
        doc.line(30, y + 40, 90, y + 40);
        doc.text('Coordinador', 30, y + 45);

        doc.line(110, y + 40, 170, y + 40);
        doc.text('Empresa', 110, y + 45);

        doc.save(`acta-reunion-${meeting.startDate}.pdf`);
    };

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-4">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} className="text-primary" />
                    Reuniones
                </h3>
                {canManage && (
                    <button
                        className="btn btn-primary"
                        onClick={() => handleOpenModal()}
                    >
                        <Plus size={16} />
                        Nueva Reunión
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {projectMeetings.length === 0 ? (
                    <p className="text-secondary text-center py-4">No hay reuniones registradas.</p>
                ) : (
                    projectMeetings.sort((a, b) => b.startDate.localeCompare(a.startDate)).map(meeting => (
                        <div key={meeting.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)', overflow: 'hidden' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1rem'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        padding: '0.5rem',
                                        borderRadius: '50%',
                                        backgroundColor: '#EEF2FF',
                                        color: 'var(--primary)'
                                    }}>
                                        {meeting.type === 'ONLINE' ? <Video size={20} /> : <MapPin size={20} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{meeting.reason}</div>
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                            <div className="text-sm text-secondary flex items-center gap-1">
                                                <Calendar size={14} /> {formatDate(meeting.startDate)}
                                            </div>
                                            <div className="text-sm text-secondary flex items-center gap-1">
                                                <Clock size={14} /> {meeting.time}
                                            </div>
                                            <div className="text-sm text-secondary flex items-center gap-1">
                                                <MapPin size={14} /> {meeting.location}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <div style={{
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '100px',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        backgroundColor: meeting.status === 'REALIZADA' ? '#DEF7EC' : (meeting.status === 'CANCELADA' ? '#FDE8E8' : '#FEF3C7'),
                                        color: meeting.status === 'REALIZADA' ? '#03543F' : (meeting.status === 'CANCELADA' ? '#9B1C1C' : '#92400E'),
                                        marginRight: '0.5rem'
                                    }}>
                                        {meeting.status}
                                    </div>

                                    {meeting.status === 'REALIZADA' ? (
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => window.open(`/signing/${meeting.id}?type=meeting`, '_blank', 'width=1200,height=900')}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '32px' }}
                                        >
                                            <Eye size={16} />
                                            Ver y Firmar
                                        </button>
                                    ) : (
                                        isCoordinator && (
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => {
                                                    if (window.confirm('¿Estás seguro de que deseas cerrar la reunión y abrir el acta para firma?')) {
                                                        updateMeeting({ ...meeting, status: 'REALIZADA' });
                                                        window.open(`/signing/${meeting.id}?type=meeting`, '_blank', 'width=1200,height=900');
                                                    }
                                                }}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '32px' }}
                                            >
                                                <CheckCircle size={16} />
                                                Cerrar y Firmar
                                            </button>
                                        )
                                    )}

                                    {isCoordinator && meeting.status !== 'REALIZADA' && meeting.status !== 'CANCELADA' && (
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => handleOpenModal(meeting)}
                                            style={{ height: '32px' }}
                                        >
                                            Editar
                                        </button>
                                    )}
                                    {canManage && meeting.status === 'PROGRAMADA' && (
                                        <>
                                            <button
                                                className={`btn ${meeting.isNotified ? 'btn-primary' : 'btn-outline'}`}
                                                onClick={() => handleNotify(meeting)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '32px' }}
                                                title={meeting.isNotified ? "Notificación enviada" : "Notificar Reunión"}
                                            >
                                                {meeting.isNotified ? <CheckCircle size={16} /> : <Mail size={16} />}
                                            </button>
                                            <button
                                                className="btn btn-outline"
                                                onClick={() => handleOpenNotifyModal(meeting)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '32px' }}
                                                title="Opciones de notificación"
                                            >
                                                <Settings size={16} />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => generatePDF(meeting)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '32px' }}
                                        title="Descargar Acta PDF"
                                    >
                                        <FileText size={16} />
                                    </button>
                                </div>
                            </div>
                            {meeting.type === 'ONLINE' && meeting.teamsLink && (
                                <div style={{ padding: '0 1rem 0.75rem 4rem' }}>
                                    <a
                                        href={meeting.teamsLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    >
                                        <Video size={12} /> Unirse a la reunión (Teams)
                                    </a>
                                </div>
                            )}
                            {
                                (meeting.signatures || []).length > 0 && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderTop: '1px solid var(--border)', backgroundColor: '#F9FAFB' }}>
                                        <b>Firmas:</b> {meeting.signatures?.map(s => `${s.userName} (${s.role})`).join(', ')}
                                    </div>
                                )
                            }
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingMeetingId ? "Editar Reunión" : "Nueva Reunión"}
            >
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.2rem' }}>
                    <div>
                        <label className="text-sm font-bold block mb-2">Motivo / Título de la Reunión</label>
                        <input
                            required
                            type="text"
                            value={formData.reason || ''}
                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                        />
                    </div>

                    <div className="flex gap-md">
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Tipo de Reunión</label>
                            <select
                                value={formData.type || 'PRESENCIAL'}
                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'white' }}
                            >
                                <option value="PRESENCIAL">Presencial</option>
                                <option value="ONLINE">Online (Teams)</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Hora</label>
                            <input
                                required
                                type="time"
                                value={formData.time || ''}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                    </div>

                    {formData.type === 'ONLINE' ? (
                        <div>
                            <label className="text-sm font-bold block mb-2">Enlace Microsoft Teams</label>
                            <input
                                type="url"
                                placeholder="https://teams.microsoft.com/l/meetup-join/..."
                                value={formData.teamsLink || ''}
                                onChange={e => setFormData({ ...formData, teamsLink: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="text-sm font-bold block mb-2">Lugar de la Reunión</label>
                            <input
                                required
                                type="text"
                                placeholder="Ej: Sala de juntas, Planta 1..."
                                value={formData.location || ''}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                    )}

                    <div className="flex gap-md">
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Fecha Inicio</label>
                            <input
                                required
                                type="date"
                                value={formData.startDate || ''}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-sm font-bold block mb-2">Fecha Fin</label>
                            <input
                                required
                                type="date"
                                value={formData.endDate || ''}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold block mb-2">Minutas / Notas de la Reunión</label>
                        <textarea
                            value={formData.minutes || ''}
                            onChange={e => setFormData({ ...formData, minutes: e.target.value })}
                            rows={5}
                            placeholder="Escribe aquí los acuerdos alcanzados y puntos tratados..."
                            style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                        />
                    </div>

                    <div className="flex gap-md justify-between" style={{ marginTop: '1rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">{editingMeetingId ? "Actualizar Reunión" : "Programar"}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isNotifyModalOpen} onClose={() => setIsNotifyModalOpen(false)} title="Opciones de Notificación">
                <form onSubmit={handleSaveNotifyOptions} style={{ display: 'grid', gap: '1rem' }}>
                    <p className="text-sm text-secondary mb-2">
                        Selecciona los contactos que recibirán la convocatoria por correo electrónico cuando pulses el botón de notificar. Por defecto se sugieren los contactos principales del proyecto.
                    </p>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                        {project?.companyIds.map(cid => {
                            const comp = companies.find(c => c.id === cid);
                            if (!comp || !comp.contacts || comp.contacts.length === 0) return null;
                            return (
                                <div key={comp.id} style={{ marginBottom: '1rem' }}>
                                    <div className="text-sm font-bold mb-2 text-primary">{comp.name}</div>
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        {comp.contacts.map(contact => (
                                            <label key={contact.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={notifySelectedContacts.includes(contact.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setNotifySelectedContacts([...notifySelectedContacts, contact.id]);
                                                        } else {
                                                            setNotifySelectedContacts(notifySelectedContacts.filter(id => id !== contact.id));
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
                        {project?.companyIds.length === 0 && (
                            <div className="text-center text-sm text-secondary italic">No hay empresas asignadas al proyecto.</div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" className="btn btn-outline" onClick={() => setIsNotifyModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Guardar Destinatarios</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default MeetingList;
