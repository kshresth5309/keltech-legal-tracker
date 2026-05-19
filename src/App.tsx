import { Fragment, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, ComponentType, FormEvent, ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock3,
  Database,
  Download,
  Edit3,
  FileText,
  FolderOpen,
  GanttChartSquare,
  IndianRupee,
  LayoutDashboard,
  Link2,
  Lock,
  LogIn,
  LogOut,
  Plus,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from './lib/supabase'
import './App.css'

type View =
  | 'Dashboard'
  | 'Matters'
  | 'Matter Detail'
  | 'Calendar'
  | 'Tasks'
  | 'Costs'
  | 'Documents'
  | 'Audit Log'
  | 'Reports'
  | 'Settings'

type Status = 'Open' | 'Due Soon' | 'Overdue' | 'On Track' | 'Closed'
type EntityType = 'auth' | 'matter' | 'legal_date' | 'task' | 'cost' | 'document' | 'budget'
type DocumentType = 'PDF' | 'DOCX' | 'XLSX' | 'LINK' | 'OTHER'
type UserRole = 'admin' | 'user'

type Matter = {
  id: string
  title: string
  category: string
  owner: string
  counterparty: string
  location: string
  nextDate: string
  nextDateLabel: string
  status: Status
  priority: 'Low' | 'Normal' | 'High' | 'Critical'
  monthlyCost: number
  lastUpdate: string
  openedOn: string
  description: string
}

type LegalDate = {
  id: string
  matterId: string
  title: string
  date: string
  type: string
  status: Status
}

type Task = {
  id: string
  title: string
  matterId?: string
  location: string
  assignee: string
  dueDate: string
  status: Status
  priority: 'Low' | 'Normal' | 'High' | 'Critical'
  notes: string
  createdAt: string
}

type CostRow = {
  id: string
  category: string
  budget: number
  actual: number
  color: string
}

type CostEntry = {
  id: string
  matterId: string
  category: string
  amount: number
  paidAmount: number
  paidOn?: string
  paymentStatus: 'Unpaid' | 'Part Paid' | 'Paid'
  vendor: string
  month: string
  description: string
}

type DocumentRecord = {
  id: string
  matterId: string
  name: string
  type: DocumentType
  source: 'Upload' | 'External Link'
  owner: string
  date: string
  createdAt?: string
  size?: string
  url?: string
  storagePath?: string
}

type DocumentAccessMode = 'preview' | 'download'

type ActivityRow = {
  id: string
  user: string
  initials: string
  description: string
  date: string
}

type CurrentUser = {
  name: string
  email: string
  role: UserRole
}

type AuditEvent = {
  id: string
  actor: string
  actorEmail: string
  action: string
  entityType: EntityType
  entityId: string
  matterId?: string
  matterTitle?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  ipMetadata: string
  userAgent: string
  createdAt: string
}

type MatterUpdate = {
  id: string
  matterId: string
  body: string
  actorEmail: string
  createdAt: string
}

type NavItem = {
  label: Exclude<View, 'Matter Detail'>
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
}

type MatterFormValues = Omit<Matter, 'id' | 'lastUpdate' | 'openedOn'> & {
  openedOn?: string
}

type MatterFormResult = {
  matter: MatterFormValues
  documents: DraftDocument[]
}

type MatterStatusUpdate = {
  status: Status
  priority: Matter['priority']
  nextDate: string
  nextDateLabel: string
  updateType: string
  notes: string
  paymentAmount: number
  paymentDescription: string
  documents: DraftDocument[]
}

type CostPaymentAllocation = {
  id: string
  paidAmount: number
  paidOn: string
  paymentStatus: CostEntry['paymentStatus']
}

type DraftDocument = {
  name: string
  type: DocumentType
  source: 'Upload' | 'External Link'
  url?: string
  size?: string
  file?: File
}

type CategoryRow = {
  id: string
  name: string
  color: string
}

type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  role?: UserRole | null
}

type MatterRow = {
  id: string
  title: string
  category_id: string | null
  owner_name: string
  counterparty: string | null
  location: string | null
  status: Status
  priority: Matter['priority']
  description: string | null
  opened_on: string
  next_date: string | null
  next_date_label: string | null
  monthly_cost_inr: number | string | null
  updated_at: string
}

type LegalDateRow = {
  id: string
  matter_id: string
  title: string
  date_type: string
  due_on: string
  status: Status
}

type TaskRow = {
  id: string
  matter_id: string | null
  title: string
  location: string | null
  assignee_name: string | null
  due_on: string | null
  status: Status
  priority: Task['priority']
  notes: string | null
  created_at: string
}

type CostEntryRow = {
  id: string
  matter_id: string | null
  category_id: string | null
  cost_month: string
  amount_inr: number | string
  paid_inr: number | string | null
  paid_on: string | null
  payment_status: CostEntry['paymentStatus'] | null
  vendor: string | null
  description: string | null
}

type BudgetRow = {
  id: string
  category_id: string | null
  budget_inr: number | string
}

type DocumentRowData = {
  id: string
  matter_id: string
  name: string
  document_type: DocumentType
  source: 'Upload' | 'External Link'
  storage_path: string | null
  external_url: string | null
  uploaded_by_name: string | null
  created_at: string
}

type MatterUpdateRow = {
  id: string
  matter_id: string
  body: string
  created_by_email: string | null
  created_at: string
}

type AuditEventRow = {
  id: string
  actor_email: string | null
  action: string
  entity_type: EntityType
  entity_id: string | null
  matter_id: string | null
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  ip_metadata: Record<string, unknown> | null
  user_agent: string | null
  created_at: string
}

type CloudData = {
  categories: CategoryRow[]
  matters: Matter[]
  legalDates: LegalDate[]
  tasks: Task[]
  costs: CostRow[]
  costEntries: CostEntry[]
  documents: DocumentRecord[]
  matterUpdates: MatterUpdate[]
  auditEvents: AuditEvent[]
}

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Matters', icon: FolderOpen },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Tasks', icon: ClipboardList },
  { label: 'Costs', icon: IndianRupee },
  { label: 'Documents', icon: FileText },
  { label: 'Audit Log', icon: ShieldCheck },
  { label: 'Reports', icon: GanttChartSquare },
  { label: 'Settings', icon: Settings },
]

const adminFallbackEmails = new Set(['shresth@keltechgroup.com', 'upendra@keltechgroup.com', 'nkumar@keltechgroup.com'])

const initialMatters: Matter[] = [
  {
    id: 'mat-001',
    title: 'Contract Review - Acme Corp',
    category: 'Contracts',
    owner: 'Jane Doe',
    counterparty: 'Acme Corp',
    location: 'Delhi High Court',
    nextDate: '2026-05-07',
    nextDateLabel: 'Review',
    status: 'Due Soon',
    priority: 'High',
    monthlyCost: 104000,
    lastUpdate: 'May 2, 2026',
    openedOn: '2026-04-21',
    description: 'Master services agreement review with commercial redlines.',
  },
  {
    id: 'mat-002',
    title: 'Employment Dispute - S. Patel',
    category: 'Employment',
    owner: 'Michael Chen',
    counterparty: 'Shivang Chawla',
    location: 'Gurugram District Court',
    nextDate: '2026-05-09',
    nextDateLabel: 'Hearing',
    status: 'Due Soon',
    priority: 'Critical',
    monthlyCost: 232000,
    lastUpdate: 'May 1, 2026',
    openedOn: '2026-03-18',
    description: 'Preparation for employment tribunal hearing.',
  },
  {
    id: 'mat-003',
    title: 'IP Renewal - Trademark',
    category: 'Intellectual Property',
    owner: 'Sarah Johnson',
    counterparty: 'Trademark Registry',
    location: 'Mumbai Trademark Registry',
    nextDate: '2026-05-15',
    nextDateLabel: 'Renewal Deadline',
    status: 'On Track',
    priority: 'Normal',
    monthlyCost: 37500,
    lastUpdate: 'Apr 30, 2026',
    openedOn: '2026-04-10',
    description: 'Renewal packet and proof review for Keltech mark.',
  },
  {
    id: 'mat-004',
    title: 'Regulatory Filing - Q2',
    category: 'Compliance',
    owner: 'David Lee',
    counterparty: 'Regional Infrastructure Authority',
    location: 'RERA Haryana Office',
    nextDate: '2026-05-20',
    nextDateLabel: 'Filing Deadline',
    status: 'On Track',
    priority: 'High',
    monthlyCost: 62500,
    lastUpdate: 'Apr 28, 2026',
    openedOn: '2026-04-01',
    description: 'Quarterly filing evidence collection and submission.',
  },
  {
    id: 'mat-005',
    title: 'Lease Negotiation - HQ',
    category: 'Real Estate',
    owner: 'Jane Doe',
    counterparty: 'Shivang Chawla',
    location: 'Gurugram District Court',
    nextDate: '2026-05-22',
    nextDateLabel: 'Review',
    status: 'On Track',
    priority: 'Normal',
    monthlyCost: 91500,
    lastUpdate: 'Apr 29, 2026',
    openedOn: '2026-02-14',
    description: 'Lease revision and renewal negotiation.',
  },
  {
    id: 'mat-006',
    title: 'Data Privacy Audit',
    category: 'Compliance',
    owner: 'David Lee',
    counterparty: 'Internal',
    location: 'Keltech Infrastructure HQ',
    nextDate: '2026-05-27',
    nextDateLabel: 'Audit',
    status: 'Due Soon',
    priority: 'High',
    monthlyCost: 75000,
    lastUpdate: 'Apr 30, 2026',
    openedOn: '2026-05-01',
    description: 'Review vendor data-processing records and retention policy.',
  },
  {
    id: 'mat-007',
    title: 'Litigation - ABC Inc.',
    category: 'Litigation',
    owner: 'Michael Chen',
    counterparty: 'ABC Inc.',
    location: 'Delhi High Court',
    nextDate: '2026-05-01',
    nextDateLabel: 'Hearing',
    status: 'Overdue',
    priority: 'Critical',
    monthlyCost: 350000,
    lastUpdate: 'Apr 25, 2026',
    openedOn: '2026-01-26',
    description: 'Civil claim hearing preparation and counsel coordination.',
  },
  {
    id: 'mat-008',
    title: 'Vendor Agreement - TechCo',
    category: 'Contracts',
    owner: 'Sarah Johnson',
    counterparty: 'TechCo',
    location: 'Bengaluru City Civil Court',
    nextDate: '2026-04-28',
    nextDateLabel: 'Review',
    status: 'Overdue',
    priority: 'High',
    monthlyCost: 50000,
    lastUpdate: 'Apr 24, 2026',
    openedOn: '2026-03-03',
    description: 'Vendor agreement review awaiting security annex edits.',
  },
]

const initialDates: LegalDate[] = initialMatters.map((matter) => ({
  id: `date-${matter.id}`,
  matterId: matter.id,
  title: matter.title,
  date: matter.nextDate,
  type: matter.nextDateLabel,
  status: matter.status,
}))

const initialTasks: Task[] = [
  {
    id: 'task-001',
    title: 'Finalize Acme redline summary',
    matterId: 'mat-001',
    location: 'Delhi High Court',
    assignee: 'Jane Doe',
    dueDate: '2026-05-06',
    status: 'Due Soon',
    priority: 'High',
    notes: 'Prepare final issue list before the review date.',
    createdAt: '2026-05-02',
  },
  {
    id: 'task-002',
    title: 'Collect hearing exhibits',
    matterId: 'mat-002',
    location: 'Gurugram District Court',
    assignee: 'Michael Chen',
    dueDate: '2026-05-08',
    status: 'Due Soon',
    priority: 'Critical',
    notes: 'Bundle correspondence and employment records.',
    createdAt: '2026-05-01',
  },
  {
    id: 'task-003',
    title: 'Review monthly legal budget',
    location: 'Keltech Infrastructure HQ',
    assignee: 'Jane Doe',
    dueDate: '2026-05-12',
    status: 'Open',
    priority: 'Normal',
    notes: 'Standalone legal operations task, not tied to a matter.',
    createdAt: '2026-05-03',
  },
  {
    id: 'task-004',
    title: 'Send Q2 filing evidence request',
    matterId: 'mat-004',
    location: 'RERA Haryana Office',
    assignee: 'David Lee',
    dueDate: '2026-05-10',
    status: 'On Track',
    priority: 'High',
    notes: 'Request updated certifications from operations.',
    createdAt: '2026-04-30',
  },
]

const initialCosts: CostRow[] = [
  { id: 'cost-1', category: 'Litigation', budget: 582000, actual: 0, color: '#6f42c1' },
  { id: 'cost-2', category: 'Contracts', budget: 195500, actual: 0, color: '#0b65c2' },
  { id: 'cost-3', category: 'Compliance', budget: 112500, actual: 0, color: '#169b62' },
  { id: 'cost-4', category: 'Employment', budget: 350000, actual: 0, color: '#f08c00' },
  { id: 'cost-5', category: 'IP', budget: 62500, actual: 0, color: '#d49b00' },
]

const initialCostEntries: CostEntry[] = initialMatters.map((matter) => ({
  id: `entry-${matter.id}`,
  matterId: matter.id,
  category: matter.category,
  amount: matter.monthlyCost,
  paidAmount: 0,
  paymentStatus: 'Unpaid',
  vendor: matter.owner,
  month: '2026-05',
  description: `${matter.title} monthly estimate`,
}))

const initialDocuments: DocumentRecord[] = [
  {
    id: 'doc-1',
    matterId: 'mat-001',
    name: 'Acme_Master_Agreement_v2.pdf',
    type: 'PDF',
    source: 'Upload',
    owner: 'Jane Doe',
    date: 'May 2, 2026',
    size: '1.8 MB',
  },
  {
    id: 'doc-2',
    matterId: 'mat-001',
    name: 'Acme_MSA_Track_Changes.docx',
    type: 'DOCX',
    source: 'Upload',
    owner: 'Jane Doe',
    date: 'Apr 30, 2026',
    size: '740 KB',
  },
  {
    id: 'doc-3',
    matterId: 'mat-002',
    name: 'Hearing_Preparation_Notes.docx',
    type: 'DOCX',
    source: 'Upload',
    owner: 'Michael Chen',
    date: 'May 1, 2026',
    size: '510 KB',
  },
  {
    id: 'doc-4',
    matterId: 'mat-005',
    name: 'Counterparty correspondence folder',
    type: 'LINK',
    source: 'External Link',
    owner: 'Jane Doe',
    date: 'Apr 27, 2026',
    url: 'https://example.com/keltech/hq-lease',
  },
]

const initialActivity: ActivityRow[] = [
  {
    id: 'act-1',
    user: 'Michael Chen',
    initials: 'MC',
    description: 'updated status to Due Soon for Employment Dispute - S. Patel',
    date: 'May 2, 2026 10:42 AM',
  },
  {
    id: 'act-2',
    user: 'Sarah Johnson',
    initials: 'SJ',
    description: 'uploaded Acme_NDA.pdf to Contract Review - Acme Corp',
    date: 'May 1, 2026 4:15 PM',
  },
  {
    id: 'act-3',
    user: 'David Lee',
    initials: 'DL',
    description: 'added note to Regulatory Filing - Q2',
    date: 'Apr 30, 2026 2:33 PM',
  },
]

