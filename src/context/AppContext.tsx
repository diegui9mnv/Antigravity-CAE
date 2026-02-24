import React, { createContext, useContext, useState } from 'react';
import type { User, Project, Contract, ProjectDocument, Signature, DocumentStatus, MeetingStatus, WorkCenter, Meeting, DocumentTemplate } from '../types';

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
    },
];

const MOCK_CONTRACTS: Contract[] = [
    {
        id: 'c1',
        code: 'CTR-2024-001',
        description: 'Mantenimiento General Edificio A',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        clientName: 'Cliente A S.A.',
        contactName: 'Pedro Cliente',
        contactEmail: 'pedro@clientec.com',
        contactPhone: '555-0101',
        amount: 50000,
        coordinatorId: 'u2'
    },
    {
        id: 'c2',
        code: 'CTR-2024-002',
        description: 'Reforma Oficinas Centrales',
        startDate: '2024-03-01',
        endDate: '2024-06-30',
        clientName: 'Global Corp',
        contactName: 'Maria Director',
        contactEmail: 'maria@global.com',
        contactPhone: '555-0202',
        amount: 120000,
        coordinatorId: 'u2'
    }
];

const MOCK_PROJECTS: Project[] = [
    {
        id: 'p1',
        contractId: 'c1',
        code: 'PRJ-001-A',
        description: 'Limpieza y Jardinería',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        workCenterId: 'wc1',
        managerId: 'u2',
        companyIds: ['u3'],
        fechaSolicitud: '2023-12-15',
        createdAt: '2023-12-15T10:00:00.000Z',
        contactIds: ['cont-5', 'cont-6'],
        mainContactId: 'cont-5',
        contractManagerId: 'cont-6',
        companyStatus: 'INACTIVA',
        documentationStatus: 'NO_VERIFICADA'
    },
    {
        id: '2',
        contractId: '2',
        code: 'PROJ-002',
        description: 'Reforma Oficinas Centrales',
        startDate: '2024-02-01',
        endDate: '2024-08-31',
        workCenterId: 'wc-2',
        managerId: '2',
        companyIds: ['3'],
        fechaSolicitud: '2024-01-10',
        createdAt: '2024-01-10T09:30:00.000Z',
        contactIds: ['cont-3', 'cont-4'],
        mainContactId: 'cont-3',
        contractManagerId: 'cont-4',
        companyStatus: 'INACTIVA',
        documentationStatus: 'NO_VERIFICADA'
    }
];

const MOCK_WORK_CENTERS: WorkCenter[] = [
    {
        id: 'wc1',
        name: 'Embalse de la Viñuela',
        type: 'EMBALSE',
        address: 'Ctra. de la Viñuela, s/n',
        zipCode: '29712',
        phone: '951000000',
        province: 'MÁLAGA',
        riskInfoUrl: '#',
        riskInfoFileName: 'riesgos_vinuela.pdf'
    },
    {
        id: 'wc2',
        name: 'Oficina Central Málaga',
        type: 'OFICINA',
        address: 'Calle Marqués de Larios, 1',
        zipCode: '29005',
        phone: '952000000',
        province: 'MÁLAGA',
        riskInfoUrl: '#',
        riskInfoFileName: 'riesgos_oficina.pdf'
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
            // Optionally, we could show an alert to the user if the quota is exceeded.
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
    const [contracts, setContracts] = usePersistedState<Contract[]>('contracts', MOCK_CONTRACTS);
    const [projects, setProjects] = usePersistedState<Project[]>('projects', MOCK_PROJECTS);
    // Initialize documents from local storage or empty array
    const [documents, setDocuments] = usePersistedState<ProjectDocument[]>('documents', []);
    const [meetings, setMeetings] = usePersistedState<Meeting[]>('meetings', []);
    const [workCenters, setWorkCenters] = usePersistedState<WorkCenter[]>('workCenters', MOCK_WORK_CENTERS);
    const [templates, setTemplates] = usePersistedState<DocumentTemplate[]>('templates', []);
    const [headerActions, setHeaderActions] = useState<React.ReactNode | null>(null);

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

    const addContract = (contract: Contract) => setContracts([...contracts, contract]);
    const updateContract = (contract: Contract) => setContracts(contracts.map(c => c.id === contract.id ? contract : c));
    const deleteContract = (id: string) => setContracts(contracts.filter(c => c.id !== id));

    const addProject = async (project: Project) => {
        const timestamp = new Date().toISOString();
        const newProject = { ...project, id: project.id || Math.random().toString(36).substr(2, 9), createdAt: timestamp };

        setProjects(prev => [...prev, newProject]);

        // Automatically create initial documents from all available templates
        const initialDocs: ProjectDocument[] = templates.map(template => ({
            id: Math.random().toString(36).substr(2, 9),
            projectId: newProject.id,
            name: template.fileName,
            url: template.fileData,
            status: 'BORRADOR',
            category: template.category,
            uploadedBy: currentUser?.id || 'system',
            uploadedAt: timestamp,
            signatures: []
        }));

        setDocuments(prev => [...prev, ...initialDocs]);
    };
    const updateProject = (project: Project) => setProjects(projects.map(p => p.id === project.id ? project : p));
    const deleteProject = (id: string) => setProjects(projects.filter(p => p.id !== id));

    const addDocument = (doc: ProjectDocument) => setDocuments(prev => [...prev, { ...doc, signatures: doc.signatures || [] }]);

    const addDocumentSignature = (id: string, signature: Signature) =>
        setDocuments(documents.map(d => d.id === id ? {
            ...d,
            signatures: [...(d.signatures || []), signature],
            statusDate: new Date().toISOString(),
            status: 'ACEPTADO'
        } : d));

    const updateDocumentStatus = (id: string, status: ProjectDocument['status']) =>
        setDocuments(documents.map(d => d.id === id ? {
            ...d,
            status,
            statusDate: new Date().toISOString(),
        } : d));

    const updateDocumentUrl = (id: string, url: string) =>
        setDocuments(documents.map(d => d.id === id ? { ...d, url } : d));

    const deleteDocument = (id: string) => setDocuments(documents.filter(d => d.id !== id));

    const addMeeting = (meeting: Meeting) => {
        setMeetings([...meetings, { ...meeting, signatures: [] }]);

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
    };

    const updateMeeting = (meeting: Meeting) => setMeetings(meetings.map(m => m.id === meeting.id ? meeting : m));

    const addMeetingSignature = (id: string, signature: Signature) =>
        setMeetings(meetings.map(m => m.id === id ? {
            ...m,
            signatures: [...(m.signatures || []), signature]
        } : m));

    const addWorkCenter = (workCenter: WorkCenter) => setWorkCenters([...workCenters, workCenter]);
    const updateWorkCenter = (workCenter: WorkCenter) => setWorkCenters(workCenters.map(wc => wc.id === workCenter.id ? workCenter : wc));
    const deleteWorkCenter = (id: string) => setWorkCenters(workCenters.filter(wc => wc.id !== id));

    const addTemplate = (template: DocumentTemplate) => setTemplates([...templates, template]);
    const updateTemplate = (template: DocumentTemplate) => setTemplates(templates.map(t => t.id === template.id ? template : t));
    const deleteTemplate = (id: string) => setTemplates(templates.filter(t => t.id !== id));

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
