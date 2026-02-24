export type Role = 'MANAGER' | 'COORDINATOR' | 'COMPANY';

export interface CompanyContact {
    id: string;
    firstName: string;
    lastName?: string;
    email: string;
    position?: string;
    phone?: string;
}

export interface User {
    id: string;
    name: string; // Used as Razón Social for companies
    email: string;
    role: Role;
    avatar?: string;
    phone?: string; // For companies
    cif?: string;   // For companies
    contacts?: CompanyContact[]; // For companies
}

export interface Contract {
    id: string;
    code: string;
    description: string;
    startDate: string; // ISO Date
    endDate: string;   // ISO Date
    clientName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    amount: number;
    coordinatorId?: string; // Assigned coordinator
}

export type ProjectCompanyStatus = 'INACTIVA' | 'ACTIVA' | 'TERMINADO';
export type ProjectDocStatus = 'NO_VERIFICADA' | 'VERIFICADA';

export interface Project {
    id: string;
    contractId: string;
    code: string;
    description: string;
    startDate: string;
    endDate: string;
    workCenterId: string;
    managerId: string; // The coordinator managing this
    companyIds: string[]; // Assigned companies
    fechaSolicitud: string;
    createdAt: string; // ISO date for sorting
    contactIds: string[]; // Multi-select contacts from companies
    mainContactId?: string;
    contractManagerId?: string; // Responsable del contrato
    companyStatus: ProjectCompanyStatus;
    documentationStatus: ProjectDocStatus;
}

export type DocumentStatus = 'BORRADOR' | 'PRESENTADO' | 'ACEPTADO' | 'RECHAZADO';

export interface Signature {
    userId: string;
    userName: string;
    role: Role;
    data: string; // Base64 signature
    position: { x: number, y: number };
    date: string; // ISO Date
}

export interface ProjectDocument {
    id: string;
    projectId: string;
    name: string;
    url: string; // Mock URL
    status: DocumentStatus;
    category?: string; // e.g., 'Anexo I', 'Listado Trabajadores'
    uploadedBy: string; // User ID
    uploadedAt: string;
    statusDate?: string;
    signatures: Signature[];
}

export type MeetingStatus = 'PROGRAMADA' | 'EN_CURSO' | 'REALIZADA' | 'CANCELADA';

export interface Meeting {
    id: string;
    projectId: string;
    startDate: string;
    endDate: string;
    time: string;
    reason: string;
    location: string;
    type: 'PRESENCIAL' | 'ONLINE';
    teamsLink?: string;
    status: MeetingStatus;
    attendees: string[]; // User IDs (Companies + Coordinator)
    minutes?: string; // Meeting minutes / notes
    minutePdfUrl?: string; // URL to generated PDF
    signatures: Signature[];
}

export type WorkCenterType = 'EMBALSE' | 'OFICINA';

export type Province = 'MÁLAGA' | 'SEVILLA' | 'JAÉN' | 'CÓRDOBA' | 'CEUTA' | 'MELILLA' | 'GRANADA';

export interface WorkCenter {
    id: string;
    name: string;
    type: WorkCenterType;
    address: string;
    zipCode: string;
    phone: string;
    province: Province;
    riskInfoUrl?: string; // URL for the attached risk information file
    riskInfoFileName?: string; // Original filename
}

export interface DocumentTemplate {
    id: string;
    name: string;
    category: string; // 'Anexo I', 'Anexo II', etc.
    fileData: string; // Base64 or Blob URL
    fileName: string;
    updatedAt: string;
}
