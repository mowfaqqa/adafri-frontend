export interface Document {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  status: 'draft' | 'pending' | 'signed' | 'rejected';
}

export interface ESignature {
  id: string;
  documentId: string;
  status: 'pending' | 'signed' | 'rejected';
  createdAt: string;
  signedAt?: string;
}

export interface UserRole {
  type: 'employee' | 'manager' | 'client' | 'admin';
}