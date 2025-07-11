export interface Post {
  id: string;
  title: string;
  content: string;
  type: PostType;
  category: PostCategory;
  tags: string[];
  status: PostStatus;
  assignee: string;
  media: MediaFile[];
  createdAt: Date;
  scheduledAt?: Date;
  dueDate?: Date;
  comments: Comment[];
  history: HistoryEntry[];
  priority: Priority;
  description?: string;
  metadata: PostMetadata;
}

export type PostType = 
  | 'email'
  | 'sms'
  | 'note'
  | 'task'
  | 'crm_note'
  | 'crm_update'
  | 'website_content'
  | 'blog_post'
  | 'landing_page'
  | 'invoice_message'
  | 'payment_reminder'
  | 'esign_reminder'
  | 'contract_note'
  | 'google_ads'
  | 'meta_ads'
  | 'linkedin_ads'
  | 'twitter_ads'
  | 'social_post'
  | 'announcement'
  | 'newsletter'
  | 'product_update'
  | 'internal_memo'
  | 'meeting_note'
  | 'project_update'
  | 'documentation'
  | 'training_material'
  | 'onboarding_content'
  | 'support_article'
  | 'faq_item'
  | 'policy_document'
  | 'process_guide'
  | 'other';

export type PostCategory = 
  | 'communication'
  | 'marketing'
  | 'sales'
  | 'support'
  | 'internal'
  | 'documentation'
  | 'legal'
  | 'finance'
  | 'operations'
  | 'hr'
  | 'product'
  | 'development'
  | 'design'
  | 'other';

export type PostStatus = 
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'archived'
  | 'cancelled';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface PostMetadata {
  channel?: string;
  targetAudience?: string[];
  campaignId?: string;
  budgetAllocated?: number;
  expectedReach?: number;
  kpis?: string[];
  linkedModules?: string[];
  customFields?: Record<string, any>;
  integrationData?: Record<string, any>;
}

export interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  thumbnail?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  authorAvatar?: string;
  createdAt: Date;
  edited?: boolean;
  editedAt?: Date;
  mentions?: string[];
  reactions?: CommentReaction[];
}

export interface CommentReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface HistoryEntry {
  id: string;
  action: string;
  details: string;
  author: string;
  timestamp: Date;
  oldValue?: any;
  newValue?: any;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'busy';
}

