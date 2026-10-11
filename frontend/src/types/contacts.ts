export type ContactStatus = 'new' | 'in_contact' | 'done'

export interface AdminContact {
  id: string
  status: ContactStatus
  name: string
  email: string
  phone: string | null
  institution: string | null
  message: string
  staffNote: string | null
  createdAt: string
}

export type ContactCounts = Record<ContactStatus, number> & { all: number }

export interface ContactPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ContactFilters {
  status?: ContactStatus
  page?: number
}

export interface AdminContactList {
  data: AdminContact[]
  counts: ContactCounts
  pagination: ContactPagination
}

export interface ContactTriage {
  status?: ContactStatus
  staffNote?: string | null
}
