export interface Person {
  id: string
  name: string
  email: string
  status: string
  createdAt: string
  currentCompany: string
  currentTeams: string[]
  currentProjects: string[]
  history: Array<{
    company: string
    startDate: string
    endDate: string | null
    role: string
  }>
}

export interface Tenant {
  id: string
  name: string
  nameEs: string
  people: number
  projects: number
  status: string
  createdAt: string
}

export interface PersonAssignment {
  id: string
  name: string
  company: string
  startDate: string
  endDate: string | null
}