export interface PostFilter {
  type?: PostType[];
  category?: PostCategory[];
  status?: PostStatus[];
  assignee?: string[];
  tags?: string[];
  priority?: Priority[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasMedia?: boolean;
  hasComments?: boolean;
}

export const POST_TYPE_CONFIG: Record<PostType, {
  label: string;
  icon: string;
  color: string;
  category: PostCategory;
  description: string;
  fields?: string[];
}> = {
  // Communication
  email: {
    label: 'Email Campaign',
    icon: '📧',
    color: 'bg-blue-500',
    category: 'communication',
    description: 'Email campaigns and newsletters',
    fields: ['subject', 'preheader', 'sender', 'recipientList']
  },
  sms: {
    label: 'SMS Message',
    icon: '💬',
    color: 'bg-green-500',
    category: 'communication',
    description: 'SMS notifications and alerts',
    fields: ['phoneNumbers', 'characterLimit']
  },
  newsletter: {
    label: 'Newsletter',
    icon: '📰',
    color: 'bg-indigo-500',
    category: 'communication',
    description: 'Regular newsletter content'
  },
  announcement: {
    label: 'Announcement',
    icon: '📢',
    color: 'bg-yellow-500',
    category: 'communication',
    description: 'Company-wide announcements'
  },

  // Marketing & Advertising
  google_ads: {
    label: 'Google Ads',
    icon: '🎯',
    color: 'bg-red-500',
    category: 'marketing',
    description: 'Google advertising campaigns',
    fields: ['headline', 'description', 'keywords', 'budget', 'targetAudience']
  },
  meta_ads: {
    label: 'Meta Ads',
    icon: '📱',
    color: 'bg-blue-600',
    category: 'marketing',
    description: 'Facebook and Instagram advertising',
    fields: ['headline', 'primaryText', 'callToAction', 'budget', 'audience']
  },
  linkedin_ads: {
    label: 'LinkedIn Ads',
    icon: '💼',
    color: 'bg-blue-700',
    category: 'marketing',
    description: 'LinkedIn professional advertising'
  },
  twitter_ads: {
    label: 'Twitter Ads',
    icon: '🐦',
    color: 'bg-sky-500',
    category: 'marketing',
    description: 'Twitter advertising campaigns'
  },
  social_post: {
    label: 'Social Media Post',
    icon: '📲',
    color: 'bg-purple-500',
    category: 'marketing',
    description: 'General social media content'
  },

  // Sales & CRM
  crm_note: {
    label: 'CRM Note',
    icon: '👤',
    color: 'bg-orange-500',
    category: 'sales',
    description: 'Customer relationship notes',
    fields: ['contactId', 'dealId', 'followUpDate']
  },
  crm_update: {
    label: 'CRM Update',
    icon: '🔄',
    color: 'bg-orange-600',
    category: 'sales',
    description: 'CRM system updates and changes'
  },

  // Finance & Legal
  invoice_message: {
    label: 'Invoice Message',
    icon: '💰',
    color: 'bg-emerald-500',
    category: 'finance',
    description: 'Invoice-related communications',
    fields: ['invoiceNumber', 'amount', 'dueDate', 'paymentTerms']
  },
  payment_reminder: {
    label: 'Payment Reminder',
    icon: '💳',
    color: 'bg-red-600',
    category: 'finance',
    description: 'Payment reminder notifications'
  },
  esign_reminder: {
    label: 'E-signature Reminder',
    icon: '✍️',
    color: 'bg-purple-600',
    category: 'legal',
    description: 'Electronic signature reminders',
    fields: ['documentName', 'signerEmail', 'deadline']
  },
  contract_note: {
    label: 'Contract Note',
    icon: '📋',
    color: 'bg-gray-600',
    category: 'legal',
    description: 'Contract-related notes and updates'
  },

  // Content & Documentation
  website_content: {
    label: 'Website Content',
    icon: '🌐',
    color: 'bg-cyan-500',
    category: 'marketing',
    description: 'Website pages and content',
    fields: ['pageUrl', 'metaTitle', 'metaDescription', 'keywords']
  },
  blog_post: {
    label: 'Blog Post',
    icon: '📝',
    color: 'bg-teal-500',
    category: 'marketing',
    description: 'Blog articles and posts'
  },
  landing_page: {
    label: 'Landing Page',
    icon: '🎯',
    color: 'bg-pink-500',
    category: 'marketing',
    description: 'Marketing landing pages'
  },
  documentation: {
    label: 'Documentation',
    icon: '📚',
    color: 'bg-slate-500',
    category: 'documentation',
    description: 'Technical and process documentation'
  },
  support_article: {
    label: 'Support Article',
    icon: '🆘',
    color: 'bg-amber-500',
    category: 'support',
    description: 'Customer support articles'
  },
  faq_item: {
    label: 'FAQ Item',
    icon: '❓',
    color: 'bg-lime-500',
    category: 'support',
    description: 'Frequently asked questions'
  },

  // Internal Operations
  task: {
    label: 'Task',
    icon: '✅',
    color: 'bg-green-600',
    category: 'operations',
    description: 'Task management and assignments',
    fields: ['assignee', 'dueDate', 'priority', 'project']
  },
  note: {
    label: 'Note',
    icon: '📄',
    color: 'bg-yellow-400',
    category: 'internal',
    description: 'General notes and memos'
  },
  internal_memo: {
    label: 'Internal Memo',
    icon: '🏢',
    color: 'bg-gray-500',
    category: 'internal',
    description: 'Internal company communications'
  },
  meeting_note: {
    label: 'Meeting Note',
    icon: '🤝',
    color: 'bg-violet-500',
    category: 'internal',
    description: 'Meeting minutes and notes'
  },
  project_update: {
    label: 'Project Update',
    icon: '📊',
    color: 'bg-blue-500',
    category: 'operations',
    description: 'Project status updates'
  },
  product_update: {
    label: 'Product Update',
    icon: '🚀',
    color: 'bg-rose-500',
    category: 'product',
    description: 'Product feature updates and releases'
  },

  // HR & Training
  training_material: {
    label: 'Training Material',
    icon: '🎓',
    color: 'bg-emerald-600',
    category: 'hr',
    description: 'Employee training content'
  },
  onboarding_content: {
    label: 'Onboarding Content',
    icon: '👋',
    color: 'bg-cyan-600',
    category: 'hr',
    description: 'New employee onboarding materials'
  },
  policy_document: {
    label: 'Policy Document',
    icon: '📜',
    color: 'bg-stone-500',
    category: 'hr',
    description: 'Company policies and procedures'
  },
  process_guide: {
    label: 'Process Guide',
    icon: '🗺️',
    color: 'bg-teal-600',
    category: 'operations',
    description: 'Step-by-step process guides'
  },

  // Flexible
  other: {
    label: 'Other',
    icon: '🔗',
    color: 'bg-neutral-500',
    category: 'other',
    description: 'Custom post type'
  }
};

export const STATUS_CONFIG: Record<PostStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100 border-gray-300',
    icon: '📝'
  },
  in_review: {
    label: 'In Review',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100 border-yellow-300',
    icon: '👀'
  },
  approved: {
    label: 'Approved',
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-300',
    icon: '✅'
  },
  scheduled: {
    label: 'Scheduled',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 border-blue-300',
    icon: '⏰'
  },
  published: {
    label: 'Published',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100 border-emerald-300',
    icon: '🚀'
  },
  archived: {
    label: 'Archived',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    icon: '📦'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-300',
    icon: '❌'
  }
};