const initialMatterUpdates: MatterUpdate[] = [
  {
    id: 'upd-1',
    matterId: 'mat-001',
    body: 'Review update: Acme redlines reviewed; pending commercial approval before final signing.',
    actorEmail: 'jane.doe@keltech.in',
    createdAt: '2026-05-02T10:30:00+05:30',
  },
  {
    id: 'upd-2',
    matterId: 'mat-002',
    body: 'Hearing attended: Arguments made. Next hearing listed for May 9, 2026.',
    actorEmail: 'michael.chen@keltech.in',
    createdAt: '2026-05-01T15:45:00+05:30',
  },
]

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authEmail, setAuthEmail] = useState('legal@keltech.in')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [dataError, setDataError] = useState('')
  const [dataLoading, setDataLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [demoUser, setDemoUser] = useState<CurrentUser>({ name: 'Jane Doe', email: 'jane.doe@keltech.in', role: 'admin' })
  const [activeView, setActiveView] = useState<View>('Dashboard')
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [matters, setMatters] = useState(initialMatters)
  const [legalDates, setLegalDates] = useState(initialDates)
  const [tasks, setTasks] = useState(initialTasks)
  const [costs, setCosts] = useState(initialCosts)
  const [costEntries, setCostEntries] = useState(initialCostEntries)
  const [documents, setDocuments] = useState(initialDocuments)
  const [matterUpdates, setMatterUpdates] = useState(initialMatterUpdates)
  const [activity, setActivity] = useState(initialActivity)
  const [selectedMatterId, setSelectedMatterId] = useState('mat-001')
  const [matterModal, setMatterModal] = useState<{ mode: 'create' | 'edit'; matterId?: string } | null>(null)
  const [statusModalMatterId, setStatusModalMatterId] = useState<string | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [groupByCounterparty, setGroupByCounterparty] = useState(false)
  const [expandedCounterparties, setExpandedCounterparties] = useState<string[]>(['shivang chawla'])
  const [counterpartyFilter, setCounterpartyFilter] = useState('All counterparties')
  const [documentFilter, setDocumentFilter] = useState('All matters')
  const [auditFilter, setAuditFilter] = useState({ user: 'All users', action: 'All actions', entity: 'All entities' })
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => [
    createAuditSeed('Sarah Johnson', 'sarah.johnson@keltech.in', 'DOCUMENT_UPLOADED', 'document', 'doc-2', 'mat-001'),
    createAuditSeed('Michael Chen', 'michael.chen@keltech.in', 'STATUS_CHANGED', 'matter', 'mat-002', 'mat-002'),
    createAuditSeed('David Lee', 'david.lee@keltech.in', 'BUDGET_UPDATED', 'budget', 'cost-3'),
  ])

  const currentUser = useMemo(() => {
    if (session?.user.email) {
      const email = session.user.email
      return {
        name: profile?.full_name || email.split('@')[0].replace(/[._]/g, ' '),
        email,
        role: profile?.role === 'admin' || adminFallbackEmails.has(email.toLowerCase()) ? 'admin' : 'user',
      } satisfies CurrentUser
    }
    return demoUser
  }, [demoUser, profile, session])
  const isCloudMode = Boolean(supabase && session)
  const isAdmin = currentUser.role === 'admin'

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (event === 'SIGNED_IN' && newSession?.user.email) {
        const signedInEmail = newSession.user.email
        setAuditEvents((rows) => [
          createClientAuditEvent(
            signedInEmail,
            signedInEmail,
            'LOGIN',
            'auth',
            newSession.user.id ?? 'auth-session',
            undefined,
            undefined,
            { email: signedInEmail },
          ),
          ...rows,
        ])
      }
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setAuditEvents((rows) => [
          createClientAuditEvent('Signed out user', 'unknown@keltech.in', 'LOGOUT', 'auth', 'auth-session'),
          ...rows,
        ])
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) return
    const client = supabase
    const activeSession = session

    let cancelled = false

    async function syncCloudData() {
      setDataLoading(true)
      setDataError('')
      try {
        const cloudData = await loadCloudData()
        const currentProfile = activeSession.user.email
          ? await loadCurrentProfile(activeSession.user.id, activeSession.user.email)
          : null
        if (cancelled) return
        setProfile(currentProfile)
        setCategories(cloudData.categories)
        setMatters(cloudData.matters)
        setLegalDates(cloudData.legalDates)
        setTasks(cloudData.tasks)
        setCosts(cloudData.costs)
        setCostEntries(cloudData.costEntries)
        setDocuments(cloudData.documents)
        setMatterUpdates(cloudData.matterUpdates)
        setAuditEvents(cloudData.auditEvents)
        setActivity(activityFromAudits(cloudData.auditEvents))
        setSelectedMatterId(cloudData.matters[0]?.id ?? '')
      } catch (error) {
        if (!cancelled) setDataError(error instanceof Error ? error.message : 'Unable to load Supabase data.')
      } finally {
        if (!cancelled) setDataLoading(false)
      }
    }

    void syncCloudData()

    const channel = client
      .channel('keltech-legal-tracker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matter_categories' }, () => void syncCloudData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matters' }, () => void syncCloudData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'legal_dates' }, () => void syncCloudData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => void syncCloudData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_budgets' }, () => void syncCloudData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cost_entries' }, () => void syncCloudData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => void syncCloudData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matter_updates' }, () => void syncCloudData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_events' }, () => void syncCloudData())
      .subscribe()

    return () => {
      cancelled = true
      void client.removeChannel(channel)
    }
  }, [session])

  const selectedMatter = matters.find((matter) => matter.id === selectedMatterId) ?? matters[0] ?? emptyMatter()
  const selectedAudit = auditEvents.find((event) => event.id === selectedAuditId) ?? auditEvents[0] ?? emptyAuditEvent(currentUser)
  const counterparties = useMemo(() => canonicalCounterparties(matters), [matters])
  const filteredMatters = useMemo(() => {
    const query = search.toLowerCase()
    return matters.filter((matter) => {
      const matchesFilter =
        filter === 'All' ||
        (filter === 'Open' && matter.status !== 'Closed') ||
        matter.status === filter
      const matchesSearch =
        matter.title.toLowerCase().includes(query) ||
        matter.category.toLowerCase().includes(query) ||
        matter.owner.toLowerCase().includes(query) ||
        matter.counterparty.toLowerCase().includes(query) ||
        matter.location.toLowerCase().includes(query)
      const matchesCounterparty =
        counterpartyFilter === 'All counterparties' ||
        normalizeCounterparty(matter.counterparty) === normalizeCounterparty(counterpartyFilter)
      return matchesFilter && matchesSearch && matchesCounterparty
    })
  }, [counterpartyFilter, filter, matters, search])

  const visibleAudit = auditEvents.filter((event) => {
    return (
      (auditFilter.user === 'All users' || event.actor === auditFilter.user) &&
      (auditFilter.action === 'All actions' || event.action === auditFilter.action) &&
      (auditFilter.entity === 'All entities' || event.entityType === auditFilter.entity)
    )
  })
  const openMatterCount = matters.filter((matter) => matter.status !== 'Closed').length
  const dueSoonCount = matters.filter((matter) => matter.status === 'Due Soon').length
  const overdueCount = matters.filter((matter) => matter.status === 'Overdue').length
  const totalPlanned = costs.reduce((sum, row) => sum + row.budget, 0)
  const totalPaid = costs.reduce((sum, row) => sum + row.actual, 0)
  const matterDocuments = documents.filter((document) => document.matterId === selectedMatter.id)
  const matterCosts = costEntries.filter((entry) => entry.matterId === selectedMatter.id)
  const matterAudit = auditEvents.filter((event) => event.matterId === selectedMatter.id)
  const selectedMatterUpdates = matterUpdates.filter((update) => update.matterId === selectedMatter.id)

  function changeView(view: View) {
    setActiveView(view)
  }

  function openMatter(matterId: string) {
    setSelectedMatterId(matterId)
    setActiveView('Matter Detail')
  }

  function appendAudit(
    action: string,
    entityType: EntityType,
    entityId: string,
    matterId?: string,
    before?: Record<string, unknown>,
    after?: Record<string, unknown>,
  ) {
    if (isCloudMode && supabase) {
      void supabase.rpc('record_audit_event', {
        action,
        entity_type: entityType,
        entity_id: isUuid(entityId) ? entityId : null,
        matter_id: matterId && isUuid(matterId) ? matterId : null,
        before_data: before ?? null,
        after_data: after ?? null,
      })
    }
    const matter = matters.find((item) => item.id === matterId)
    const event: AuditEvent = {
      id: crypto.randomUUID(),
      actor: toTitleCase(currentUser.name),
      actorEmail: currentUser.email,
      action,
      entityType,
      entityId,
      matterId,
      matterTitle: matter?.title,
      before,
      after,
      ipMetadata: 'Captured server-side in Supabase trigger',
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString(),
    }
    setAuditEvents((rows) => [event, ...rows])
  }

  function pushActivity(description: string) {
    setActivity((rows) => [
      {
        id: crypto.randomUUID(),
        user: toTitleCase(currentUser.name),
        initials: initials(currentUser.name),
        description,
        date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      },
      ...rows,
    ])
  }

  async function recordMatterUpdate(matterId: string, body: string) {
    if (!body.trim()) return
    const entry: MatterUpdate = {
      id: crypto.randomUUID(),
      matterId,
      body: body.trim(),
      actorEmail: currentUser.email,
      createdAt: new Date().toISOString(),
    }
    if (isCloudMode && supabase) {
      const { error } = await supabase.from('matter_updates').insert({
        matter_id: matterId,
        body: entry.body,
        created_by_email: currentUser.email,
      })
      if (error) throw error
    }
    setMatterUpdates((rows) => [entry, ...rows])
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthError('')
    if (!supabase) {
      setDemoUser({
        name: authEmail.split('@')[0].replace(/[._]/g, ' '),
        email: authEmail,
        role: adminFallbackEmails.has(authEmail.toLowerCase()) ? 'admin' : 'user',
      })
      appendAudit('DEMO_LOGIN', 'auth', 'demo-session', undefined, undefined, { email: authEmail })
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
    if (error) setAuthError(error.message)
  }

  async function handleLogout() {
    appendAudit('LOGOUT_REQUESTED', 'auth', 'auth-session')
    if (supabase && session) {
      await supabase.auth.signOut()
    } else {
      setDemoUser({ name: 'Jane Doe', email: 'jane.doe@keltech.in', role: 'admin' })
    }
  }

  async function saveMatter(result: MatterFormResult, mode: 'create' | 'edit', matterId?: string) {
    const canonicalCounterparty = getCanonicalCounterparty(result.matter.counterparty, matters)
    const canonicalLocation = getCanonicalLocation(result.matter.location, matters, tasks)
    const normalizedMatter = { ...result.matter, counterparty: canonicalCounterparty, location: canonicalLocation }

    if (mode === 'create') {
      if (isCloudMode) {
        try {
          const categoryId = await ensureCloudCategory(normalizedMatter.category)
          const matterRow = await insertCloudMatter(normalizedMatter, categoryId)
          const newMatter = mapMatterRow(matterRow, new Map([[categoryId, normalizedMatter.category]]))
          await upsertCloudLegalDate(newMatter)
          await insertCloudCostEntry(costEntryFromMatter(newMatter), categoryId)
          await addCloudDocuments(newMatter.id, result.documents)
          setSelectedMatterId(newMatter.id)
          setActiveView('Matter Detail')
          setMatterModal(null)
          pushActivity(`created matter ${newMatter.title}`)
        } catch (error) {
          setDataError(error instanceof Error ? error.message : 'Unable to create matter in Supabase.')
        }
        return
      }
      const newMatter: Matter = {
        ...normalizedMatter,
        id: crypto.randomUUID(),
        lastUpdate: 'Just now',
        openedOn: normalizedMatter.openedOn || new Date().toISOString().slice(0, 10),
      }
      setMatters((rows) => [newMatter, ...rows])
      setLegalDates((rows) => [dateFromMatter(newMatter), ...rows])
      setCostEntries((rows) => [costEntryFromMatter(newMatter), ...rows])
      const newDocuments = documentsFromDrafts(result.documents, newMatter.id, currentUser.name)
      setDocuments((rows) => [...newDocuments, ...rows])
      setSelectedMatterId(newMatter.id)
      setActiveView('Matter Detail')
      setMatterModal(null)
      pushActivity(`created matter ${newMatter.title}`)
      appendAudit('MATTER_CREATED', 'matter', newMatter.id, newMatter.id, undefined, newMatter)
      newDocuments.forEach((document) =>
        appendAudit('DOCUMENT_ATTACHED_ON_CREATE', 'document', document.id, newMatter.id, undefined, document),
      )
      return
    }

    const existing = matters.find((matter) => matter.id === matterId)
    if (!existing || !matterId) return

    const updatedMatter: Matter = {
      ...existing,
      ...normalizedMatter,
      openedOn: normalizedMatter.openedOn || existing.openedOn,
      lastUpdate: 'Just now',
    }
    if (isCloudMode) {
      try {
        const categoryId = await ensureCloudCategory(updatedMatter.category)
        await updateCloudMatter(updatedMatter, categoryId)
        await upsertCloudLegalDate(updatedMatter)
        await upsertCloudMatterCostEntry(updatedMatter, categoryId)
        await addCloudDocuments(matterId, result.documents)
        setMatterModal(null)
        pushActivity(`updated matter ${updatedMatter.title}`)
      } catch (error) {
        setDataError(error instanceof Error ? error.message : 'Unable to update matter in Supabase.')
      }
      return
    }
    setMatters((rows) => rows.map((matter) => (matter.id === matterId ? updatedMatter : matter)))
    setLegalDates((rows) => upsertDate(rows, updatedMatter))
    setCostEntries((rows) => upsertCostEntry(rows, updatedMatter))
    const newDocuments = documentsFromDrafts(result.documents, matterId, currentUser.name)
    if (newDocuments.length) setDocuments((rows) => [...newDocuments, ...rows])
    setMatterModal(null)
    pushActivity(`updated matter ${updatedMatter.title}`)
    appendAudit('MATTER_UPDATED', 'matter', matterId, matterId, existing, updatedMatter)
    if (normalizeCounterparty(existing.counterparty) !== normalizeCounterparty(updatedMatter.counterparty)) {
      appendAudit(
        'COUNTERPARTY_UPDATED',
        'matter',
        matterId,
        matterId,
        { counterparty: existing.counterparty },
        { counterparty: updatedMatter.counterparty },
      )
    }
    if (normalizeLocation(existing.location) !== normalizeLocation(updatedMatter.location)) {
      appendAudit(
        'LOCATION_UPDATED',
        'matter',
        matterId,
        matterId,
        { location: existing.location },
        { location: updatedMatter.location },
      )
    }
    newDocuments.forEach((document) =>
      appendAudit('DOCUMENT_ATTACHED_ON_UPDATE', 'document', document.id, matterId, undefined, document),
    )
  }

  async function deleteMatter(matter: Matter) {
    if (!isAdmin) {
      setDataError('Only admins can delete matters.')
      return
    }
    const confirmed = window.confirm(`Delete "${matter.title}"? This removes the matter, linked dates, documents, matter history, and matter-linked cost entries.`)
    if (!confirmed) return

    appendAudit('MATTER_DELETE_REQUESTED', 'matter', matter.id, matter.id, matter, undefined)
    if (isCloudMode && supabase) {
      const { error: costError } = await supabase.from('cost_entries').delete().eq('matter_id', matter.id)
      if (costError) {
        setDataError(costError.message)
        return
      }
      const { error } = await supabase.from('matters').delete().eq('id', matter.id)
      if (error) {
        setDataError(error.message)
        return
      }
    }

    const remainingMatters = matters.filter((row) => row.id !== matter.id)
    setMatters(remainingMatters)
    setLegalDates((rows) => rows.filter((row) => row.matterId !== matter.id))
    setTasks((rows) => rows.map((row) => (row.matterId === matter.id ? { ...row, matterId: undefined } : row)))
    setDocuments((rows) => rows.filter((row) => row.matterId !== matter.id))
    setMatterUpdates((rows) => rows.filter((row) => row.matterId !== matter.id))
    setCostEntries((rows) => rows.filter((row) => row.matterId !== matter.id))
    setCosts((rows) => rebuildCostRowsFromEntries(rows, costEntries.filter((row) => row.matterId !== matter.id)))
    setSelectedMatterId(remainingMatters[0]?.id ?? '')
    setActiveView(remainingMatters.length ? 'Matters' : 'Dashboard')
    pushActivity(`deleted matter ${matter.title}`)
  }

  async function cycleMatterStatus(matter: Matter) {
    const statuses: Status[] = ['Open', 'Due Soon', 'On Track', 'Overdue', 'Closed']
    const nextStatus = statuses[(statuses.indexOf(matter.status) + 1) % statuses.length]
    const updatedMatter = { ...matter, status: nextStatus, lastUpdate: 'Just now' }
    if (isCloudMode && supabase) {
      const { error } = await supabase.from('matters').update({ status: nextStatus }).eq('id', matter.id)
      if (error) {
        setDataError(error.message)
        return
      }
    }
    setMatters((rows) => rows.map((item) => (item.id === matter.id ? updatedMatter : item)))
    setLegalDates((rows) => rows.map((date) => (date.matterId === matter.id ? { ...date, status: nextStatus } : date)))
    pushActivity(`changed ${matter.title} status to ${nextStatus}`)
    appendAudit('STATUS_CHANGED', 'matter', matter.id, matter.id, { status: matter.status }, { status: nextStatus })
  }

  async function updateLegalDateStatus(date: LegalDate, status: Status) {
    if (isCloudMode && supabase) {
      const { error } = await supabase.from('legal_dates').update({ status }).eq('id', date.id)
      if (error) {
        setDataError(error.message)
        return
      }
    }
    setLegalDates((rows) => rows.map((row) => (row.id === date.id ? { ...row, status } : row)))
    setMatters((rows) =>
      rows.map((matter) => (matter.id === date.matterId ? { ...matter, status, lastUpdate: 'Just now' } : matter)),
    )
    pushActivity(`updated date ${date.title} to ${status}`)
    appendAudit('LEGAL_DATE_UPDATED', 'legal_date', date.id, date.matterId, { status: date.status }, { status })
  }

  async function handleDocumentAccess(document: DocumentRecord, mode: DocumentAccessMode) {
    pushActivity(`${mode === 'download' ? 'downloaded' : 'previewed'} ${document.name}`)
    if (!isCloudMode || document.source === 'External Link') {
      appendAudit(mode === 'download' ? 'DOCUMENT_DOWNLOAD_REQUESTED' : 'DOCUMENT_PREVIEW_REQUESTED', 'document', document.id, document.matterId, undefined, {
        documentName: document.name,
        accessType:
          document.source === 'External Link'
            ? 'external-link-opened'
            : mode === 'download'
              ? 'download-requested'
              : 'preview-requested',
      })
    }
    if (isCloudMode && document.source === 'Upload' && document.storagePath) {
      try {
        const signedUrl = await createSignedDocumentUrl(document, mode)
        if (mode === 'download') {
          downloadUrl(signedUrl, document.name)
          return
        }
        window.open(signedUrl, '_blank', 'noopener,noreferrer')
      } catch (error) {
        setDataError(error instanceof Error ? error.message : 'Unable to access document.')
      }
      return
    }
    if (mode === 'download' && document.source === 'Upload') {
      downloadDocument(document)
      return
    }
    openDocumentPreview(document)
  }

  async function addDocumentsToMatter(matterId: string, drafts: DraftDocument[]) {
    if (!drafts.length) return
    if (isCloudMode) {
      try {
        await addCloudDocuments(matterId, drafts)
        const matter = matters.find((row) => row.id === matterId)
        pushActivity(`attached ${drafts.length} document${drafts.length > 1 ? 's' : ''} to ${matter?.title ?? 'matter'}`)
      } catch (error) {
        setDataError(error instanceof Error ? error.message : 'Unable to attach documents in Supabase.')
      }
      return
    }
    const newDocuments = documentsFromDrafts(drafts, matterId, currentUser.name)
    setDocuments((rows) => [...newDocuments, ...rows])
    const matter = matters.find((row) => row.id === matterId)
    pushActivity(`attached ${newDocuments.length} document${newDocuments.length > 1 ? 's' : ''} to ${matter?.title ?? 'matter'}`)
    newDocuments.forEach((document) => appendAudit('DOCUMENT_ATTACHED', 'document', document.id, matterId, undefined, document))
  }

  async function addCostEntry(entry: Omit<CostEntry, 'id'>) {
    if (isCloudMode) {
      try {
        const categoryId = await ensureCloudCategory(entry.category)
        const row = await insertCloudCostEntry(entry, categoryId)
        const newEntry = mapCostEntryRow(row, new Map([[categoryId, entry.category]]))
        setCostEntries((rows) => [newEntry, ...rows])
        setCosts(() => buildCostRows(categories, [], [newEntry, ...costEntries]))
        pushActivity(`added ${currency.format(entry.amount)} legal cost`)
      } catch (error) {
        setDataError(error instanceof Error ? error.message : 'Unable to add cost in Supabase.')
      }
      return
    }
    const newEntry = { ...entry, id: crypto.randomUUID() }
    setCostEntries((rows) => [newEntry, ...rows])
    setCosts((rows) => updateCostRows(rows, newEntry.category, newEntry.amount, newEntry.paidAmount))
    appendAudit('COST_CREATED', 'cost', newEntry.id, newEntry.matterId, undefined, newEntry)
    pushActivity(`added ${currency.format(newEntry.amount)} legal cost`)
  }

  async function updateCostPayment(entry: CostEntry, paidAmount: number, paidOn?: string) {
    const paymentStatus = getPaymentStatus(entry.amount, paidAmount)
    const updatedEntry = { ...entry, paidAmount, paidOn, paymentStatus }
    if (isCloudMode && supabase) {
      const { error } = await supabase
        .from('cost_entries')
        .update({
          paid_inr: paidAmount,
          paid_on: paidOn || null,
          payment_status: paymentStatus,
        })
        .eq('id', entry.id)
      if (error) {
        setDataError(error.message)
        return
      }
    }
    setCostEntries((rows) => rows.map((row) => (row.id === entry.id ? updatedEntry : row)))
    setCosts((rows) => rebuildCostRowsFromEntries(rows, costEntries.map((row) => (row.id === entry.id ? updatedEntry : row))))
    appendAudit('PAYMENT_UPDATED', 'cost', entry.id, entry.matterId, { paidAmount: entry.paidAmount, paymentStatus: entry.paymentStatus }, { paidAmount, paidOn, paymentStatus })
    pushActivity(`updated payment for ${currency.format(entry.amount)} cost to ${paymentStatus}`)
  }

  async function deleteCostEntry(entry: CostEntry) {
    if (!isAdmin) {
      setDataError('Only admins can delete cost entries.')
      return
    }
    const confirmed = window.confirm(`Delete this ${currency.format(entry.amount)} cost entry? This removes the noted cost and payment record from reports.`)
    if (!confirmed) return

    appendAudit('COST_DELETE_REQUESTED', 'cost', entry.id, entry.matterId, entry, undefined)
    if (isCloudMode && supabase) {
      const { error } = await supabase.from('cost_entries').delete().eq('id', entry.id)
      if (error) {
        setDataError(error.message)
        return
      }
    }

    const nextEntries = costEntries.filter((row) => row.id !== entry.id)
    setCostEntries(nextEntries)
    setCosts((rows) => rebuildCostRowsFromEntries(rows, nextEntries))
    pushActivity(`deleted ${currency.format(entry.amount)} cost entry`)
  }

  async function applyMatterStatusUpdate(matter: Matter, update: MatterStatusUpdate) {
    const autoStatus = update.status === 'Closed' ? 'Closed' : statusFromDate(update.nextDate)
    const updatedMatter = {
      ...matter,
      status: autoStatus,
      priority: update.priority,
      nextDate: update.nextDate,
      nextDateLabel: update.nextDateLabel,
      lastUpdate: 'Just now',
    }
    let updatedCostEntries = costEntries
    let paymentAllocations: CostPaymentAllocation[] = []

    if (update.paymentAmount > 0) {
      const allocation = allocatePaymentToMatterCosts(costEntries, matter.id, update.paymentAmount, new Date().toISOString().slice(0, 10))
      if (!allocation.allocations.length) {
        setDataError(`No outstanding cost is recorded for ${matter.title}. Add the due cost first, then record payment against it.`)
        return
      }
      updatedCostEntries = allocation.entries
      paymentAllocations = allocation.allocations
      if (allocation.unapplied > 0) {
        setDataError(`${currency.format(allocation.unapplied)} was not applied because this matter has no more outstanding costs.`)
      }
    }

    if (isCloudMode && supabase) {
      try {
        await updateCloudMatterStatus(updatedMatter)
        await upsertCloudLegalDate(updatedMatter)
        await updateCloudCostPayments(paymentAllocations)
        await addCloudDocuments(matter.id, update.documents)
        await recordMatterUpdate(matter.id, matterUpdateBody(matter, update, autoStatus, paymentAllocations))
      } catch (error) {
        setDataError(error instanceof Error ? error.message : 'Unable to update matter status in Supabase.')
        return
      }
    }
    setMatters((rows) => rows.map((row) => (row.id === matter.id ? updatedMatter : row)))
    setLegalDates((rows) => upsertDate(rows, updatedMatter))
    if (update.paymentAmount > 0) {
      setCostEntries(updatedCostEntries)
      setCosts((rows) => rebuildCostRowsFromEntries(rows, updatedCostEntries))
    }
    if (!isCloudMode) {
      const newDocuments = documentsFromDrafts(update.documents, matter.id, currentUser.name)
      if (newDocuments.length) {
        setDocuments((rows) => [...newDocuments, ...rows])
        newDocuments.forEach((document) => appendAudit('DOCUMENT_ATTACHED_TO_UPDATE', 'document', document.id, matter.id, undefined, document))
      }
      await recordMatterUpdate(matter.id, matterUpdateBody(matter, update, autoStatus, paymentAllocations))
    }
    appendAudit('MATTER_UPDATE_RECORDED', 'matter', matter.id, matter.id, {
      status: matter.status,
      priority: matter.priority,
      nextDate: matter.nextDate,
    }, {
      status: autoStatus,
      priority: update.priority,
      nextDate: update.nextDate,
      nextDateLabel: update.nextDateLabel,
      updateType: update.updateType,
      notes: update.notes,
      paymentAmount: update.paymentAmount,
      paymentAppliedToCostIds: paymentAllocations.map((allocation) => allocation.id),
      documents: update.documents.map((document) => document.name),
    })
    pushActivity(`recorded ${update.updateType.toLowerCase()} update for ${matter.title}`)
    setStatusModalMatterId(null)
  }

  async function addTask(task: Omit<Task, 'id' | 'createdAt'>) {
    const newTask: Task = {
      ...task,
      location: getCanonicalLocation(task.location, matters, tasks),
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().slice(0, 10),
    }
    if (isCloudMode && supabase) {
      const { error } = await supabase.from('tasks').insert(toTaskInsert(newTask))
      if (error) {
        setDataError(error.message)
        return
      }
      pushActivity(`created task ${newTask.title}`)
      setShowTaskModal(false)
      return
    }
    setTasks((rows) => [newTask, ...rows])
    appendAudit('TASK_CREATED', 'task', newTask.id, newTask.matterId, undefined, newTask)
    pushActivity(`created task ${newTask.title}`)
    setShowTaskModal(false)
  }

  async function updateTaskStatus(task: Task, status: Status) {
    if (isCloudMode && supabase) {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', task.id)
      if (error) {
        setDataError(error.message)
        return
      }
    }
    setTasks((rows) => rows.map((row) => (row.id === task.id ? { ...row, status } : row)))
    appendAudit('TASK_STATUS_UPDATED', 'task', task.id, task.matterId, { status: task.status }, { status })
    pushActivity(`updated task ${task.title} to ${status}`)
  }

  async function ensureCloudCategory(name: string) {
    if (!supabase) throw new Error('Supabase is not configured.')
    const cleanName = name.trim() || 'General'
    const existing = categories.find((category) => category.name.toLowerCase() === cleanName.toLowerCase())
    if (existing) return existing.id

    const { data, error } = await supabase
      .from('matter_categories')
      .upsert({ name: cleanName, color: categoryColor(cleanName) }, { onConflict: 'name' })
      .select('id,name,color')
      .single()
    if (error) throw error
    const category = data as CategoryRow
    setCategories((rows) => [...rows.filter((row) => row.id !== category.id), category])
    return category.id
  }

  async function addCloudDocuments(matterId: string, drafts: DraftDocument[]) {
    if (!supabase || !drafts.length) return
    const rows: Partial<DocumentRowData>[] = []

    for (const draft of drafts) {
      if (draft.source === 'Upload') {
        if (!draft.file) continue
        const path = `${matterId}/${crypto.randomUUID()}-${sanitizeStorageName(draft.name)}`
        const { error: uploadError } = await supabase.storage
          .from('matter-documents')
          .upload(path, draft.file, { contentType: draft.file.type || 'application/octet-stream' })
        if (uploadError) throw uploadError
        rows.push({
          matter_id: matterId,
          name: draft.name,
          document_type: draft.type,
          source: 'Upload',
          storage_path: path,
          uploaded_by_name: toTitleCase(currentUser.name),
        })
      } else {
        rows.push({
          matter_id: matterId,
          name: draft.name,
          document_type: 'LINK',
          source: 'External Link',
          external_url: draft.url,
          uploaded_by_name: toTitleCase(currentUser.name),
        })
      }
    }

    if (!rows.length) return
    const { error } = await supabase.from('documents').insert(rows)
    if (error) throw error
    rows.forEach((row) =>
      appendAudit('DOCUMENT_ATTACHED', 'document', row.storage_path ?? row.external_url ?? crypto.randomUUID(), matterId, undefined, row),
    )
  }

  const pageProps = {
    matters,
    filteredMatters,
    legalDates,
    tasks,
    documents,
    costs,
    costEntries,
    activity,
    auditEvents,
    selectedMatter,
    matterDocuments,
    matterCosts,
    matterAudit,
    selectedMatterUpdates,
    isAdmin,
    filter,
    setFilter,
    search,
    setSearch,
    counterparties,
    counterpartyFilter,
    setCounterpartyFilter,
    groupByCounterparty,
    setGroupByCounterparty,
    expandedCounterparties,
    setExpandedCounterparties,
    openMatter,
    cycleMatterStatus,
    setStatusModalMatterId,
    deleteMatter,
    handleDocumentAccess,
    addDocumentsToMatter,
    addCostEntry,
    updateCostPayment,
    deleteCostEntry,
    addTask,
    updateTaskStatus,
    setMatterModal,
    setActiveView,
  }

  if (supabaseConfigured && !session) {
    return (
      <main className="auth-only-shell">
        <section className="auth-only-card">
          <div className="brand centered">
            <span className="brand-mark">
              <Scale size={30} />
            </span>
            <div>
              <h1>Keltech</h1>
              <p>Legal Tracker</p>
            </div>
          </div>
          <LoginStrip
            mode="cloud"
            email={authEmail}
            password={authPassword}
            error={authError}
            onEmail={setAuthEmail}
            onPassword={setAuthPassword}
            onSubmit={handleAuth}
          />
          <p className="quiet-note">Production access is limited to admin-created Keltech Infrastructure Ltd. users.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Keltech Legal Tracker navigation">
        <div className="brand">
          <span className="brand-mark">
            <Scale size={28} />
          </span>
          <div>
            <strong>Keltech</strong>
            <span>Legal Tracker</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                className={activeView === item.label ? 'nav-item active' : 'nav-item'}
                type="button"
                onClick={() => changeView(item.label)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="tenant-card">
          <p>Keltech Infrastructure Ltd.</p>
          <div className="user-chip">
            <span>{initials(currentUser.name)}</span>
            <div>
              <strong>{toTitleCase(currentUser.name)}</strong>
              <small>{supabaseConfigured ? `${currentUser.role === 'admin' ? 'Admin' : 'User'} access` : 'Demo mode'}</small>
            </div>
          </div>
          <button type="button" className="ghost-button full" onClick={handleLogout}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="team-select">
            <Users size={17} />
            <strong>Team:</strong>
            <span>Keltech Legal</span>
            <ChevronDown size={14} />
          </div>
          <label className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search matters, documents, counterparties..."
            />
          </label>
          <button className="primary-button" type="button" onClick={() => setMatterModal({ mode: 'create' })}>
            <Plus size={18} />
            Add Matter
          </button>
        </header>

        {!supabaseConfigured && (
          <LoginStrip
            mode="demo"
            email={authEmail}
            password={authPassword}
            error={authError}
            onEmail={setAuthEmail}
            onPassword={setAuthPassword}
            onSubmit={handleAuth}
          />
        )}
        {supabaseConfigured && !session && (
          <LoginStrip
            mode="cloud"
            email={authEmail}
            password={authPassword}
            error={authError}
            onEmail={setAuthEmail}
            onPassword={setAuthPassword}
            onSubmit={handleAuth}
          />
        )}
        {dataError && <div className="data-banner">{dataError}</div>}
        {dataLoading && <div className="data-banner">Loading secure Supabase workspace...</div>}

        {activeView === 'Dashboard' && (
          <DashboardPage
            {...pageProps}
            openMatterCount={openMatterCount}
            dueSoonCount={dueSoonCount}
            overdueCount={overdueCount}
            totalBudget={totalPlanned}
            totalActual={totalPaid}
          />
        )}
        {activeView === 'Matters' && <MattersPage {...pageProps} />}
        {activeView === 'Matter Detail' && <MatterDetailPage {...pageProps} />}
        {activeView === 'Calendar' && (
          <CalendarPage matters={matters} legalDates={legalDates} onOpenMatter={openMatter} onUpdateStatus={updateLegalDateStatus} />
        )}
        {activeView === 'Tasks' && (
          <TasksPage
            matters={matters}
            tasks={tasks}
            onAddTask={() => setShowTaskModal(true)}
            onOpenMatter={openMatter}
            onUpdateStatus={updateTaskStatus}
          />
        )}
        {activeView === 'Costs' && (
          <CostsPage
            matters={matters}
            costEntries={costEntries}
            isAdmin={isAdmin}
            onAddCost={addCostEntry}
            onUpdatePayment={updateCostPayment}
            onDeleteCost={deleteCostEntry}
          />
        )}
        {activeView === 'Documents' && (
          <DocumentsPage
            matters={matters}
            documents={documents}
            filter={documentFilter}
            onFilter={setDocumentFilter}
            onAccess={handleDocumentAccess}
            onAddDocuments={addDocumentsToMatter}
          />
        )}
        {activeView === 'Audit Log' && (
          <AuditLogPage
            auditEvents={visibleAudit}
            selectedAudit={selectedAudit}
            users={['All users', ...Array.from(new Set(auditEvents.map((event) => event.actor)))]}
            actions={['All actions', ...Array.from(new Set(auditEvents.map((event) => event.action)))]}
            filter={auditFilter}
            onFilter={setAuditFilter}
            onSelect={setSelectedAuditId}
          />
        )}
        {activeView === 'Reports' && (
          <ReportsPage matters={matters} legalDates={legalDates} costs={costs} auditEvents={auditEvents} />
        )}
        {activeView === 'Settings' && <SettingsPage />}
      </section>

      {matterModal && (
        <MatterModal
          mode={matterModal.mode}
          matter={matterModal.matterId ? matters.find((row) => row.id === matterModal.matterId) : undefined}
          matters={matters}
          tasks={tasks}
          onClose={() => setMatterModal(null)}
          onSave={(result) => saveMatter(result, matterModal.mode, matterModal.matterId)}
        />
      )}
      {statusModalMatterId && (
        <MatterStatusModal
          matter={matters.find((row) => row.id === statusModalMatterId) ?? selectedMatter}
          onClose={() => setStatusModalMatterId(null)}
          onSave={applyMatterStatusUpdate}
        />
      )}
      {showTaskModal && (
        <TaskModal matters={matters} tasks={tasks} onClose={() => setShowTaskModal(false)} onSave={addTask} />
      )}
    </main>
  )
}

function LoginStrip({
  mode,
  email,
  password,
  error,
  onEmail,
  onPassword,
  onSubmit,
}: {
  mode: 'demo' | 'cloud'
  email: string
  password: string
  error: string
  onEmail: (email: string) => void
  onPassword: (password: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form className={mode === 'demo' ? 'auth-strip' : 'auth-strip strong'} onSubmit={onSubmit}>
      <Lock size={18} />
      <span>
        {mode === 'demo'
          ? 'Supabase env vars are not set. Use demo login locally, then connect production credentials.'
          : 'Sign in with your Keltech legal account.'}
      </span>
      <input value={email} onChange={(event) => onEmail(event.target.value)} aria-label="Email" />
      <input
        value={password}
        onChange={(event) => onPassword(event.target.value)}
        type="password"
        placeholder={mode === 'demo' ? 'Optional' : 'Password'}
        aria-label="Password"
        required={mode === 'cloud'}
      />
      <button type="submit">
        <LogIn size={15} />
        {mode === 'demo' ? 'Use demo' : 'Sign in'}
      </button>
      {error && <strong>{error}</strong>}
    </form>
  )
}

type SharedPageProps = {
  matters: Matter[]
  filteredMatters: Matter[]
  legalDates: LegalDate[]
  tasks: Task[]
  documents: DocumentRecord[]
  costs: CostRow[]
  costEntries: CostEntry[]
  activity: ActivityRow[]
  auditEvents: AuditEvent[]
  selectedMatter: Matter
  matterDocuments: DocumentRecord[]
  matterCosts: CostEntry[]
  matterAudit: AuditEvent[]
  selectedMatterUpdates: MatterUpdate[]
  isAdmin: boolean
  filter: string
  setFilter: (filter: string) => void
  search: string
  setSearch: (value: string) => void
  counterparties: string[]
  counterpartyFilter: string
  setCounterpartyFilter: (value: string) => void
  groupByCounterparty: boolean
  setGroupByCounterparty: (value: boolean) => void
  expandedCounterparties: string[]
  setExpandedCounterparties: (value: string[]) => void
  openMatter: (id: string) => void
  cycleMatterStatus: (matter: Matter) => void
  setStatusModalMatterId: (matterId: string | null) => void
  deleteMatter: (matter: Matter) => void
  handleDocumentAccess: (document: DocumentRecord, mode: DocumentAccessMode) => void
  addDocumentsToMatter: (matterId: string, drafts: DraftDocument[]) => void
  addCostEntry: (entry: Omit<CostEntry, 'id'>) => void
  updateCostPayment: (entry: CostEntry, paidAmount: number, paidOn?: string) => void
  deleteCostEntry: (entry: CostEntry) => void
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  updateTaskStatus: (task: Task, status: Status) => void
  setMatterModal: (modal: { mode: 'create' | 'edit'; matterId?: string } | null) => void
  setActiveView: (view: View) => void
}

function DashboardPage({
  matters,
  filteredMatters,
  legalDates,
  tasks,
  selectedMatter,
  matterDocuments,
  activity,
  costs,
  openMatterCount,
  dueSoonCount,
  overdueCount,
  totalBudget,
  totalActual,
  setFilter,
  filter,
  openMatter,
  cycleMatterStatus,
  setStatusModalMatterId,
  handleDocumentAccess,
  updateTaskStatus,
}: SharedPageProps & {
  openMatterCount: number
  dueSoonCount: number
  overdueCount: number
  totalBudget: number
  totalActual: number
}) {
  return (
    <div className="dashboard-grid">
      <section className="metric-row">
        <MetricCard icon={CalendarDays} label="Upcoming Dates" value={legalDates.length} sub="Next 30 days" tone="blue" />
        <MetricCard icon={AlertTriangle} label="Due Soon" value={dueSoonCount} sub="Within 7 days" tone="amber" />
        <MetricCard icon={Clock3} label="Overdue" value={overdueCount} sub="Require attention" tone="red" />
        <MetricCard icon={FolderOpen} label="Open Matters" value={openMatterCount} sub="Across all categories" tone="green" />
      </section>

      <section className="panel matter-panel">
        <PanelTitle title="Matter Tracker" subtitle="Live legal work across dates, documents, costs, and owners." />
        <StatusTabs filter={filter} onFilter={setFilter} />
        <MatterTable matters={filteredMatters.slice(0, 8)} selectedMatterId={selectedMatter.id} onOpenMatter={openMatter} onCycleStatus={cycleMatterStatus} onUpdateMatter={setStatusModalMatterId} />
        <div className="table-footer">
          Showing {Math.min(filteredMatters.length, 8)} of {matters.length} matters
          <button type="button" onClick={() => setFilter('All')}>Reset filters</button>
        </div>
      </section>

      <UpcomingDatesPanel legalDates={legalDates} />
      <DashboardTasksPanel tasks={tasks} matters={matters} onUpdateStatus={updateTaskStatus} />
      <CostPanel costs={costs} totalBudget={totalBudget} totalActual={totalActual} />
      <DocumentPanel documents={matterDocuments} selectedMatter={selectedMatter} onAccess={handleDocumentAccess} />
      <ActivityPanel activity={activity} />
    </div>
  )
}

function MattersPage({
  filteredMatters,
  selectedMatter,
  counterparties,
  counterpartyFilter,
  setCounterpartyFilter,
  groupByCounterparty,
  setGroupByCounterparty,
  expandedCounterparties,
  setExpandedCounterparties,
  filter,
  setFilter,
  openMatter,
  cycleMatterStatus,
  setMatterModal,
  setStatusModalMatterId,
}: SharedPageProps) {
  const [columnFilters, setColumnFilters] = useState({
    category: 'All categories',
    owner: 'All owners',
    priority: 'All priorities',
    location: 'All locations',
  })
  const categoryOptions = uniqueOptions(filteredMatters.map((matter) => matter.category))
  const ownerOptions = uniqueOptions(filteredMatters.map((matter) => matter.owner))
  const priorityOptions = uniqueOptions(filteredMatters.map((matter) => matter.priority))
  const locationOptions = uniqueOptions(filteredMatters.map((matter) => matter.location).filter(Boolean))
  const visibleMatters = filteredMatters.filter((matter) => (
    (columnFilters.category === 'All categories' || matter.category === columnFilters.category) &&
    (columnFilters.owner === 'All owners' || matter.owner === columnFilters.owner) &&
    (columnFilters.priority === 'All priorities' || matter.priority === columnFilters.priority) &&
    (columnFilters.location === 'All locations' || matter.location === columnFilters.location)
  ))
  const groups = groupMattersByCounterparty(visibleMatters)

  function toggleGroup(key: string) {
    setExpandedCounterparties(
      expandedCounterparties.includes(key)
        ? expandedCounterparties.filter((item) => item !== key)
        : [...expandedCounterparties, key],
    )
  }

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <h1>Matters</h1>
          <p>Track matters individually or group them by counterparty for exposure visibility.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setMatterModal({ mode: 'create' })}>
          <Plus size={17} />
          Add Matter
        </button>
      </div>

      <section className="panel">
        <div className="toolbar-row">
          <StatusTabs filter={filter} onFilter={setFilter} />
          <label className="inline-field">
            Counterparty
            <select value={counterpartyFilter} onChange={(event) => setCounterpartyFilter(event.target.value)}>
              <option>All counterparties</option>
              {counterparties.map((counterparty) => (
                <option key={counterparty}>{counterparty}</option>
              ))}
            </select>
          </label>
          <label className="toggle-control">
            <input
              type="checkbox"
              checked={groupByCounterparty}
              onChange={(event) => setGroupByCounterparty(event.target.checked)}
            />
            Group by Counterparty
          </label>
        </div>
        <div className="column-filters">
          <FilterSelect label="Category" value={columnFilters.category} allLabel="All categories" options={categoryOptions} onChange={(value) => setColumnFilters((current) => ({ ...current, category: value }))} />
          <FilterSelect label="Owner" value={columnFilters.owner} allLabel="All owners" options={ownerOptions} onChange={(value) => setColumnFilters((current) => ({ ...current, owner: value }))} />
          <FilterSelect label="Priority" value={columnFilters.priority} allLabel="All priorities" options={priorityOptions} onChange={(value) => setColumnFilters((current) => ({ ...current, priority: value }))} />
          <FilterSelect label="Location" value={columnFilters.location} allLabel="All locations" options={locationOptions} onChange={(value) => setColumnFilters((current) => ({ ...current, location: value }))} />
        </div>

        {!groupByCounterparty && (
          <MatterTable matters={visibleMatters} selectedMatterId={selectedMatter.id} onOpenMatter={openMatter} onCycleStatus={cycleMatterStatus} onUpdateMatter={setStatusModalMatterId} />
        )}

        {groupByCounterparty && (
          <div className="counterparty-groups">
            {groups.map((group) => {
              const expanded = expandedCounterparties.includes(group.key)
              return (
                <article className="counterparty-group" key={group.key}>
                  <button type="button" className="group-header" onClick={() => toggleGroup(group.key)}>
                    {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                    <span>
                      <strong>{group.name}</strong>
                      <small>
                        {group.matters.length} matters, {group.open} open, {group.overdue} overdue, next {group.nextDate ? formatShortDate(group.nextDate) : 'none'}
                      </small>
                    </span>
                    <b>{currency.format(group.monthlyCost)}</b>
                  </button>
                  {expanded && (
                    <MatterTable matters={group.matters} selectedMatterId={selectedMatter.id} onOpenMatter={openMatter} onCycleStatus={cycleMatterStatus} onUpdateMatter={setStatusModalMatterId} compact />
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </section>
  )
}

function TasksPage({
  matters,
  tasks,
  onAddTask,
  onOpenMatter,
  onUpdateStatus,
}: {
  matters: Matter[]
  tasks: Task[]
  onAddTask: () => void
  onOpenMatter: (matterId: string) => void
  onUpdateStatus: (task: Task, status: Status) => void
}) {
  const [statusFilter, setStatusFilter] = useState('All')
  const [matterFilter, setMatterFilter] = useState('All matters')
  const [columnFilters, setColumnFilters] = useState({
    assignee: 'All assignees',
    priority: 'All priorities',
    location: 'All locations',
  })
  const assigneeOptions = uniqueOptions(tasks.map((task) => task.assignee))
  const priorityOptions = uniqueOptions(tasks.map((task) => task.priority))
  const locationOptions = uniqueOptions(tasks.map((task) => task.location).filter(Boolean))
  const visibleTasks = tasks.filter((task) => {
    const statusMatch = statusFilter === 'All' || task.status === statusFilter
    const matterMatch =
      matterFilter === 'All matters' ||
      (matterFilter === 'Standalone tasks' ? !task.matterId : task.matterId === matterFilter)
    const columnMatch =
      (columnFilters.assignee === 'All assignees' || task.assignee === columnFilters.assignee) &&
      (columnFilters.priority === 'All priorities' || task.priority === columnFilters.priority) &&
      (columnFilters.location === 'All locations' || task.location === columnFilters.location)
    return statusMatch && matterMatch && columnMatch
  })

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>Track legal work items independently from matters, with optional matter links.</p>
        </div>
        <button className="primary-button" type="button" onClick={onAddTask}>
          <Plus size={17} />
          Add Task
        </button>
      </div>

      <section className="panel">
        <div className="toolbar-row">
          <StatusTabs filter={statusFilter} onFilter={setStatusFilter} />
          <label className="inline-field">
            Matter
            <select value={matterFilter} onChange={(event) => setMatterFilter(event.target.value)}>
              <option>All matters</option>
              <option>Standalone tasks</option>
              {matters.map((matter) => (
                <option key={matter.id} value={matter.id}>{matter.title}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="column-filters">
          <FilterSelect label="Assignee" value={columnFilters.assignee} allLabel="All assignees" options={assigneeOptions} onChange={(value) => setColumnFilters((current) => ({ ...current, assignee: value }))} />
          <FilterSelect label="Priority" value={columnFilters.priority} allLabel="All priorities" options={priorityOptions} onChange={(value) => setColumnFilters((current) => ({ ...current, priority: value }))} />
          <FilterSelect label="Location" value={columnFilters.location} allLabel="All locations" options={locationOptions} onChange={(value) => setColumnFilters((current) => ({ ...current, location: value }))} />
        </div>
        <TaskTable tasks={visibleTasks} matters={matters} onOpenMatter={onOpenMatter} onUpdateStatus={onUpdateStatus} />
      </section>
    </section>
  )
}

function MatterDetailPage({
  selectedMatter,
  matterDocuments,
  matterCosts,
  matterAudit,
  selectedMatterUpdates,
  isAdmin,
  legalDates,
  documents,
  setActiveView,
  setMatterModal,
  setStatusModalMatterId,
  deleteMatter,
  handleDocumentAccess,
  addDocumentsToMatter,
}: SharedPageProps) {
  const matterDates = legalDates.filter((date) => date.matterId === selectedMatter.id)

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <button className="back-button" type="button" onClick={() => setActiveView('Matters')}>
            <ArrowLeft size={16} />
            Matters
          </button>
          <h1>{selectedMatter.title}</h1>
          <p>{selectedMatter.counterparty} - {selectedMatter.category} - {selectedMatter.owner}</p>
        </div>
        <div className="button-pair">
          {isAdmin && (
            <button className="danger-button" type="button" onClick={() => deleteMatter(selectedMatter)}>
              <Trash2 size={16} />
              Delete Matter
            </button>
          )}
          <button className="ghost-button" type="button" onClick={() => setStatusModalMatterId(selectedMatter.id)}>
            Update Status
          </button>
          <button className="primary-button" type="button" onClick={() => setMatterModal({ mode: 'edit', matterId: selectedMatter.id })}>
            <Edit3 size={16} />
            Edit Matter
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <section className="panel detail-main">
          <PanelTitle title="Overview" subtitle={selectedMatter.description} />
          <div className="detail-facts">
            <Fact label="Status" value={selectedMatter.status} />
            <Fact label="Priority" value={selectedMatter.priority} />
            <Fact label="Location" value={selectedMatter.location || 'Not set'} />
            <Fact label="Next Date" value={`${formatShortDate(selectedMatter.nextDate)} - ${selectedMatter.nextDateLabel}`} />
            <Fact label="Monthly Cost" value={currency.format(selectedMatter.monthlyCost)} />
            <Fact label="Opened On" value={formatShortDate(selectedMatter.openedOn)} />
            <Fact label="Last Update" value={selectedMatter.lastUpdate} />
          </div>
        </section>

        <section className="panel">
          <PanelTitle title="Dates and Tasks" subtitle="Matter-linked legal dates." />
          <div className="simple-list">
            {matterDates.map((date) => (
              <article key={date.id}>
                <CalendarDays size={17} />
                <span>
                  <strong>{date.type}</strong>
                  <small>{formatShortDate(date.date)} - {date.status}</small>
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <PanelTitle title="Documents" subtitle={`${matterDocuments.length} linked documents.`} />
          <DocumentAttachBox matterId={selectedMatter.id} onAddDocuments={addDocumentsToMatter} />
          <div className="doc-list">
            {matterDocuments.map((document) => (
              <DocumentRow key={document.id} document={document} onAccess={handleDocumentAccess} />
            ))}
          </div>
        </section>

        <section className="panel">
          <PanelTitle title="Costs" subtitle="Matter-linked INR cost entries." />
          <div className="simple-list">
            {matterCosts.map((entry) => (
              <article key={entry.id}>
                <IndianRupee size={17} />
                <span>
                  <strong>{currency.format(entry.amount)} - {entry.category}</strong>
                  <small>{entry.vendor} - {entry.month}</small>
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel detail-wide">
          <MatterHistoryPanel
            matter={selectedMatter}
            updates={selectedMatterUpdates}
            documents={matterDocuments}
            costs={matterCosts}
            auditEvents={matterAudit}
            onAccess={handleDocumentAccess}
          />
        </section>
      </div>
      <p className="quiet-note">This matter has {documents.filter((document) => document.matterId === selectedMatter.id).length} documents attached.</p>
    </section>
  )
}

type MatterHistoryItem = {
  id: string
  kind: 'Update' | 'Document' | 'Payment' | 'Date' | 'Matter' | 'Audit'
  title: string
  summary: string
  actor: string
  createdAt: string
  document?: DocumentRecord
}

function MatterHistoryPanel({
  matter,
  updates,
  documents,
  costs,
  auditEvents,
  onAccess,
}: {
  matter: Matter
  updates: MatterUpdate[]
  documents: DocumentRecord[]
  costs: CostEntry[]
  auditEvents: AuditEvent[]
  onAccess: (document: DocumentRecord, mode: DocumentAccessMode) => void
}) {
  const totalNoted = costs.reduce((sum, entry) => sum + entry.amount, 0)
  const totalPaid = costs.reduce((sum, entry) => sum + entry.paidAmount, 0)
  const historyItems = buildMatterHistoryItems(updates, documents, auditEvents)

  return (
    <>
      <PanelTitle
        title="Matter History Ledger"
        subtitle="Readable matter updates, document attachments, payments, and security-sensitive actions."
      />
      <div className="history-summary">
        <Fact label="Updates" value={String(updates.length)} />
        <Fact label="Documents" value={String(documents.length)} />
        <Fact label="Outstanding" value={currency.format(Math.max(totalNoted - totalPaid, 0))} />
        <Fact label="Current Status" value={matter.status} />
      </div>
      <div className="history-list">
        {historyItems.length ? historyItems.map((item) => (
          <article key={item.id} className="history-item">
            <span className={`history-icon ${item.kind.toLowerCase()}`}>
              {historyIcon(item.kind)}
            </span>
            <div>
              <div className="history-heading">
                <strong>{item.title}</strong>
                <time>{formatDateTime(item.createdAt)}</time>
              </div>
              <p>{item.summary}</p>
              <small>{item.actor}</small>
              {item.document && (
                <div className="history-document">
                  <FileText size={16} />
                  <span>
                    <strong>{item.document.name}</strong>
                    <small>{item.document.type} - {item.document.source}</small>
                  </span>
                  <span className="doc-actions">
                    <button
                      className="icon-button"
                      type="button"
                      title={item.document.source === 'External Link' ? 'Open link' : 'Preview document'}
                      onClick={() => onAccess(item.document as DocumentRecord, 'preview')}
                    >
                      <Link2 size={15} />
                    </button>
                    {item.document.source === 'Upload' && (
                      <button className="icon-button" type="button" title="Download document" onClick={() => onAccess(item.document as DocumentRecord, 'download')}>
                        <Download size={15} />
                      </button>
                    )}
                  </span>
                </div>
              )}
            </div>
          </article>
        )) : (
          <p className="quiet-note">No ledger entries yet. Status updates and document attachments will appear here.</p>
        )}
      </div>
    </>
  )
}

function CalendarPage({
  matters,
  legalDates,
  onOpenMatter,
  onUpdateStatus: _onUpdateStatus,
}: {
  matters: Matter[]
  legalDates: LegalDate[]
  onOpenMatter: (matterId: string) => void
  onUpdateStatus: (date: LegalDate, status: Status) => void
}) {
  void _onUpdateStatus
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const firstTrackedDate = legalDates.map((date) => date.date).sort()[0]
    return firstTrackedDate ? parseMonthKey(firstTrackedDate) : monthFromDate(new Date())
  })
  const calendarDays = buildCalendarMonth(visibleMonth.year, visibleMonth.monthIndex)
  const monthLabel = formatMonthLabel(visibleMonth.year, visibleMonth.monthIndex)
  const monthDates = legalDates
    .filter((date) => parseMonthKey(date.date).key === visibleMonth.key)
    .sort((a, b) => a.date.localeCompare(b.date))
  const allSortedDates = [...legalDates].sort((a, b) => a.date.localeCompare(b.date))

  function shiftMonth(delta: number) {
    setVisibleMonth((current) => monthFromParts(current.year, current.monthIndex + delta))
  }

  function jumpToToday() {
    setVisibleMonth(monthFromDate(new Date()))
  }

  return (
    <section className="page-stack">
      <PageHeading title="Calendar" subtitle="Matter-linked hearings, filings, renewals, reviews, and compliance dates." />
      <div className="calendar-layout">
        <section className="panel calendar-panel">
          <div className="calendar-title">
            <div>
              <h2>{monthLabel}</h2>
              <p>{monthDates.length} tracked legal dates this month, {legalDates.length} total</p>
            </div>
            <div className="calendar-controls">
              <button className="ghost-button" type="button" onClick={() => shiftMonth(-1)}>Previous</button>
              <button className="ghost-button" type="button" onClick={jumpToToday}>Today</button>
              <button className="ghost-button" type="button" onClick={() => shiftMonth(1)}>Next</button>
            </div>
          </div>
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {calendarDays.map((day) => {
              const dayEvents = legalDates.filter((date) => date.date === day.iso)
              return (
                <article className={day.inMonth ? 'calendar-cell' : 'calendar-cell muted'} key={day.iso}>
                  <strong>{day.day}</strong>
                  <div className="calendar-events">
                    {dayEvents.map((event) => (
                      <button
                        key={event.id}
                        className={`calendar-chip ${statusClass(event.status === 'Closed' ? 'Closed' : statusFromDate(event.date))}`}
                        type="button"
                        onClick={() => onOpenMatter(event.matterId)}
                      >
                        {event.type}: {event.title}
                      </button>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="panel calendar-side">
          <PanelTitle title="Date Queue" subtitle={`${monthLabel} dates first; all dates remain tracked.`} />
          <div className="calendar-list">
            {(monthDates.length ? monthDates : allSortedDates).map((date) => {
            const matter = matters.find((item) => item.id === date.matterId)
            const autoStatus = date.status === 'Closed' ? 'Closed' : statusFromDate(date.date)
            return (
              <article className={`calendar-row ${statusClass(autoStatus)}`} key={date.id}>
                <div className="date-box">
                  <span>{new Date(date.date).toLocaleString('en-IN', { month: 'short' })}</span>
                  <strong>{new Date(date.date).getDate()}</strong>
                  <small>{new Date(date.date).toLocaleString('en-IN', { weekday: 'short' })}</small>
                </div>
                <span>
                  <strong>{date.title}</strong>
                  <small>{date.type} - {matter?.counterparty ?? 'Unknown counterparty'}</small>
                </span>
                <span className={`status ${statusClass(autoStatus)}`}>Auto: {autoStatus}</span>
                <button className="ghost-button" type="button" onClick={() => onOpenMatter(date.matterId)}>
                  Open Matter
                </button>
              </article>
            )
            })}
          </div>
        </section>
      </div>
    </section>
  )
}

function CostsPage({
  matters,
  costEntries,
  isAdmin,
  onAddCost,
  onUpdatePayment,
  onDeleteCost,
}: {
  matters: Matter[]
  costEntries: CostEntry[]
  isAdmin: boolean
  onAddCost: (entry: Omit<CostEntry, 'id'>) => void
  onUpdatePayment: (entry: CostEntry, paidAmount: number, paidOn?: string) => void
  onDeleteCost: (entry: CostEntry) => void
}) {
  const [matterId, setMatterId] = useState(matters[0]?.id ?? '')
  const [amount, setAmount] = useState(50000)
  const [paidAmount, setPaidAmount] = useState(0)
  const [costMonth, setCostMonth] = useState(monthFromDate(new Date()))
  const [description, setDescription] = useState('Counsel fee estimate')
  const selectedMatter = matters.find((matter) => matter.id === matterId) ?? matters[0]
  const selectedMonthKey = formatMonthKey(costMonth.year, costMonth.monthIndex)
  const visibleEntries = costEntries.filter((entry) => entry.month === selectedMonthKey)
  const costRows = buildCostRows([], [], visibleEntries)
  const totalNoted = visibleEntries.reduce((sum, row) => sum + row.amount, 0)
  const totalPaid = visibleEntries.reduce((sum, row) => sum + row.paidAmount, 0)
  const totalOutstanding = Math.max(totalNoted - totalPaid, 0)
  const monthLabel = formatMonthLabel(costMonth.year, costMonth.monthIndex)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedMatter) return
    const cappedPaid = Math.min(paidAmount, amount)
    onAddCost({
      matterId: selectedMatter.id,
      category: selectedMatter.category,
      amount,
      paidAmount: cappedPaid,
      paidOn: cappedPaid > 0 ? new Date().toISOString().slice(0, 10) : undefined,
      paymentStatus: getPaymentStatus(amount, cappedPaid),
      vendor: selectedMatter.owner,
      month: selectedMonthKey,
      description,
    })
    setAmount(50000)
    setPaidAmount(0)
  }

  return (
    <section className="page-stack">
      <PageHeading title="Costs" subtitle="INR noted costs, payments made, and outstanding legal spend by month." />
      <div className="month-toolbar">
        <button className="ghost-button" type="button" onClick={() => setCostMonth(shiftMonth(costMonth, -1))}>Previous</button>
        <strong>{monthLabel}</strong>
        <button className="ghost-button" type="button" onClick={() => setCostMonth(monthFromDate(new Date()))}>Current month</button>
        <button className="ghost-button" type="button" onClick={() => setCostMonth(shiftMonth(costMonth, 1))}>Next</button>
      </div>
      <div className="two-column">
        <CostPanel costs={costRows} totalBudget={totalNoted} totalActual={totalPaid} />
        <section className="panel">
          <PanelTitle title="Add Cost Entry" subtitle="Attach spend to a specific matter." />
          <form className="compact-form" onSubmit={submit}>
            <label>
              Matter
              <select value={matterId} onChange={(event) => setMatterId(event.target.value)}>
                {matters.map((matter) => (
                  <option key={matter.id} value={matter.id}>{matter.title}</option>
                ))}
              </select>
            </label>
            <label>
              Amount INR
              <input type="number" min="0" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
            </label>
            <label>
              Paid now INR
              <input type="number" min="0" max={amount} value={paidAmount} onChange={(event) => setPaidAmount(Number(event.target.value))} />
            </label>
            <label>
              Description
              <input value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <button className="primary-button" type="submit">Add Cost</button>
          </form>
        </section>
      </div>
      <section className="panel">
        <PanelTitle title="Cost Entries" subtitle={`${visibleEntries.length} entries for ${monthLabel}. Outstanding: ${currency.format(totalOutstanding)}.`} />
        <CostEntriesTable entries={visibleEntries} matters={matters} isAdmin={isAdmin} onUpdatePayment={onUpdatePayment} onDeleteCost={onDeleteCost} />
      </section>
    </section>
  )
}

function CostEntriesTable({
  entries,
  matters,
  isAdmin,
  onUpdatePayment,
  onDeleteCost,
}: {
  entries: CostEntry[]
  matters: Matter[]
  isAdmin: boolean
  onUpdatePayment: (entry: CostEntry, paidAmount: number, paidOn?: string) => void
  onDeleteCost: (entry: CostEntry) => void
}) {
  if (!entries.length) return <p className="quiet-note">No cost entries for this month.</p>

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Matter</th>
            <th>Category</th>
            <th>Noted Cost</th>
            <th>Paid</th>
            <th>Outstanding</th>
            <th>Status</th>
            <th>Vendor</th>
            <th>Description</th>
            <th>Payment</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <CostEntryRowView
              key={`${entry.id}-${entry.paidAmount}-${entry.paidOn ?? ''}`}
              entry={entry}
              matter={matters.find((matter) => matter.id === entry.matterId)}
              isAdmin={isAdmin}
              onUpdatePayment={onUpdatePayment}
              onDeleteCost={onDeleteCost}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CostEntryRowView({
  entry,
  matter,
  isAdmin,
  onUpdatePayment,
  onDeleteCost,
}: {
  entry: CostEntry
  matter?: Matter
  isAdmin: boolean
  onUpdatePayment: (entry: CostEntry, paidAmount: number, paidOn?: string) => void
  onDeleteCost: (entry: CostEntry) => void
}) {
  const [paidAmount, setPaidAmount] = useState(entry.paidAmount)
  const [paidOn, setPaidOn] = useState(entry.paidOn ?? new Date().toISOString().slice(0, 10))
  const outstanding = Math.max(entry.amount - entry.paidAmount, 0)

  return (
    <tr>
      <td>{matter?.title ?? 'Unknown'}</td>
      <td>{entry.category}</td>
      <td>{currency.format(entry.amount)}</td>
      <td>{currency.format(entry.paidAmount)}</td>
      <td>{currency.format(outstanding)}</td>
      <td><span className={`status ${paymentStatusClass(entry.paymentStatus)}`}>{entry.paymentStatus}</span></td>
      <td>{entry.vendor}</td>
      <td>{entry.description}</td>
      <td>
        <div className="payment-controls">
          <input type="number" min="0" max={entry.amount} value={paidAmount} onChange={(event) => setPaidAmount(Number(event.target.value))} />
          <input type="date" value={paidOn} onChange={(event) => setPaidOn(event.target.value)} />
          <button className="ghost-button" type="button" onClick={() => onUpdatePayment(entry, Math.min(paidAmount, entry.amount), paidOn)}>
            Save
          </button>
        </div>
      </td>
      {isAdmin && (
        <td>
          <button className="danger-button compact-danger" type="button" onClick={() => onDeleteCost(entry)}>
            <Trash2 size={15} />
            Delete
          </button>
        </td>
      )}
    </tr>
  )
}

function DocumentsPage({
  matters,
  documents,
  filter,
  onFilter,
  onAccess,
  onAddDocuments,
}: {
  matters: Matter[]
  documents: DocumentRecord[]
  filter: string
  onFilter: (value: string) => void
  onAccess: (document: DocumentRecord, mode: DocumentAccessMode) => void
  onAddDocuments: (matterId: string, drafts: DraftDocument[]) => void
}) {
  const [matterId, setMatterId] = useState(matters[0]?.id ?? '')
  const visibleDocs = documents.filter((document) => filter === 'All matters' || document.matterId === filter)

  return (
    <section className="page-stack">
      <PageHeading title="Documents" subtitle="Global document library filtered by matter, counterparty, source, and type." />
      <section className="panel">
        <div className="toolbar-row">
          <label className="inline-field">
            Matter
            <select value={filter} onChange={(event) => onFilter(event.target.value)}>
              <option>All matters</option>
              {matters.map((matter) => (
                <option key={matter.id} value={matter.id}>{matter.title}</option>
              ))}
            </select>
          </label>
          <label className="inline-field">
            Attach to
            <select value={matterId} onChange={(event) => setMatterId(event.target.value)}>
              {matters.map((matter) => (
                <option key={matter.id} value={matter.id}>{matter.title}</option>
              ))}
            </select>
          </label>
        </div>
        <DocumentAttachBox matterId={matterId} onAddDocuments={onAddDocuments} />
        <div className="doc-list">
          {visibleDocs.map((document) => (
            <DocumentRow key={document.id} document={document} matter={matters.find((matter) => matter.id === document.matterId)} onAccess={onAccess} />
          ))}
        </div>
      </section>
    </section>
  )
}

function ReportsPage({
  matters,
  legalDates,
  costs,
  auditEvents,
}: {
  matters: Matter[]
  legalDates: LegalDate[]
  costs: CostRow[]
  auditEvents: AuditEvent[]
}) {
  const exposure = groupMattersByCounterparty(matters).sort((a, b) => b.monthlyCost - a.monthlyCost)
  return (
    <section className="page-stack">
      <PageHeading title="Reports" subtitle="Executive view of risk, deadlines, counterparty exposure, and spend." />
      <section className="report-grid">
        <MetricCard icon={AlertTriangle} label="Overdue Matters" value={matters.filter((matter) => matter.status === 'Overdue').length} sub="Need action" tone="red" />
        <MetricCard icon={CalendarDays} label="Upcoming Dates" value={legalDates.length} sub="Tracked dates" tone="blue" />
        <MetricCard icon={IndianRupee} label="Payments Made" value={currency.format(costs.reduce((s, row) => s + row.actual, 0))} sub="Against noted costs" tone="green" />
        <MetricCard icon={ShieldCheck} label="Audit Events" value={auditEvents.length} sub="Recorded actions" tone="amber" />
      </section>
      <section className="panel">
        <PanelTitle title="Counterparty Exposure" subtitle="Groups remain visual only; matters stay separate records." />
        <DataTable
          headers={['Counterparty', 'Matters', 'Open', 'Overdue', 'Monthly Cost']}
          rows={exposure.map((group) => [
            group.name,
            String(group.matters.length),
            String(group.open),
            String(group.overdue),
            currency.format(group.monthlyCost),
          ])}
        />
      </section>
    </section>
  )
}

function SettingsPage() {
  return (
    <section className="page-stack">
      <PageHeading title="Settings" subtitle="Company and deployment settings for Keltech Infrastructure Ltd." />
      <section className="panel settings-panel">
        <Fact label="Company" value="Keltech Infrastructure Ltd." />
        <Fact label="Currency" value="INR" />
        <Fact label="Login" value="Individual email/password accounts" />
        <Fact label="Permissions" value="Equal access for all authenticated users in v1" />
        <Fact label="Audit" value="Append-only events for sensitive activity" />
      </section>
    </section>
  )
}

function AuditLogPage({
  auditEvents,
  selectedAudit,
  users,
  actions,
  filter,
  onFilter,
  onSelect,
}: {
  auditEvents: AuditEvent[]
  selectedAudit: AuditEvent
  users: string[]
  actions: string[]
  filter: { user: string; action: string; entity: string }
  onFilter: (filter: { user: string; action: string; entity: string }) => void
  onSelect: (id: string) => void
}) {
  return (
    <div className="audit-layout">
      <section className="panel audit-table-panel">
        <PanelTitle title="Audit Log" subtitle="Append-only activity trail for accountability and sensitive document access." />
        <div className="audit-filters">
          <label>
            User
            <select value={filter.user} onChange={(event) => onFilter({ ...filter, user: event.target.value })}>
              {users.map((user) => <option key={user}>{user}</option>)}
            </select>
          </label>
          <label>
            Action
            <select value={filter.action} onChange={(event) => onFilter({ ...filter, action: event.target.value })}>
              {actions.map((action) => <option key={action}>{action}</option>)}
            </select>
          </label>
          <label>
            Entity
            <select value={filter.entity} onChange={(event) => onFilter({ ...filter, entity: event.target.value })}>
              {['All entities', 'auth', 'matter', 'legal_date', 'task', 'cost', 'document', 'budget'].map((entity) => (
                <option key={entity}>{entity}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="audit-list">
          {auditEvents.map((event) => <AuditRow key={event.id} event={event} onSelect={() => onSelect(event.id)} />)}
        </div>
      </section>
      <aside className="panel audit-detail">
        <div className="panel-title compact">
          <h2>Event Detail</h2>
          <Archive size={18} />
        </div>
        <dl>
          <DetailTerm label="Actor" value={`${selectedAudit.actor} - ${selectedAudit.actorEmail}`} />
          <DetailTerm label="Action" value={selectedAudit.action} />
          <DetailTerm label="Entity" value={`${selectedAudit.entityType} - ${selectedAudit.entityId}`} />
          <DetailTerm label="Matter" value={selectedAudit.matterTitle ?? 'Not matter-specific'} />
          <DetailTerm label="IP metadata" value={selectedAudit.ipMetadata} />
          <DetailTerm label="User agent" value={selectedAudit.userAgent} />
        </dl>
        <div className="json-pair">
          <div>
            <strong>Before</strong>
            <pre>{JSON.stringify(selectedAudit.before ?? {}, null, 2)}</pre>
          </div>
          <div>
            <strong>After</strong>
            <pre>{JSON.stringify(selectedAudit.after ?? {}, null, 2)}</pre>
          </div>
        </div>
      </aside>
    </div>
  )
}

function MatterModal({
  mode,
  matter,
  matters,
  tasks,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit'
  matter?: Matter
  matters: Matter[]
  tasks: Task[]
  onClose: () => void
  onSave: (result: MatterFormResult) => void
}) {
  const [values, setValues] = useState<MatterFormValues>({
    title: matter?.title ?? '',
    category: matter?.category ?? 'Contracts',
    owner: matter?.owner ?? 'Jane Doe',
    counterparty: matter?.counterparty ?? '',
    location: matter?.location ?? '',
    nextDate: matter?.nextDate ?? new Date().toISOString().slice(0, 10),
    nextDateLabel: matter?.nextDateLabel ?? 'Review',
    status: matter?.status ?? 'Open',
    priority: matter?.priority ?? 'Normal',
    monthlyCost: matter?.monthlyCost ?? 50000,
    openedOn: matter?.openedOn ?? new Date().toISOString().slice(0, 10),
    description: matter?.description ?? '',
  })
  const [draftDocs, setDraftDocs] = useState<DraftDocument[]>([])
  const related = matters.filter(
    (row) =>
      normalizeCounterparty(row.counterparty) === normalizeCounterparty(values.counterparty) &&
      row.id !== matter?.id,
  )

  function update<K extends keyof MatterFormValues>(key: K, value: MatterFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!values.title.trim() || !values.counterparty.trim()) return
    onSave({
      matter: {
        ...values,
        counterparty: getCanonicalCounterparty(values.counterparty, matters),
        location: getCanonicalLocation(values.location, matters, tasks),
      },
      documents: draftDocs,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="matter-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-title">
          <h2>{mode === 'create' ? 'Add legal matter' : 'Edit legal matter'}</h2>
          <button className="ghost-button" type="button" onClick={onClose}>Close</button>
        </div>
        <div className="form-grid">
          <label>
            Matter title
            <input value={values.title} onChange={(event) => update('title', event.target.value)} required />
          </label>
          <label>
            Category
            <input value={values.category} onChange={(event) => update('category', event.target.value)} required />
          </label>
          <label>
            Owner
            <input value={values.owner} onChange={(event) => update('owner', event.target.value)} required />
          </label>
          <CounterpartyAutocomplete
            value={values.counterparty}
            matters={matters}
            onChange={(value) => update('counterparty', value)}
          />
          <LocationAutocomplete
            value={values.location}
            matters={matters}
            tasks={tasks}
            onChange={(value) => update('location', value)}
          />
          <label>
            Next date
            <input value={values.nextDate} onChange={(event) => update('nextDate', event.target.value)} type="date" required />
          </label>
          <label>
            Date type
            <input value={values.nextDateLabel} onChange={(event) => update('nextDateLabel', event.target.value)} />
          </label>
          <label>
            Status
            <select value={values.status} onChange={(event) => update('status', event.target.value as Status)}>
              {['Open', 'Due Soon', 'On Track', 'Overdue', 'Closed'].map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label>
            Priority
            <select value={values.priority} onChange={(event) => update('priority', event.target.value as Matter['priority'])}>
              {['Low', 'Normal', 'High', 'Critical'].map((priority) => <option key={priority}>{priority}</option>)}
            </select>
          </label>
          <label>
            Monthly cost in INR
            <input
              value={values.monthlyCost}
              onChange={(event) => update('monthlyCost', Number(event.target.value))}
              type="number"
              min="0"
            />
          </label>
          <label className="wide">
            Description
            <textarea value={values.description} onChange={(event) => update('description', event.target.value)} />
          </label>
        </div>

        <RelatedMatters matters={related} counterparty={values.counterparty} />
        <DraftDocuments drafts={draftDocs} onChange={setDraftDocs} />

        <button className="primary-button" type="submit">
          <Plus size={17} />
          {mode === 'create' ? 'Create matter' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}

function CounterpartyAutocomplete({
  value,
  matters,
  onChange,
}: {
  value: string
  matters: Matter[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const suggestions = canonicalCounterparties(matters).filter((counterparty) =>
    counterparty.toLowerCase().includes(value.trim().toLowerCase()),
  )

  return (
    <label className="counterparty-field">
      Counterparty
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Type or select a counterparty"
        required
      />
      {open && value && suggestions.length > 0 && (
        <div className="suggestion-list">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(suggestion)
                setOpen(false)
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </label>
  )
}

function LocationAutocomplete({
  value,
  matters,
  tasks,
  onChange,
}: {
  value: string
  matters: Matter[]
  tasks: Task[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const query = value.trim().toLowerCase()
  const suggestions = canonicalLocations(matters, tasks).filter((location) =>
    location.toLowerCase().includes(query),
  )

  return (
    <label className="counterparty-field">
      Location
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Court house, office, or venue"
      />
      {open && value && suggestions.length > 0 && (
        <div className="suggestion-list">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(suggestion)
                setOpen(false)
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </label>
  )
}

function RelatedMatters({ matters, counterparty }: { matters: Matter[]; counterparty: string }) {
  if (!counterparty.trim()) return null
  return (
    <div className="related-box">
      <strong>Related matters for {getCanonicalCounterparty(counterparty, matters) || counterparty}</strong>
      {matters.length === 0 ? (
        <p>No existing matters for this counterparty. Saving will create a new group.</p>
      ) : (
        matters.map((matter) => (
          <span key={matter.id}>
            {matter.title} - {matter.status} - {formatShortDate(matter.nextDate)}
          </span>
        ))
      )}
    </div>
  )
}

function DraftDocuments({ drafts, onChange }: { drafts: DraftDocument[]; onChange: (drafts: DraftDocument[]) => void }) {
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const fileDrafts = files.map((file) => ({
      name: file.name,
      type: documentTypeFromName(file.name),
      source: 'Upload' as const,
      size: formatFileSize(file.size),
      url: URL.createObjectURL(file),
      file,
    }))
    onChange([...fileDrafts, ...drafts])
    event.target.value = ''
  }

  function addLink() {
    if (!linkName.trim() || !linkUrl.trim()) return
    onChange([{ name: linkName.trim(), type: 'LINK', source: 'External Link', url: linkUrl.trim() }, ...drafts])
    setLinkName('')
    setLinkUrl('')
  }

  return (
    <div className="draft-docs">
      <strong>Attach documents</strong>
      <div className="doc-controls">
        <label className="ghost-button file-button">
          <Upload size={15} />
          Upload files
          <input type="file" multiple onChange={addFiles} />
        </label>
        <input value={linkName} onChange={(event) => setLinkName(event.target.value)} placeholder="Link name" />
        <input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://..." />
        <button className="ghost-button" type="button" onClick={addLink}>
          <Link2 size={15} />
          Add link
        </button>
      </div>
      {drafts.length > 0 && (
        <div className="draft-list">
          {drafts.map((draft, index) => (
            <span key={`${draft.name}-${index}`}>{draft.name} - {draft.source}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function TaskModal({
  matters,
  tasks,
  onClose,
  onSave,
}: {
  matters: Matter[]
  tasks: Task[]
  onClose: () => void
  onSave: (task: Omit<Task, 'id' | 'createdAt'>) => void
}) {
  const [title, setTitle] = useState('')
  const [matterId, setMatterId] = useState('')
  const [location, setLocation] = useState('')
  const [assignee, setAssignee] = useState('Jane Doe')
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState<Status>('Open')
  const [priority, setPriority] = useState<Task['priority']>('Normal')
  const [notes, setNotes] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      matterId: matterId || undefined,
      location: getCanonicalLocation(location, matters, tasks),
      assignee,
      dueDate,
      status,
      priority,
      notes,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="matter-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-title">
          <h2>Add task</h2>
          <button className="ghost-button" type="button" onClick={onClose}>Close</button>
        </div>
        <div className="form-grid">
          <label className="wide">
            Task title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            Attach to matter optional
            <select value={matterId} onChange={(event) => setMatterId(event.target.value)}>
              <option value="">No matter attached</option>
              {matters.map((matter) => (
                <option key={matter.id} value={matter.id}>{matter.title}</option>
              ))}
            </select>
          </label>
          <label>
            Assignee
            <input value={assignee} onChange={(event) => setAssignee(event.target.value)} />
          </label>
          <LocationAutocomplete value={location} matters={matters} tasks={tasks} onChange={setLocation} />
          <label>
            Due date
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>
          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value as Status)}>
              {['Open', 'Due Soon', 'On Track', 'Overdue', 'Closed'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Priority
            <select value={priority} onChange={(event) => setPriority(event.target.value as Task['priority'])}>
              {['Low', 'Normal', 'High', 'Critical'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="wide">
            Notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
        </div>
        <button className="primary-button" type="submit">
          <Plus size={17} />
          Create task
        </button>
      </form>
    </div>
  )
}

function MatterStatusModal({
  matter,
  onClose,
  onSave,
}: {
  matter: Matter
  onClose: () => void
  onSave: (matter: Matter, update: MatterStatusUpdate) => void
}) {
  const [status, setStatus] = useState<Status>(matter.status === 'Closed' ? 'Closed' : statusFromDate(matter.nextDate))
  const [priority, setPriority] = useState<Matter['priority']>(matter.priority)
  const [nextDate, setNextDate] = useState(matter.nextDate)
  const [nextDateLabel, setNextDateLabel] = useState(matter.nextDateLabel)
  const [updateType, setUpdateType] = useState('Hearing attended')
  const [notes, setNotes] = useState('')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentDescription, setPaymentDescription] = useState('Payment made')
  const [documents, setDocuments] = useState<DraftDocument[]>([])
  const automaticStatus = status === 'Closed' ? 'Closed' : statusFromDate(nextDate)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave(matter, {
      status: automaticStatus,
      priority,
      nextDate,
      nextDateLabel,
      updateType,
      notes,
      paymentAmount,
      paymentDescription,
      documents,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="matter-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-title">
          <div>
            <h2>Update matter status</h2>
            <p>{matter.title}</p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>Close</button>
        </div>
        <div className="form-grid">
          <label>
            Update type
            <select value={updateType} onChange={(event) => setUpdateType(event.target.value)}>
              {['Hearing attended', 'Payment made', 'Arguments made', 'Conclusions made', 'Order passed', 'Filing completed', 'General update'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value as Status)}>
              <option value={automaticStatus}>Auto: {automaticStatus}</option>
              <option value="Closed">Closed</option>
            </select>
            <small>Status auto-syncs to Calendar from the next date.</small>
          </label>
          <label>
            Priority
            <select value={priority} onChange={(event) => setPriority(event.target.value as Matter['priority'])}>
              {['Low', 'Normal', 'High', 'Critical'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Next date
            <input
              type="date"
              value={nextDate}
              onChange={(event) => {
                setNextDate(event.target.value)
                if (status !== 'Closed') setStatus(statusFromDate(event.target.value))
              }}
            />
          </label>
          <label>
            Next date label
            <input value={nextDateLabel} onChange={(event) => setNextDateLabel(event.target.value)} placeholder="Hearing, filing, order, review" />
          </label>
          <label>
            Payment made INR
            <input type="number" min="0" value={paymentAmount} onChange={(event) => setPaymentAmount(Number(event.target.value))} />
          </label>
          <label className="wide">
            Payment description
            <input value={paymentDescription} onChange={(event) => setPaymentDescription(event.target.value)} />
          </label>
          <label className="wide">
            Update notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Arguments made, conclusions, order passed, directions, next steps..." />
          </label>
          <div className="wide">
            <span className="field-label">Attach documents to this update</span>
            <DraftDocuments drafts={documents} onChange={setDocuments} />
          </div>
        </div>
        <button className="primary-button full-width" type="submit">Save Status Update</button>
      </form>
    </div>
  )
}

function DocumentAttachBox({
  matterId,
  onAddDocuments,
}: {
  matterId: string
  onAddDocuments: (matterId: string, drafts: DraftDocument[]) => void
}) {
  const [drafts, setDrafts] = useState<DraftDocument[]>([])
  return (
    <div className="attach-box">
      <DraftDocuments drafts={drafts} onChange={setDrafts} />
      <button
        className="primary-button"
        type="button"
        disabled={!drafts.length}
        onClick={() => {
          onAddDocuments(matterId, drafts)
          setDrafts([])
        }}
      >
        Save attachments
      </button>
    </div>
  )
}

function MatterTable({
  matters,
  selectedMatterId,
  onOpenMatter,
  onCycleStatus,
  onUpdateMatter,
  compact,
}: {
  matters: Matter[]
  selectedMatterId: string
  onOpenMatter: (matterId: string) => void
  onCycleStatus: (matter: Matter) => void
  onUpdateMatter: (matterId: string) => void
  compact?: boolean
}) {
  const columns = useMemo<MovableColumn<Matter, string>[]>(
    () => [
      {
        id: 'title',
        header: 'Matter Title',
        render: (matter) => (
          <td onClick={() => onOpenMatter(matter.id)}>
            <strong>{matter.title}</strong>
            <small>{matter.description}</small>
          </td>
        ),
      },
      {
        id: 'counterparty',
        header: 'Counterparty',
        render: (matter) => (
          <td>
            <strong>{matter.counterparty}</strong>
            <small>{matter.location || 'No location set'}</small>
          </td>
        ),
      },
      { id: 'category', header: 'Category', render: (matter) => <td>{matter.category}</td> },
      { id: 'owner', header: 'Owner', render: (matter) => <td>{matter.owner}</td> },
      {
        id: 'nextDate',
        header: 'Next Date',
        render: (matter) => (
          <td>
            <strong>{formatShortDate(matter.nextDate)}</strong>
            <small>{matter.nextDateLabel}</small>
          </td>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        render: (matter) => (
          <td>
            <button className={`status ${statusClass(matter.status)}`} type="button" onClick={() => onUpdateMatter(matter.id)}>
              {matter.status}
            </button>
          </td>
        ),
      },
      { id: 'monthlyCost', header: 'Monthly Cost', render: (matter) => <td>{currency.format(matter.monthlyCost)}</td> },
      {
        id: 'actions',
        header: 'Actions',
        render: (matter) => (
          <td>
            <div className="table-actions">
              <button className="ghost-button" type="button" onClick={() => onUpdateMatter(matter.id)}>Update Status</button>
              <button className="ghost-button" type="button" onClick={() => onCycleStatus(matter)}>Quick Cycle</button>
            </div>
          </td>
        ),
      },
    ],
    [onCycleStatus, onOpenMatter, onUpdateMatter],
  )
  const { orderedColumns, draggingColumn, setDraggingColumn, moveColumn } = useMovableColumns(columns)

  return (
    <div className="table-wrap">
      <table className={compact ? 'compact-table' : ''}>
        <thead>
          <tr>
            {orderedColumns.map((column) => (
              <MovableHeader
                key={column.id}
                column={column}
                draggingColumn={draggingColumn}
                onDragStart={setDraggingColumn}
                onDragEnd={() => setDraggingColumn(null)}
                onMove={moveColumn}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {matters.map((matter) => (
            <tr key={matter.id} className={matter.id === selectedMatterId ? 'selected' : ''}>
              {orderedColumns.map((column) => (
                <Fragment key={column.id}>{column.render(matter)}</Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UpcomingDatesPanel({ legalDates }: { legalDates: LegalDate[] }) {
  return (
    <aside className="panel dates-panel">
      <div className="panel-title compact">
        <h2>Upcoming Legal Dates</h2>
        <CalendarDays size={18} />
      </div>
      <div className="date-list">
        {[...legalDates]
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 6)
          .map((date) => (
            <article key={date.id} className={`date-item ${statusClass(date.status)}`}>
              <div className="date-box">
                <span>{new Date(date.date).toLocaleString('en-IN', { month: 'short' })}</span>
                <strong>{new Date(date.date).getDate()}</strong>
                <small>{new Date(date.date).toLocaleString('en-IN', { weekday: 'short' })}</small>
              </div>
              <div>
                <strong>{date.title}</strong>
                <p>{date.type}</p>
              </div>
            </article>
          ))}
      </div>
    </aside>
  )
}

function CostPanel({ costs, totalBudget, totalActual }: { costs: CostRow[]; totalBudget: number; totalActual: number }) {
  const outstanding = Math.max(totalBudget - totalActual, 0)
  const paidPercent = totalBudget > 0 ? Math.min((totalActual / totalBudget) * 100, 100) : 0
  return (
    <section className="panel cost-panel">
      <PanelTitle title="Monthly Cost Tracking" subtitle="Noted costs vs payments made for INR legal spend." />
      <div className="budget-summary">
        <span><small>Total Noted</small><strong>{currency.format(totalBudget)}</strong></span>
        <span><small>Paid</small><strong className="positive">{currency.format(totalActual)}</strong></span>
        <span><small>Outstanding</small><strong>{currency.format(outstanding)}</strong></span>
      </div>
      <div className="budget-bar">
        <span style={{ width: `${paidPercent}%` }} />
      </div>
      <div className="cost-list">
        {costs.map((row) => (
          <div className="cost-row" key={row.id}>
            <span className="dot" style={{ background: row.color }} />
            <strong>{row.category}</strong>
            <span>{currency.format(row.actual)} paid of {currency.format(row.budget)}</span>
            <div className="mini-bar">
              <span style={{ width: `${row.budget > 0 ? Math.min((row.actual / row.budget) * 100, 100) : 0}%`, background: row.color }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function DocumentPanel({
  documents,
  selectedMatter,
  onAccess,
}: {
  documents: DocumentRecord[]
  selectedMatter: Matter
  onAccess: (document: DocumentRecord, mode: DocumentAccessMode) => void
}) {
  return (
    <section className="panel document-panel">
      <PanelTitle title="Documents" subtitle={selectedMatter.title} />
      <div className="doc-list">
        {documents.map((document) => <DocumentRow key={document.id} document={document} onAccess={onAccess} />)}
      </div>
    </section>
  )
}

function DocumentRow({
  document,
  matter,
  onAccess,
}: {
  document: DocumentRecord
  matter?: Matter
  onAccess: (document: DocumentRecord, mode: DocumentAccessMode) => void
}) {
  return (
    <article className="doc-row">
      <FileText size={17} />
      <span>
        <strong>{document.name}</strong>
        <small>{document.type} - {document.owner} - {document.date}{matter ? ` - ${matter.title}` : ''}</small>
      </span>
      <span className="doc-actions">
        <button
          className="icon-button"
          type="button"
          title={document.source === 'External Link' ? 'Open link' : 'Preview document'}
          onClick={() => onAccess(document, 'preview')}
        >
          <Link2 size={15} />
        </button>
        {document.source === 'Upload' && (
          <button className="icon-button" type="button" title="Download document" onClick={() => onAccess(document, 'download')}>
            <Download size={15} />
          </button>
        )}
      </span>
    </article>
  )
}

type MovableColumn<Row, Id extends string> = {
  id: Id
  header: string
  render: (row: Row) => ReactNode
}

function useMovableColumns<Row, Id extends string>(columns: MovableColumn<Row, Id>[]) {
  const ids = useMemo(() => columns.map((column) => column.id), [columns])
  const [order, setOrder] = useState<Id[]>(ids)
  const [draggingColumn, setDraggingColumn] = useState<Id | null>(null)

  const orderedColumns = order
    .map((id) => columns.find((column) => column.id === id))
    .filter((column): column is MovableColumn<Row, Id> => Boolean(column))

  function moveColumn(source: Id, target: Id) {
    if (source === target) return
    setOrder((current) => {
      const sourceIndex = current.indexOf(source)
      const targetIndex = current.indexOf(target)
      if (sourceIndex === -1 || targetIndex === -1) return current
      const next = [...current]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  return { orderedColumns, draggingColumn, setDraggingColumn, moveColumn }
}

function MovableHeader<Row, Id extends string>({
  column,
  draggingColumn,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  column: MovableColumn<Row, Id>
  draggingColumn: Id | null
  onDragStart: (id: Id) => void
  onDragEnd: () => void
  onMove: (source: Id, target: Id) => void
}) {
  return (
    <th
      className={`movable-th ${draggingColumn === column.id ? 'dragging' : ''} ${draggingColumn && draggingColumn !== column.id ? 'drop-target' : ''}`}
      draggable
      title="Drag to move this column"
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', column.id)
        onDragStart(column.id)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(event) => {
        event.preventDefault()
        const source = event.dataTransfer.getData('text/plain') as Id
        onMove(source, column.id)
        onDragEnd()
      }}
      onDragEnd={onDragEnd}
    >
      {column.header}
    </th>
  )
}

function DashboardTasksPanel({
  tasks,
  matters,
  onUpdateStatus,
}: {
  tasks: Task[]
  matters: Matter[]
  onUpdateStatus: (task: Task, status: Status) => void
}) {
  const activeTasks = tasks.filter((task) => task.status !== 'Closed').slice(0, 6)
  return (
    <section className="panel task-panel">
      <PanelTitle title="Task Tracker" subtitle="Open tasks with optional matter links." />
      <TaskTable tasks={activeTasks} matters={matters} onUpdateStatus={onUpdateStatus} compact />
    </section>
  )
}

function TaskTable({
  tasks,
  matters,
  onOpenMatter,
  onUpdateStatus,
  compact,
}: {
  tasks: Task[]
  matters: Matter[]
  onOpenMatter?: (matterId: string) => void
  onUpdateStatus: (task: Task, status: Status) => void
  compact?: boolean
}) {
  const matterById = useMemo(() => new Map(matters.map((matter) => [matter.id, matter])), [matters])
  const columns = useMemo<MovableColumn<Task, string>[]>(
    () => [
      {
        id: 'task',
        header: 'Task',
        render: (task) => (
          <td>
            <strong>{task.title}</strong>
            <small>{[task.notes || 'No notes', task.location || 'No location set'].join(' - ')}</small>
          </td>
        ),
      },
      {
        id: 'matter',
        header: 'Matter',
        render: (task) => {
          const matter = matterById.get(task.matterId ?? '')
          return (
            <td>
              {matter ? (
                <button className="link-button" type="button" onClick={() => onOpenMatter?.(matter.id)}>
                  {matter.title}
                </button>
              ) : (
                <span className="muted-text">Standalone</span>
              )}
            </td>
          )
        },
      },
      { id: 'assignee', header: 'Assignee', render: (task) => <td>{task.assignee}</td> },
      { id: 'dueDate', header: 'Due Date', render: (task) => <td>{formatShortDate(task.dueDate)}</td> },
      { id: 'priority', header: 'Priority', render: (task) => <td>{task.priority}</td> },
      {
        id: 'status',
        header: 'Status',
        render: (task) => (
          <td>
            <select className="status-select" value={task.status} onChange={(event) => onUpdateStatus(task, event.target.value as Status)}>
              {['Open', 'Due Soon', 'On Track', 'Overdue', 'Closed'].map((status) => <option key={status}>{status}</option>)}
            </select>
          </td>
        ),
      },
    ],
    [matterById, onOpenMatter, onUpdateStatus],
  )
  const { orderedColumns, draggingColumn, setDraggingColumn, moveColumn } = useMovableColumns(columns)

  return (
    <div className="table-wrap">
      <table className={compact ? 'compact-table task-table' : 'task-table'}>
        <thead>
          <tr>
            {orderedColumns.map((column) => (
              <MovableHeader
                key={column.id}
                column={column}
                draggingColumn={draggingColumn}
                onDragStart={setDraggingColumn}
                onDragEnd={() => setDraggingColumn(null)}
                onMove={moveColumn}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              {orderedColumns.map((column) => (
                <Fragment key={column.id}>{column.render(task)}</Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ActivityPanel({ activity }: { activity: ActivityRow[] }) {
  return (
    <aside className="panel activity-panel">
      <div className="panel-title compact">
        <h2>Recent Activity</h2>
        <Activity size={18} />
      </div>
      <div className="activity-list">
        {activity.slice(0, 6).map((row) => (
          <article key={row.id}>
            <span>{row.initials}</span>
            <div>
              <strong>{row.user}</strong>
              <p>{row.description}</p>
              <small>{row.date}</small>
            </div>
          </article>
        ))}
      </div>
    </aside>
  )
}

function StatusTabs({ filter, onFilter }: { filter: string; onFilter: (filter: string) => void }) {
  return (
    <div className="tabs">
      {['All', 'Open', 'Due Soon', 'Overdue', 'Closed'].map((tab) => (
        <button key={tab} className={filter === tab ? 'active' : ''} type="button" onClick={() => onFilter(tab)}>
          {tab}
        </button>
      ))}
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: ComponentType<{ size?: number }>
  label: string
  value: number | string
  sub: string
  tone: 'blue' | 'amber' | 'red' | 'green'
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}>
        <Icon size={18} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </article>
  )
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="panel-title">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  )
}

function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  allLabel,
  options,
  onChange,
}: {
  label: string
  value: string
  allLabel: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="inline-field">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option>{allLabel}</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function DetailTerm({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const columns = useMemo<MovableColumn<string[], string>[]>(
    () =>
      headers.map((header, index) => ({
        id: `${header}-${index}`,
        header,
        render: (row) => <td>{row[index]}</td>,
      })),
    [headers],
  )
  const { orderedColumns, draggingColumn, setDraggingColumn, moveColumn } = useMovableColumns(columns)

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {orderedColumns.map((column) => (
              <MovableHeader
                key={column.id}
                column={column}
                draggingColumn={draggingColumn}
                onDragStart={setDraggingColumn}
                onDragEnd={() => setDraggingColumn(null)}
                onMove={moveColumn}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.join('-')}-${index}`}>
              {orderedColumns.map((column) => (
                <Fragment key={column.id}>{column.render(row)}</Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AuditRow({ event, onSelect }: { event: AuditEvent; onSelect: () => void }) {
  return (
    <button type="button" className="audit-row" onClick={onSelect}>
      <span className={`audit-icon ${event.entityType}`}>
        {event.entityType === 'document' ? <FileText size={17} /> : <Database size={17} />}
      </span>
      <span>
        <strong>{event.action}</strong>
        <small>{event.entityType} - {event.matterTitle ?? event.entityId}</small>
      </span>
      <span>{event.actor}</span>
      <time>{new Date(event.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</time>
    </button>
  )
}

function buildMatterHistoryItems(
  updates: MatterUpdate[],
  documents: DocumentRecord[],
  auditEvents: AuditEvent[],
): MatterHistoryItem[] {
  const updateItems: MatterHistoryItem[] = updates.map((update) => ({
    id: `update-${update.id}`,
    kind: 'Update',
    title: 'Matter update',
    summary: update.body,
    actor: update.actorEmail,
    createdAt: update.createdAt,
  }))
  const documentItems: MatterHistoryItem[] = documents.map((document) => ({
    id: `document-${document.id}`,
    kind: 'Document',
    title: document.source === 'External Link' ? 'External link attached' : 'Document attached',
    summary: `${document.name} was linked to this matter.`,
    actor: document.owner,
    createdAt: document.createdAt ?? document.date,
    document,
  }))
  const hiddenActions = new Set([
    'MATTER_UPDATE_RECORDED',
    'DOCUMENT_ATTACHED',
    'DOCUMENT_ATTACHED_ON_CREATE',
    'DOCUMENT_ATTACHED_TO_UPDATE',
    'DOCUMENT_UPLOADED',
    'DOCUMENTS_INSERT',
  ])
  const auditItems: MatterHistoryItem[] = auditEvents
    .filter((event) => !hiddenActions.has(event.action.toUpperCase()))
    .map((event) => ({
      id: `audit-${event.id}`,
      kind: historyKindFromAudit(event),
      title: titleFromAudit(event),
      summary: summarizeAuditEvent(event),
      actor: event.actorEmail,
      createdAt: event.createdAt,
    }))

  return [...updateItems, ...documentItems, ...auditItems].sort((a, b) => historyTime(b.createdAt) - historyTime(a.createdAt))
}

function historyKindFromAudit(event: AuditEvent): MatterHistoryItem['kind'] {
  const action = event.action.toUpperCase()
  const entityType = String(event.entityType)
  if (entityType === 'document' || entityType === 'documents') return 'Document'
  if (entityType === 'cost' || entityType === 'cost_entries' || action.includes('PAYMENT')) return 'Payment'
  if (entityType === 'legal_date' || entityType === 'legal_dates' || action.includes('DATE') || action.includes('STATUS')) return 'Date'
  if (entityType === 'matter' || entityType === 'matters') return 'Matter'
  return 'Audit'
}

function titleFromAudit(event: AuditEvent) {
  const action = event.action.toUpperCase()
  if (action.includes('PREVIEW')) return 'Document preview requested'
  if (action.includes('DOWNLOAD')) return 'Document download requested'
  if (action.includes('PAYMENT') || action.includes('COST_ENTRIES_UPDATE')) return 'Payment updated'
  if (action.includes('COST')) return 'Cost updated'
  if (action.includes('STATUS') || action.includes('DATE') || action.includes('LEGAL_DATES')) return 'Date/status updated'
  if (action.includes('COUNTERPARTY')) return 'Counterparty updated'
  if (action.includes('LOCATION')) return 'Location updated'
  if (action.includes('MATTER_CREATED') || action.includes('MATTERS_INSERT')) return 'Matter created'
  if (action.includes('MATTER_UPDATED') || action.includes('MATTERS_UPDATE')) return 'Matter edited'
  return event.action.toLowerCase().replace(/_/g, ' ')
}

function summarizeAuditEvent(event: AuditEvent) {
  const action = event.action.toUpperCase()
  const before = event.before ?? {}
  const after = event.after ?? {}
  const afterStatus = stringValue(after.status)
  const beforeStatus = stringValue(before.status)
  const afterPriority = stringValue(after.priority)
  const nextDate = stringValue(after.nextDate) || stringValue(after.next_date)
  const nextDateLabel = stringValue(after.nextDateLabel) || stringValue(after.next_date_label)
  const paidAmount = numberValue(after.paidAmount) || numberValue(after.paid_inr)
  const paymentAmount = numberValue(after.paymentAmount)
  const paymentStatus = stringValue(after.paymentStatus) || stringValue(after.payment_status)
  const documentName = stringValue(after.documentName) || stringValue(after.name)
  const accessType = stringValue(after.accessType)

  if (action.includes('PAYMENT') || action.includes('COST_ENTRIES_UPDATE')) {
    const amount = paymentAmount || paidAmount
    return `${amount ? `${currency.format(amount)} payment recorded. ` : ''}${paymentStatus ? `Payment status is ${paymentStatus}.` : 'Payment details were updated.'}`
  }
  if (action.includes('PREVIEW') || action.includes('DOWNLOAD')) {
    return `${documentName || 'A document'} access was requested${accessType ? ` (${accessType})` : ''}.`
  }
  if (action.includes('STATUS') || action.includes('DATE') || action.includes('LEGAL_DATES')) {
    const statusText = afterStatus ? `Status ${beforeStatus ? `changed from ${beforeStatus} to ${afterStatus}` : `set to ${afterStatus}`}.` : ''
    const dateText = nextDate ? ` Next ${nextDateLabel || 'date'} is ${formatShortDate(nextDate)}.` : ''
    const priorityText = afterPriority ? ` Priority is ${afterPriority}.` : ''
    return `${statusText}${dateText}${priorityText}`.trim() || 'Matter date/status was updated.'
  }
  if (action.includes('COUNTERPARTY')) {
    return `Counterparty changed from ${stringValue(before.counterparty) || 'not set'} to ${stringValue(after.counterparty) || 'not set'}.`
  }
  if (action.includes('LOCATION')) {
    return `Location changed from ${stringValue(before.location) || 'not set'} to ${stringValue(after.location) || 'not set'}.`
  }
  if (action.includes('MATTER_CREATED') || action.includes('MATTERS_INSERT')) return 'Matter record was opened in the tracker.'
  if (action.includes('MATTER_UPDATED') || action.includes('MATTERS_UPDATE')) return 'Matter details were edited.'
  if (action.includes('COST')) return 'A matter-linked cost entry was changed.'
  return `${event.entityType} activity recorded.`
}

function historyIcon(kind: MatterHistoryItem['kind']) {
  if (kind === 'Document') return <FileText size={17} />
  if (kind === 'Payment') return <IndianRupee size={17} />
  if (kind === 'Date') return <CalendarDays size={17} />
  if (kind === 'Matter') return <FolderOpen size={17} />
  if (kind === 'Audit') return <ShieldCheck size={17} />
  return <Activity size={17} />
}

function historyTime(value: string) {
  if (value === 'Just now') return Date.now()
  const time = Date.parse(value)
  return Number.isNaN(time) ? 0 : time
}

function statusClass(status: Status) {
  return status.toLowerCase().replace(/\s+/g, '-')
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(value: string) {
  if (value === 'Just now') return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function numberValue(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

function initials(name: string) {
  return (
    name
      .split(/[.\s_]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'KL'
  )
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
}

function normalizeCounterparty(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function canonicalCounterparties(matters: Matter[]) {
  const map = new Map<string, string>()
  matters.forEach((matter) => {
    const key = normalizeCounterparty(matter.counterparty)
    if (key && !map.has(key)) map.set(key, matter.counterparty.trim().replace(/\s+/g, ' '))
  })
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b))
}

function getCanonicalCounterparty(value: string, matters: Matter[]) {
  const key = normalizeCounterparty(value)
  const existing = matters.find((matter) => normalizeCounterparty(matter.counterparty) === key)
  return existing?.counterparty.trim().replace(/\s+/g, ' ') ?? value.trim().replace(/\s+/g, ' ')
}

function normalizeLocation(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function canonicalLocations(matters: Matter[], tasks: Task[]) {
  const map = new Map<string, string>()
  matters.forEach((matter) => {
    const key = normalizeLocation(matter.location)
    if (key && !map.has(key)) map.set(key, matter.location.trim().replace(/\s+/g, ' '))
  })
  tasks.forEach((task) => {
    const key = normalizeLocation(task.location)
    if (key && !map.has(key)) map.set(key, task.location.trim().replace(/\s+/g, ' '))
  })
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b))
}

function getCanonicalLocation(value: string, matters: Matter[], tasks: Task[]) {
  const key = normalizeLocation(value)
  if (!key) return ''
  const existingMatter = matters.find((matter) => normalizeLocation(matter.location) === key)
  if (existingMatter) return existingMatter.location.trim().replace(/\s+/g, ' ')
  const existingTask = tasks.find((task) => normalizeLocation(task.location) === key)
  return existingTask?.location.trim().replace(/\s+/g, ' ') ?? value.trim().replace(/\s+/g, ' ')
}

function groupMattersByCounterparty(matters: Matter[]) {
  const groups = new Map<string, Matter[]>()
  matters.forEach((matter) => {
    const key = normalizeCounterparty(matter.counterparty)
    groups.set(key, [...(groups.get(key) ?? []), matter])
  })
  return Array.from(groups.entries())
    .map(([key, groupMatters]) => ({
      key,
      name: groupMatters[0]?.counterparty ?? 'Unknown',
      matters: groupMatters,
      open: groupMatters.filter((matter) => matter.status !== 'Closed').length,
      overdue: groupMatters.filter((matter) => matter.status === 'Overdue').length,
      nextDate: groupMatters.map((matter) => matter.nextDate).sort()[0],
      monthlyCost: groupMatters.reduce((sum, matter) => sum + matter.monthlyCost, 0),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function buildCalendarMonth(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1)
  const start = new Date(year, monthIndex, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return {
      iso: [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-'),
      day: date.getDate(),
      inMonth: date.getMonth() === monthIndex,
    }
  })
}

function parseMonthKey(value: string) {
  const [yearText, monthText] = value.split('-')
  const year = Number(yearText)
  const monthIndex = Number(monthText) - 1
  return monthFromParts(year, monthIndex)
}

function monthFromDate(date: Date) {
  return monthFromParts(date.getFullYear(), date.getMonth())
}

function monthFromParts(year: number, monthIndex: number) {
  const date = new Date(year, monthIndex, 1)
  const normalizedYear = date.getFullYear()
  const normalizedMonthIndex = date.getMonth()
  return {
    year: normalizedYear,
    monthIndex: normalizedMonthIndex,
    key: `${normalizedYear}-${String(normalizedMonthIndex + 1).padStart(2, '0')}`,
  }
}

function shiftMonth(month: { year: number; monthIndex: number }, delta: number) {
  return monthFromParts(month.year, month.monthIndex + delta)
}

function formatMonthKey(year: number, monthIndex: number) {
  return monthFromParts(year, monthIndex).key
}

function formatMonthLabel(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function getPaymentStatus(amount: number, paidAmount: number): CostEntry['paymentStatus'] {
  if (paidAmount >= amount && amount > 0) return 'Paid'
  if (paidAmount > 0) return 'Part Paid'
  return 'Unpaid'
}

function allocatePaymentToMatterCosts(entries: CostEntry[], matterId: string, paymentAmount: number, paidOn: string) {
  let remaining = paymentAmount
  const allocations: CostPaymentAllocation[] = []
  const eligible = entries
    .filter((entry) => entry.matterId === matterId && entry.paymentStatus !== 'Paid' && entry.amount > entry.paidAmount)
    .sort((a, b) => a.month.localeCompare(b.month) || a.id.localeCompare(b.id))
  const nextEntries = entries.map((entry) => {
    if (remaining <= 0) return entry
    if (!eligible.some((eligibleEntry) => eligibleEntry.id === entry.id)) return entry
    const outstanding = Math.max(entry.amount - entry.paidAmount, 0)
    const applied = Math.min(outstanding, remaining)
    remaining -= applied
    const paidAmount = entry.paidAmount + applied
    const paymentStatus = getPaymentStatus(entry.amount, paidAmount)
    allocations.push({ id: entry.id, paidAmount, paidOn, paymentStatus })
    return { ...entry, paidAmount, paidOn, paymentStatus }
  })
  return { entries: nextEntries, allocations, unapplied: remaining }
}

function paymentStatusClass(status: CostEntry['paymentStatus']) {
  return status.toLowerCase().replace(/\s+/g, '-')
}

function statusFromDate(dateValue: string): Status {
  const today = new Date()
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const [year, month, day] = dateValue.split('-').map(Number)
  const dueDate = new Date(year, month - 1, day)
  const daysUntilDue = Math.floor((dueDate.getTime() - todayDate.getTime()) / 86_400_000)
  if (daysUntilDue < 0) return 'Overdue'
  if (daysUntilDue <= 7) return 'Due Soon'
  return 'On Track'
}

function dateFromMatter(matter: Matter): LegalDate {
  return {
    id: `date-${matter.id}`,
    matterId: matter.id,
    title: matter.title,
    date: matter.nextDate,
    type: matter.nextDateLabel,
    status: matter.status,
  }
}

function upsertDate(rows: LegalDate[], matter: Matter) {
  const next = dateFromMatter(matter)
  return rows.some((row) => row.matterId === matter.id)
    ? rows.map((row) => (row.matterId === matter.id ? { ...row, ...next, id: row.id } : row))
    : [next, ...rows]
}

function costEntryFromMatter(matter: Matter): CostEntry {
  return {
    id: `entry-${matter.id}`,
    matterId: matter.id,
    category: matter.category,
    amount: matter.monthlyCost,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    vendor: matter.owner,
    month: matter.nextDate.slice(0, 7),
    description: `${matter.title} monthly estimate`,
  }
}

function upsertCostEntry(rows: CostEntry[], matter: Matter) {
  const next = costEntryFromMatter(matter)
  return rows.some((row) => row.id === next.id)
    ? rows.map((row) => (row.id === next.id ? { ...row, ...next } : row))
    : [next, ...rows]
}

function updateCostRows(rows: CostRow[], category: string, amount: number, paidAmount: number) {
  if (rows.some((row) => row.category === category)) {
    return rows.map((row) => (row.category === category ? { ...row, budget: row.budget + amount, actual: row.actual + paidAmount } : row))
  }
  return [
    ...rows,
    { id: crypto.randomUUID(), category, budget: amount, actual: paidAmount, color: '#0b65c2' },
  ]
}

function rebuildCostRowsFromEntries(existingRows: CostRow[], entries: CostEntry[]) {
  const colors = new Map(existingRows.map((row) => [row.category, row.color]))
  const rows = buildCostRows([], [], entries)
  return rows.map((row) => ({ ...row, color: colors.get(row.category) ?? row.color }))
}

function documentsFromDrafts(drafts: DraftDocument[], matterId: string, owner: string): DocumentRecord[] {
  return drafts.map((draft) => ({
    id: crypto.randomUUID(),
    matterId,
    name: draft.name,
    type: draft.type,
    source: draft.source,
    owner: toTitleCase(owner),
    date: 'Just now',
    createdAt: new Date().toISOString(),
    size: draft.size,
    url: draft.url,
  }))
}

function matterUpdateBody(
  matter: Matter,
  update: MatterStatusUpdate,
  autoStatus: Status,
  paymentAllocations: CostPaymentAllocation[],
) {
  const parts = [
    `${update.updateType}: ${matter.title}`,
    `Status ${autoStatus}`,
    `priority ${update.priority}`,
    `next ${update.nextDateLabel || 'date'} on ${formatShortDate(update.nextDate)}`,
  ]
  if (update.notes.trim()) parts.push(`Notes: ${update.notes.trim()}`)
  if (update.paymentAmount > 0) {
    parts.push(`${currency.format(update.paymentAmount)} payment recorded${paymentAllocations.length ? ` against ${paymentAllocations.length} cost entr${paymentAllocations.length === 1 ? 'y' : 'ies'}` : ''}`)
  }
  if (update.documents.length) {
    parts.push(`Documents attached: ${update.documents.map((document) => document.name).join(', ')}`)
  }
  return parts.join('. ')
}

function openDocumentPreview(document: DocumentRecord) {
  const { url, shouldRevoke } = document.url
    ? { url: document.url, shouldRevoke: false }
    : createDemoDocumentUrl(document)
  window.open(url, '_blank', 'noopener,noreferrer')
  if (shouldRevoke) window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

function downloadDocument(document: DocumentRecord) {
  const { url, shouldRevoke } = document.url
    ? { url: document.url, shouldRevoke: false }
    : createDemoDocumentUrl(document)
  const link = window.document.createElement('a')
  link.href = url
  link.download = document.name
  link.rel = 'noopener noreferrer'
  window.document.body.appendChild(link)
  link.click()
  link.remove()
  if (shouldRevoke) window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

function createDemoDocumentUrl(document: DocumentRecord) {
  const blob = new Blob(
    [
      [
        'Keltech Legal Tracker demo document',
        `Name: ${document.name}`,
        `Matter ID: ${document.matterId}`,
        `Type: ${document.type}`,
        `Owner: ${document.owner}`,
        `Date: ${document.date}`,
        '',
        'This seeded demo record has metadata only. Uploaded files opened in this session use the original browser file object.',
      ].join('\n'),
    ],
    { type: 'text/plain' },
  )
  return { url: URL.createObjectURL(blob), shouldRevoke: true }
}

function downloadUrl(url: string, fileName: string) {
  const link = window.document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener noreferrer'
  window.document.body.appendChild(link)
  link.click()
  link.remove()
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

async function loadCloudData(): Promise<CloudData> {
  const client = requireSupabase()
  const [
    categoryResult,
    matterResult,
    legalDateResult,
    taskResult,
    budgetResult,
    costEntryResult,
    documentResult,
    matterUpdateResult,
    auditResult,
  ] = await Promise.all([
    client.from('matter_categories').select('id,name,color').order('name'),
    client.from('matters').select('*').order('next_date', { ascending: true }),
    client.from('legal_dates').select('*').order('due_on', { ascending: true }),
    client.from('tasks').select('*').order('due_on', { ascending: true }),
    client.from('monthly_budgets').select('*'),
    client.from('cost_entries').select('*').order('cost_month', { ascending: false }),
    client.from('documents').select('*').order('created_at', { ascending: false }),
    client.from('matter_updates').select('*').order('created_at', { ascending: false }),
    client.from('audit_events').select('*').order('created_at', { ascending: false }).limit(200),
  ])

  const results = [categoryResult, matterResult, legalDateResult, taskResult, budgetResult, costEntryResult, documentResult, matterUpdateResult, auditResult]
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error

  const categories = (categoryResult.data ?? []) as CategoryRow[]
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]))
  const matterRows = (matterResult.data ?? []) as MatterRow[]
  const matters = matterRows.map((row) => mapMatterRow(row, categoryMap))
  const matterTitleMap = new Map(matters.map((matter) => [matter.id, matter.title]))
  const activeMatterIds = new Set(matters.map((matter) => matter.id))
  const costRows = ((costEntryResult.data ?? []) as CostEntryRow[]).filter((row) => row.matter_id && activeMatterIds.has(row.matter_id))
  const costEntries = costRows.map((row) => mapCostEntryRow(row, categoryMap))

  return {
    categories,
    matters,
    legalDates: ((legalDateResult.data ?? []) as LegalDateRow[]).map(mapLegalDateRow),
    tasks: ((taskResult.data ?? []) as TaskRow[]).map(mapTaskRow),
    costs: buildCostRows(categories, (budgetResult.data ?? []) as BudgetRow[], costEntries),
    costEntries,
    documents: ((documentResult.data ?? []) as DocumentRowData[]).map(mapDocumentRow),
    matterUpdates: ((matterUpdateResult.data ?? []) as MatterUpdateRow[]).map(mapMatterUpdateRow),
    auditEvents: ((auditResult.data ?? []) as AuditEventRow[]).map((row) => mapAuditEventRow(row, matterTitleMap)),
  }
}

async function loadCurrentProfile(userId: string, email: string): Promise<ProfileRow> {
  const client = requireSupabase()
  const fallbackRole: UserRole = adminFallbackEmails.has(email.toLowerCase()) ? 'admin' : 'user'
  const fallbackName = toTitleCase(email.split('@')[0].replace(/[._]/g, ' '))

  const withRole = await client
    .from('profiles')
    .select('id,email,full_name,role')
    .eq('id', userId)
    .maybeSingle()

  if (!withRole.error) {
    if (withRole.data) return withRole.data as ProfileRow
    const { data, error } = await client
      .from('profiles')
      .insert({ id: userId, email, full_name: fallbackName, role: fallbackRole })
      .select('id,email,full_name,role')
      .single()
    if (!error && data) return data as ProfileRow
  }

  const withoutRole = await client
    .from('profiles')
    .select('id,email,full_name')
    .eq('id', userId)
    .maybeSingle()
  if (!withoutRole.error && withoutRole.data) {
    return { ...(withoutRole.data as Omit<ProfileRow, 'role'>), role: fallbackRole }
  }

  const { data, error } = await client
    .from('profiles')
    .upsert({ id: userId, email, full_name: fallbackName }, { onConflict: 'id' })
    .select('id,email,full_name')
    .single()
  if (error) {
    return { id: userId, email, full_name: fallbackName, role: fallbackRole }
  }
  return { ...(data as Omit<ProfileRow, 'role'>), role: fallbackRole }
}

function mapMatterRow(row: MatterRow, categoryMap: Map<string, string>): Matter {
  return {
    id: row.id,
    title: row.title,
    category: row.category_id ? categoryMap.get(row.category_id) ?? 'General' : 'General',
    owner: row.owner_name,
    counterparty: row.counterparty ?? '',
    location: row.location ?? '',
    nextDate: row.next_date ?? new Date().toISOString().slice(0, 10),
    nextDateLabel: row.next_date_label ?? 'Review',
    status: row.status,
    priority: row.priority,
    monthlyCost: Number(row.monthly_cost_inr ?? 0),
    lastUpdate: new Date(row.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    openedOn: row.opened_on,
    description: row.description ?? '',
  }
}

function mapLegalDateRow(row: LegalDateRow): LegalDate {
  return {
    id: row.id,
    matterId: row.matter_id,
    title: row.title,
    date: row.due_on,
    type: row.date_type,
    status: row.status,
  }
}

function mapTaskRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    matterId: row.matter_id ?? undefined,
    location: row.location ?? '',
    assignee: row.assignee_name ?? 'Unassigned',
    dueDate: row.due_on ?? new Date().toISOString().slice(0, 10),
    status: row.status,
    priority: row.priority,
    notes: row.notes ?? '',
    createdAt: row.created_at.slice(0, 10),
  }
}

function mapCostEntryRow(row: CostEntryRow, categoryMap: Map<string, string>): CostEntry {
  const amount = Number(row.amount_inr)
  const paidAmount = Number(row.paid_inr ?? 0)
  return {
    id: row.id,
    matterId: row.matter_id ?? '',
    category: row.category_id ? categoryMap.get(row.category_id) ?? 'General' : 'General',
    amount,
    paidAmount,
    paidOn: row.paid_on ?? undefined,
    paymentStatus: row.payment_status ?? getPaymentStatus(amount, paidAmount),
    vendor: row.vendor ?? '',
    month: row.cost_month.slice(0, 7),
    description: row.description ?? '',
  }
}

function mapDocumentRow(row: DocumentRowData): DocumentRecord {
  return {
    id: row.id,
    matterId: row.matter_id,
    name: row.name,
    type: row.document_type,
    source: row.source,
    owner: row.uploaded_by_name ?? 'Unknown',
    date: new Date(row.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    createdAt: row.created_at,
    url: row.external_url ?? undefined,
    storagePath: row.storage_path ?? undefined,
  }
}

function mapMatterUpdateRow(row: MatterUpdateRow): MatterUpdate {
  return {
    id: row.id,
    matterId: row.matter_id,
    body: row.body,
    actorEmail: row.created_by_email ?? 'unknown@keltech.in',
    createdAt: row.created_at,
  }
}

function mapAuditEventRow(row: AuditEventRow, matterTitleMap: Map<string, string>): AuditEvent {
  const actorEmail = row.actor_email ?? 'unknown@keltech.in'
  return {
    id: row.id,
    actor: toTitleCase(actorEmail.split('@')[0].replace(/[._]/g, ' ')),
    actorEmail,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id ?? row.id,
    matterId: row.matter_id ?? undefined,
    matterTitle: row.matter_id ? matterTitleMap.get(row.matter_id) : undefined,
    before: row.before_data ?? undefined,
    after: row.after_data ?? undefined,
    ipMetadata: JSON.stringify(row.ip_metadata ?? {}),
    userAgent: row.user_agent ?? 'Unknown',
    createdAt: row.created_at,
  }
}

function buildCostRows(categories: CategoryRow[], budgets: BudgetRow[], costEntries: CostEntry[]): CostRow[] {
  const budgetByCategory = new Map<string, number>()
  budgets.forEach((budget) => {
    const id = budget.category_id ?? 'General'
    budgetByCategory.set(id, (budgetByCategory.get(id) ?? 0) + Number(budget.budget_inr))
  })
  const categoryIdByName = new Map(categories.map((category) => [category.name, category.id]))
  const actualByCategory = new Map<string, number>()
  const paidByCategory = new Map<string, number>()
  costEntries.forEach((entry) => {
    actualByCategory.set(entry.category, (actualByCategory.get(entry.category) ?? 0) + entry.amount)
    paidByCategory.set(entry.category, (paidByCategory.get(entry.category) ?? 0) + entry.paidAmount)
  })
  const names = new Set([...categories.map((category) => category.name), ...costEntries.map((entry) => entry.category)])
  return Array.from(names).map((name) => {
    const categoryId = categoryIdByName.get(name) ?? name
    const actual = actualByCategory.get(name) ?? 0
    return {
      id: categoryId,
      category: name,
      budget: budgetByCategory.get(categoryId) ?? actual,
      actual: paidByCategory.get(name) ?? 0,
      color: categories.find((category) => category.name === name)?.color ?? categoryColor(name),
    }
  }).filter((row) => row.budget > 0 || row.actual > 0)
}

function activityFromAudits(audits: AuditEvent[]): ActivityRow[] {
  return audits.slice(0, 25).map((event) => ({
    id: `activity-${event.id}`,
    user: event.actor,
    initials: initials(event.actor),
    description: `${event.action.toLowerCase().replace(/_/g, ' ')}${event.matterTitle ? ` on ${event.matterTitle}` : ''}`,
    date: new Date(event.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
  }))
}

async function insertCloudMatter(matter: MatterFormValues, categoryId: string) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('matters')
    .insert(toMatterInsert(matter, categoryId))
    .select('*')
    .single()
  if (error) throw error
  return data as MatterRow
}

async function updateCloudMatter(matter: Matter, categoryId: string) {
  const client = requireSupabase()
  const { error } = await client.from('matters').update(toMatterInsert(matter, categoryId)).eq('id', matter.id)
  if (error) throw error
}

function toMatterInsert(matter: MatterFormValues | Matter, categoryId: string) {
  return {
    title: matter.title.trim(),
    category_id: categoryId,
    owner_name: matter.owner.trim(),
    counterparty: matter.counterparty.trim(),
    location: matter.location.trim() || null,
    status: matter.status,
    priority: matter.priority,
    description: matter.description.trim() || null,
    opened_on: matter.openedOn || new Date().toISOString().slice(0, 10),
    next_date: matter.nextDate,
    next_date_label: matter.nextDateLabel,
    monthly_cost_inr: matter.monthlyCost,
  }
}

async function upsertCloudLegalDate(matter: Matter) {
  const client = requireSupabase()
  const next = {
    matter_id: matter.id,
    title: matter.title,
    date_type: matter.nextDateLabel,
    due_on: matter.nextDate,
    status: matter.status,
  }
  const { data: existing, error: selectError } = await client.from('legal_dates').select('id').eq('matter_id', matter.id).limit(1)
  if (selectError) throw selectError
  const existingId = existing?.[0]?.id
  const { error } = existingId
    ? await client.from('legal_dates').update(next).eq('id', existingId)
    : await client.from('legal_dates').insert(next)
  if (error) throw error
}

async function insertCloudCostEntry(entry: Omit<CostEntry, 'id'>, categoryId: string) {
  const client = requireSupabase()
  const { data, error } = await client.from('cost_entries').insert(toCostEntryInsert(entry, categoryId)).select('*').single()
  if (error) throw error
  return data as CostEntryRow
}

async function upsertCloudMatterCostEntry(matter: Matter, categoryId: string) {
  const client = requireSupabase()
  const next = toCostEntryInsert(costEntryFromMatter(matter), categoryId)
  const { data: existing, error: selectError } = await client
    .from('cost_entries')
    .select('id')
    .eq('matter_id', matter.id)
    .order('created_at', { ascending: false })
    .limit(1)
  if (selectError) throw selectError
  const existingId = existing?.[0]?.id
  const { error } = existingId
    ? await client.from('cost_entries').update(next).eq('id', existingId)
    : await client.from('cost_entries').insert(next)
  if (error) throw error
}

function toCostEntryInsert(entry: Omit<CostEntry, 'id'> | CostEntry, categoryId: string) {
  return {
    matter_id: entry.matterId || null,
    category_id: categoryId,
    cost_month: `${entry.month}-01`,
    amount_inr: entry.amount,
    paid_inr: entry.paidAmount,
    paid_on: entry.paidOn || null,
    payment_status: entry.paymentStatus,
    vendor: entry.vendor,
    description: entry.description,
  }
}

async function updateCloudMatterStatus(matter: Matter) {
  const client = requireSupabase()
  const { error } = await client
    .from('matters')
    .update({
      status: matter.status,
      priority: matter.priority,
      next_date: matter.nextDate,
      next_date_label: matter.nextDateLabel,
    })
    .eq('id', matter.id)
  if (error) throw error
}

async function updateCloudCostPayments(allocations: CostPaymentAllocation[]) {
  if (!allocations.length) return
  const client = requireSupabase()
  for (const allocation of allocations) {
    const { error } = await client
      .from('cost_entries')
      .update({
        paid_inr: allocation.paidAmount,
        paid_on: allocation.paidOn,
        payment_status: allocation.paymentStatus,
      })
      .eq('id', allocation.id)
    if (error) throw error
  }
}

function toTaskInsert(task: Task) {
  return {
    matter_id: task.matterId ?? null,
    title: task.title,
    location: task.location || null,
    assignee_name: task.assignee,
    due_on: task.dueDate,
    status: task.status,
    priority: task.priority,
    notes: task.notes || null,
  }
}

async function createSignedDocumentUrl(document: DocumentRecord, mode: DocumentAccessMode) {
  const client = requireSupabase()
  if (!document.storagePath) throw new Error('Document has no Storage path.')
  const { error: auditError } = await client.rpc('record_audit_event', {
    action: mode === 'download' ? 'DOCUMENT_DOWNLOAD_REQUESTED' : 'DOCUMENT_PREVIEW_REQUESTED',
    entity_type: 'document',
    entity_id: document.id,
    matter_id: document.matterId,
    before_data: null,
    after_data: { documentName: document.name, accessType: `${mode}-signed-url-generated` },
  })
  if (auditError) throw auditError
  const { data, error } = await client.storage.from('matter-documents').createSignedUrl(document.storagePath, 300, {
    download: mode === 'download' ? document.name : false,
  })
  if (error) throw error
  return data.signedUrl
}

function categoryColor(name: string) {
  const colors = ['#0b65c2', '#169b62', '#f08c00', '#6f42c1', '#d49b00', '#cf2e2e']
  return colors[Math.abs(hashString(name)) % colors.length]
}

function hashString(value: string) {
  return value.split('').reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0)
}

function sanitizeStorageName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-')
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function emptyMatter(): Matter {
  return {
    id: '',
    title: 'No matters yet',
    category: 'General',
    owner: 'Unassigned',
    counterparty: '',
    location: '',
    nextDate: new Date().toISOString().slice(0, 10),
    nextDateLabel: 'Review',
    status: 'Open',
    priority: 'Normal',
    monthlyCost: 0,
    lastUpdate: 'No updates',
    openedOn: new Date().toISOString().slice(0, 10),
    description: 'Create the first legal matter to begin tracking.',
  }
}

function emptyAuditEvent(user: { name: string; email: string }): AuditEvent {
  return {
    id: 'empty-audit',
    actor: toTitleCase(user.name),
    actorEmail: user.email,
    action: 'NO_AUDIT_EVENTS',
    entityType: 'auth',
    entityId: 'none',
    before: undefined,
    after: undefined,
    ipMetadata: '{}',
    userAgent: navigator.userAgent,
    createdAt: new Date().toISOString(),
  }
}

function documentTypeFromName(name: string): DocumentType {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'PDF'
  if (ext === 'docx' || ext === 'doc') return 'DOCX'
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return 'XLSX'
  return 'OTHER'
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function createAuditSeed(
  actor: string,
  actorEmail: string,
  action: string,
  entityType: EntityType,
  entityId: string,
  matterId?: string,
): AuditEvent {
  const matter = initialMatters.find((row) => row.id === matterId)
  return {
    id: crypto.randomUUID(),
    actor,
    actorEmail,
    action,
    entityType,
    entityId,
    matterId,
    matterTitle: matter?.title,
    before: action.includes('UPDATED') || action.includes('CHANGED') ? { status: 'Open' } : undefined,
    after: { result: 'Recorded for audit review' },
    ipMetadata: '203.0.113.24 via edge function',
    userAgent: 'Keltech Legal Tracker / browser',
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 80_000_000)).toISOString(),
  }
}

function createClientAuditEvent(
  actor: string,
  actorEmail: string,
  action: string,
  entityType: EntityType,
  entityId: string,
  matterId?: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>,
): AuditEvent {
  return {
    id: crypto.randomUUID(),
    actor: toTitleCase(actor),
    actorEmail,
    action,
    entityType,
    entityId,
    matterId,
    before,
    after,
    ipMetadata: 'Captured server-side in Supabase trigger',
    userAgent: navigator.userAgent,
    createdAt: new Date().toISOString(),
  }
}

export default App
