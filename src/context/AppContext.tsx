import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Project, Contract, ProjectDocument, Signature, DocumentStatus, MeetingStatus, WorkCenter, Meeting, DocumentTemplate } from '../types';
import api from '../services/api';

interface AppState {
    currentUser: User | null;
    users: User[];
    contracts: Contract[];
    projects: Project[];
    documents: ProjectDocument[];
    meetings: Meeting[];
    workCenters: WorkCenter[];
    setCurrentUser: (user: User | null) => void;
    addUser: (user: User) => void;
    updateUser: (user: User) => void;
    deleteUser: (id: string) => void;
    // CRUD Operations (Mock)
    addContract: (contract: Contract) => void;
    updateContract: (contract: Contract) => void;
    deleteContract: (id: string) => void;
    addProject: (project: Project) => void;
    updateProject: (project: Project) => void;
    deleteProject: (id: string) => void;
    addDocument: (doc: ProjectDocument) => void;
    addDocumentSignature: (id: string, signature: Signature) => void;
    updateDocumentStatus: (id: string, status: DocumentStatus) => void;
    updateDocumentUrl: (id: string, url: string) => void;
    deleteDocument: (id: string) => void;
    addMeeting: (meeting: Meeting) => void;
    updateMeeting: (meeting: Meeting) => void;
    addMeetingSignature: (id: string, signature: Signature) => void;
    addWorkCenter: (workCenter: WorkCenter) => void;
    updateWorkCenter: (workCenter: WorkCenter) => void;
    deleteWorkCenter: (id: string) => void;
    templates: DocumentTemplate[];
    addTemplate: (template: DocumentTemplate) => void;
    updateTemplate: (template: DocumentTemplate) => void;
    deleteTemplate: (id: string) => void;
    headerActions: React.ReactNode | null;
    setHeaderActions: (actions: React.ReactNode | null) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

// Mock Data
const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Juan Gestor', email: 'juan@manager.com', role: 'MANAGER' },
    { id: 'u2', name: 'Ana Coordinadora', email: 'ana@coordinator.com', role: 'COORDINATOR' },
    {
        id: 'u3',
        name: 'Cliente A S.A.',
        email: 'carlos@company.com',
        role: 'COMPANY',
        phone: '952001122',
        cif: 'A12345678',
        contacts: [
            { id: 'contact1', firstName: 'Carlos', lastName: 'García', email: 'carlos@company.com', position: 'Gerente', phone: '600112233' }
        ]
    },
    {
        id: 'u4',
        name: 'Proyectos Sur SL',
        email: 'sofia@company.com',
        role: 'COMPANY',
        phone: '951998877',
        cif: 'B87654321',
        contacts: [
            { id: 'contact2', firstName: 'Sofia', lastName: 'Martín', email: 'sofia@company.com', position: 'Técnico', phone: '611223344' }
        ]
    }
];