export const PRIORITY_CONFIG: Record<Priority, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  low: {
    label: 'Low',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '🟢'
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: '🟡'
  },
  high: {
    label: 'High',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: '🟠'
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: '🔴'
  }
};

export const CATEGORY_CONFIG: Record<PostCategory, {
  label: string;
  color: string;
  icon: string;
  description: string;
}> = {
  communication: {
    label: 'Communication',
    color: 'bg-blue-500',
    icon: '💬',
    description: 'Email, SMS, and messaging'
  },
  marketing: {
    label: 'Marketing',
    color: 'bg-purple-500',
    icon: '📈',
    description: 'Campaigns, ads, and content'
  },
  sales: {
    label: 'Sales',
    color: 'bg-green-500',
    icon: '💼',
    description: 'CRM, leads, and deals'
  },
  support: {
    label: 'Support',
    color: 'bg-orange-500',
    icon: '🛟',
    description: 'Customer support content'
  },
  internal: {
    label: 'Internal',
    color: 'bg-gray-500',
    icon: '🏢',
    description: 'Internal communications'
  },
  documentation: {
    label: 'Documentation',
    color: 'bg-indigo-500',
    icon: '📚',
    description: 'Guides and documentation'
  },
  legal: {
    label: 'Legal',
    color: 'bg-red-500',
    icon: '⚖️',
    description: 'Contracts and legal docs'
  },
  finance: {
    label: 'Finance',
    color: 'bg-emerald-500',
    icon: '💰',
    description: 'Invoices and payments'
  },
  operations: {
    label: 'Operations',
    color: 'bg-cyan-500',
    icon: '⚙️',
    description: 'Processes and operations'
  },
  hr: {
    label: 'Human Resources',
    color: 'bg-pink-500',
    icon: '👥',
    description: 'HR and employee content'
  },
  product: {
    label: 'Product',
    color: 'bg-violet-500',
    icon: '🚀',
    description: 'Product updates and features'
  },
  development: {
    label: 'Development',
    color: 'bg-slate-500',
    icon: '💻',
    description: 'Technical development'
  },
  design: {
    label: 'Design',
    color: 'bg-rose-500',
    icon: '🎨',
    description: 'Design and creative content'
  },
  other: {
    label: 'Other',
    color: 'bg-neutral-500',
    icon: '📋',
    description: 'Miscellaneous content'
  }
};