// Helper for LocalStorage
function usePersistedState<T>(key: string, defaultValue: T) {
    const [state, setState] = useState<T>(() => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return defaultValue;
        }
    });

    React.useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error writing ${key} to localStorage. Quota might be exceeded:`, error);
        }
    }, [key, state]);

    // Handle cross-window sync
    React.useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue) {
                try {
                    setState(JSON.parse(e.newValue));
                } catch (error) {
                    console.error(`Error parsing new value for ${key} from storage event:`, error);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [state, setState] as const;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = usePersistedState<User | null>('currentUser', null);
    const [users, setUsers] = usePersistedState<User[]>('users', MOCK_USERS);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [documents, setDocuments] = useState<ProjectDocument[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [headerActions, setHeaderActions] = useState<React.ReactNode | null>(null);

    // Initial Fetch for Work Centers, Contracts and Templates from Django API
    useEffect(() => {
        // We only want to fetch if the user is authenticated (we have a token)
        if (localStorage.getItem('access_token')) {
            api.get('/workcenters/')
                .then(response => setWorkCenters(response.data))
                .catch(err => console.error("Error fetching work centers:", err));

            api.get('/contracts/')
                .then(response => setContracts(response.data))
                .catch(err => console.error("Error fetching contracts:", err));

            api.get('/templates/')
                .then(response => setTemplates(response.data))
                .catch(err => console.error("Error fetching templates:", err));

            api.get('/projects/')
                .then(response => setProjects(response.data))
                .catch(err => console.error("Error fetching projects:", err));

            api.get('/documents/')
                .then(response => setDocuments(response.data))
                .catch(err => console.error("Error fetching documents:", err));

            api.get('/meetings/')
                .then(response => setMeetings(response.data))
                .catch(err => console.error("Error fetching meetings:", err));
        }
    }, [currentUser]); // Re-fetch when user logs in

    // Normalize data: Ensure all items have necessary arrays if they were created before multi-signature support
    React.useEffect(() => {
        let changed = false;
        const normalizedDocs = documents.map(d => {
            if (!d.signatures) {
                changed = true;
                d = { ...d, signatures: [] };
            }
            // Status translation migration
            const statusMap: Record<string, DocumentStatus> = {
                'DRAFT': 'BORRADOR',
                'PRESENTED': 'PRESENTADO',
                'VIEWED': 'ACEPTADO',
                'SIGNED': 'ACEPTADO'
            };
            if (statusMap[d.status]) {
                changed = true;
                d = { ...d, status: statusMap[d.status] };
            }
            return d;
        });
        if (changed) setDocuments(normalizedDocs);

        let meetingsChanged = false;
        const normalizedMeetings = meetings.map(m => {
            let mChanged = false;
            if (!m.signatures) {
                meetingsChanged = true;
                mChanged = true;
                m.signatures = [];
            }
            if (!m.startDate) {
                meetingsChanged = true;
                mChanged = true;
                m.startDate = (m as any).date || new Date().toISOString().split('T')[0];
                m.endDate = m.startDate;
                m.time = '10:00';
                m.location = 'Centro de Trabajo';
                m.type = 'PRESENCIAL';
            }
            // Status translation migration
            const mStatusMap: Record<string, MeetingStatus> = {
                'PLANNED': 'PROGRAMADA',
                'IN_PROGRESS': 'EN_CURSO',
                'CLOSED': 'REALIZADA',
                'CANCELLED': 'CANCELADA'
            };
            if (mStatusMap[m.status]) {
                meetingsChanged = true;
                m.status = mStatusMap[m.status];
                mChanged = true;
            }
            return mChanged ? { ...m } : m;
        });
        if (meetingsChanged) setMeetings(normalizedMeetings);

        let projectsChanged = false;
        const normalizedProjects = projects.map(p => {
            if (!p.companyIds) {
                projectsChanged = true;
                p = { ...p, companyIds: [] };
            }
            // Handle migration from 'workCenter' string to 'workCenterId'
            if ((p as any).workCenter && !p.workCenterId) {
                projectsChanged = true;
                p = { ...p, workCenterId: 'wc2' } as any;
                delete (p as any).workCenter;
            }
            // New fields for Entity Expansion
            if ((p as any).amount !== undefined) {
                projectsChanged = true;
                delete (p as any).amount;
            }
            if (!p.createdAt) {
                projectsChanged = true;
                p = { ...p, createdAt: p.startDate + 'T00:00:00.000Z' };
            }
            if ((p as any).objeto) {
                projectsChanged = true;
                const newP = { ...p };
                delete (newP as any).objeto;
                p = newP;
            }
            return p;
        });
        if (projectsChanged) setProjects(normalizedProjects);

        let usersChanged = false;
        const normalizedUsers = users.map(u => {
            if (u.role === 'COMPANY' && !u.contacts) {
                usersChanged = true;
                return { ...u, contacts: [] };
            }
            return u;
        });
        if (usersChanged) setUsers(normalizedUsers);
    }, []); // Only on mount

    const addUser = (user: User) => setUsers([...users, user]);
    const updateUser = (user: User) => setUsers(users.map(u => u.id === user.id ? user : u));
    const deleteUser = (id: string) => setUsers(users.filter(u => u.id !== id));

    const addContract = async (contract: Contract) => {
        try {
            const dataToSubmit = { ...contract };
            if (dataToSubmit.id && String(dataToSubmit.id).includes('temp')) delete (dataToSubmit as any).id;
            const response = await api.post('/contracts/', dataToSubmit);
            setContracts([...contracts, response.data]);
        } catch (error) {
            console.error("Error adding contract:", error);
        }
    };

    const updateContract = async (contract: Contract) => {
        try {
            const response = await api.put(`/contracts/${contract.id}/`, contract);
            setContracts(contracts.map(c => c.id === contract.id ? response.data : c));
        } catch (error) {
            console.error("Error updating contract:", error);
        }
    };

    const deleteContract = async (id: string) => {
        try {
            await api.delete(`/contracts/${id}/`);
            setContracts(contracts.filter(c => c.id !== id));
        } catch (error) {
            console.error("Error deleting contract:", error);
        }
    };

    const addProject = async (project: Project) => {
        try {
            const dataToSubmit = { ...project };
            if (dataToSubmit.id && String(dataToSubmit.id).includes('temp')) delete (dataToSubmit as any).id;

            // Format data for Django backend. The backend expects primary keys for relationships in write operations.
            // Our frontend uses names like contractId, workCenterId, managerId which match what Django expects
            // for foreign keys when using standard ModelViewSets (assuming field names are just 'contract', etc,
            // Django REST Framework generally accepts '<fieldname>_id' automatically, and camel_case parser translates it).

            const response = await api.post('/projects/', dataToSubmit);
            const newProject = response.data;
            setProjects([...projects, newProject]);

            // Automatically create initial documents from all available templates
            const initialDocsToCreate = templates.map(template => ({
                projectId: newProject.id,
                name: template.fileName,
                url: template.fileData,
                status: 'BORRADOR',
                category: template.category,
                uploadedBy: currentUser?.id || null,
                signatures: []
            }));

            // Since we're refactoring sequentially, we assume documents will be moved to API next,
            // but for now we create logic to hit the Document endpoint
            for (const docData of initialDocsToCreate) {
                try {
                    const docResp = await api.post('/documents/', docData);
                    setDocuments(prev => [...prev, docResp.data]);
                } catch (e) {
                    console.error("Error auto-creating document from template:", e);
                }
            }
        } catch (error: any) {
            console.error("Error adding project:", error);
            if (error.response) console.error(error.response.data);
        }
    };

    const updateProject = async (project: Project) => {
        try {
            const response = await api.put(`/projects/${project.id}/`, project);
            setProjects(projects.map(p => p.id === project.id ? response.data : p));
        } catch (error) {
            console.error("Error updating project:", error);
        }
    };

    const deleteProject = async (id: string) => {
        try {
            await api.delete(`/projects/${id}/`);
            setProjects(projects.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting project:", error);
        }
    };

    const addDocument = async (doc: ProjectDocument) => {
        try {
            const dataToSubmit = { ...doc };
            if (dataToSubmit.id && String(dataToSubmit.id).includes('temp')) delete (dataToSubmit as any).id;

            const response = await api.post('/documents/', dataToSubmit);
            setDocuments(prev => [...prev, response.data]);
        } catch (e) {
            console.error("Error adding document:", e);
        }
    };

    const addDocumentSignature = async (id: string, signature: Signature) => {
        try {
            const doc = documents.find(d => d.id === id);
            if (!doc) return;
            const updatedSignatures = [...(doc.signatures || []), signature];
            const response = await api.patch(`/documents/${id}/`, {
                signatures: updatedSignatures,
                statusDate: new Date().toISOString(),
                status: 'ACEPTADO'
            });
            setDocuments(documents.map(d => d.id === id ? response.data : d));
        } catch (error) {
            console.error("Error signing document:", error);
        }
    };

    const updateDocumentStatus = async (id: string, status: ProjectDocument['status']) => {
        try {
            const response = await api.patch(`/documents/${id}/`, {
                status,
                statusDate: new Date().toISOString()
            });
            setDocuments(documents.map(d => d.id === id ? response.data : d));
        } catch (error) {
            console.error("Error updating document status:", error);
        }
    };

    const updateDocumentUrl = async (id: string, url: string) => {
        try {
            const response = await api.patch(`/documents/${id}/`, { url });
            setDocuments(documents.map(d => d.id === id ? response.data : d));
        } catch (error) {
            console.error("Error updating document URL:", error);
        }
    };

    const deleteDocument = async (id: string) => {
        try {
            await api.delete(`/documents/${id}/`);
            setDocuments(documents.filter(d => d.id !== id));
        } catch (error) {
            console.error("Error deleting document:", error);
        }
    };

    const addMeeting = async (meeting: Meeting) => {
        try {
            const dataToSubmit = { ...meeting };
            if (dataToSubmit.id && String(dataToSubmit.id).includes('temp')) delete (dataToSubmit as any).id;

            const response = await api.post('/meetings/', dataToSubmit);
            setMeetings([...meetings, response.data]);

            // Mock email notification
            const project = projects.find(p => p.id === meeting.projectId);
            if (project) {
                const assignedCompanies = project.companyIds.map(cid => users.find(u => u.id === cid)).filter(Boolean);
                const allContacts = assignedCompanies.flatMap(c => c?.contacts || []);
                const recipients = allContacts.filter(c => c.id === project.mainContactId || c.id === project.contractManagerId);

                if (recipients.length > 0) {
                    console.log('%c[SIMULACIÓN EMAIL]', 'color: #4f46e5; font-weight: bold;');
                    console.log(`Para: ${recipients.map(r => `${r.firstName} <${r.email}>`).join(', ')}`);
                    console.log(`Asunto: Nueva Reunión programada - ${project.code}`);
                    console.log(`Cuerpo: Se ha programado una nueva reunión "${meeting.reason}" para el día ${meeting.startDate} a las ${meeting.time}. Lugar: ${meeting.location}${meeting.type === 'ONLINE' ? ` (Enlace: ${meeting.teamsLink})` : ''}.`);
                    console.log('---------------------------');
                }
            }
        } catch (error) {
            console.error("Error adding meeting:", error);
        }
    };

    const updateMeeting = async (meeting: Meeting) => {
        try {
            const response = await api.put(`/meetings/${meeting.id}/`, meeting);
            setMeetings(meetings.map(m => m.id === meeting.id ? response.data : m));
        } catch (error) {
            console.error("Error updating meeting:", error);
        }
    };

    const addMeetingSignature = async (id: string, signature: Signature) => {
        try {
            const meeting = meetings.find(m => m.id === id);
            if (!meeting) return;
            const updatedSignatures = [...(meeting.signatures || []), signature];
            const response = await api.patch(`/meetings/${id}/`, { signatures: updatedSignatures });
            setMeetings(meetings.map(m => m.id === id ? response.data : m));
        } catch (error) {
            console.error("Error signing meeting:", error);
        }
    };

    const addWorkCenter = async (workCenter: WorkCenter) => {
        try {
            // Remove the ID if it's a temporary client-side ID so Django can auto-generate it
            const dataToSubmit = { ...workCenter };
            if (dataToSubmit.id && String(dataToSubmit.id).includes('temp')) {
                delete (dataToSubmit as any).id;
            }

            const response = await api.post('/workcenters/', dataToSubmit);
            setWorkCenters([...workCenters, response.data]);
        } catch (error) {
            console.error("Error adding work center:", error);
            // Revert state or show error in a real app
        }
    };

    const updateWorkCenter = async (workCenter: WorkCenter) => {
        try {
            const response = await api.put(`/workcenters/${workCenter.id}/`, workCenter);
            setWorkCenters(workCenters.map(wc => wc.id === workCenter.id ? response.data : wc));
        } catch (error) {
            console.error("Error updating work center:", error);
        }
    };

    const deleteWorkCenter = async (id: string) => {
        try {
            await api.delete(`/workcenters/${id}/`);
            setWorkCenters(workCenters.filter(wc => wc.id !== id));
        } catch (error) {
            console.error("Error deleting work center:", error);
        }
    };

    const addTemplate = async (template: DocumentTemplate) => {
        try {
            const dataToSubmit = { ...template };
            if (dataToSubmit.id && String(dataToSubmit.id).includes('temp')) delete (dataToSubmit as any).id;
            const response = await api.post('/templates/', dataToSubmit);
            setTemplates([...templates, response.data]);
        } catch (error) {
            console.error("Error adding template:", error);
        }
    };

    const updateTemplate = async (template: DocumentTemplate) => {
        try {
            const response = await api.put(`/templates/${template.id}/`, template);
            setTemplates(templates.map(t => t.id === template.id ? response.data : t));
        } catch (error) {
            console.error("Error updating template:", error);
        }
    };

    const deleteTemplate = async (id: string) => {
        try {
            await api.delete(`/templates/${id}/`);
            setTemplates(templates.filter(t => t.id !== id));
        } catch (error) {
            console.error("Error deleting template:", error);
        }
    };

    return (
        <AppContext.Provider value={{
            currentUser,
            users,
            contracts,
            projects,
            documents,
            meetings,
            workCenters,
            setCurrentUser,
            addUser,
            updateUser,
            deleteUser,
            addContract,
            updateContract,
            deleteContract,
            addProject,
            updateProject,
            deleteProject,
            addDocument,
            addDocumentSignature,
            updateDocumentStatus,
            updateDocumentUrl,
            deleteDocument,
            addMeeting,
            updateMeeting,
            addMeetingSignature,
            addWorkCenter,
            updateWorkCenter,
            deleteWorkCenter,
            templates,
            addTemplate,
            updateTemplate,
            deleteTemplate,
            headerActions,
            setHeaderActions
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within an AppProvider');
    return context;
};
