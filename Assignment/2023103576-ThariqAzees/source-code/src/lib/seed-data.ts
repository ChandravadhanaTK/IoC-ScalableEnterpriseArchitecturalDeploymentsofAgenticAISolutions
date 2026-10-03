import { User, Profile, Project, Post, Application, Notification } from './types';

export const INITIAL_SKILLS = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Tailwind CSS', 'GraphQL',
  'PostgreSQL', 'MongoDB', 'Docker', 'AWS', 'PyTorch', 'TensorFlow', 'UI/UX Design',
  'Figma', 'Copywriting', 'SEO', 'Data Science', 'Cybersecurity', 'Solidity', 'WebRTC'
];

export const INITIAL_USERS: User[] = [
  // Admin
  {
    id: 'user-admin-1',
    email: 'admin@skillbridge.ai',
    username: 'skillbridge_admin',
    name: 'Sarah Connor',
    role: 'ADMIN',
    suspended: false,
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  // Clients
  {
    id: 'user-client-1',
    email: 'alex@techventures.io',
    username: 'alex_techventures',
    name: 'Alex Rivera',
    role: 'CLIENT',
    suspended: false,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'user-client-2',
    email: 'elena@growthpulse.com',
    username: 'elena_growth',
    name: 'Elena Rostova',
    role: 'CLIENT',
    suspended: false,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'user-client-3',
    email: 'david@cyberguard.sec',
    username: 'david_cyberguard',
    name: 'David Chen',
    role: 'CLIENT',
    suspended: false,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'user-client-4',
    email: 'marcus@synthai.tech',
    username: 'marcus_synth',
    name: 'Marcus Vance',
    role: 'CLIENT',
    suspended: false,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  // Freelancers
  {
    id: 'user-free-1',
    email: 'priya@dev.io',
    username: 'priya_fullstack',
    name: 'Priya Sharma',
    role: 'FREELANCER',
    suspended: false,
    createdAt: new Date(Date.now() - 80 * 86400000).toISOString(),
  },
  {
    id: 'user-free-2',
    email: 'devon@aiml.ai',
    username: 'devon_aiml',
    name: 'Devon Vance',
    role: 'FREELANCER',
    suspended: false,
    createdAt: new Date(Date.now() - 75 * 86400000).toISOString(),
  },
  {
    id: 'user-free-3',
    email: 'sophia@design.co',
    username: 'sophia_ux',
    name: 'Sophia Martinez',
    role: 'FREELANCER',
    suspended: false,
    createdAt: new Date(Date.now() - 70 * 86400000).toISOString(),
  },
  {
    id: 'user-free-4',
    email: 'liam@sec.net',
    username: 'liam_sec',
    name: 'Liam O\'Connor',
    role: 'FREELANCER',
    suspended: false,
    createdAt: new Date(Date.now() - 65 * 86400000).toISOString(),
  },
  {
    id: 'user-free-5',
    email: 'aisha@data.org',
    username: 'aisha_data',
    name: 'Aisha Patel',
    role: 'FREELANCER',
    suspended: false,
    createdAt: new Date(Date.now() - 55 * 86400000).toISOString(),
  },
  {
    id: 'user-free-6',
    email: 'lucas@frontend.dev',
    username: 'lucas_react',
    name: 'Lucas Silva',
    role: 'FREELANCER',
    suspended: false,
    createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
  },
  {
    id: 'user-free-7',
    email: 'hannah@content.pro',
    username: 'hannah_writer',
    name: 'Hannah Abbott',
    role: 'FREELANCER',
    suspended: false,
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: 'user-free-8',
    email: 'kenji@cloud.io',
    username: 'kenji_devops',
    name: 'Kenji Takahashi',
    role: 'FREELANCER',
    suspended: false,
    createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
  },
  {
    id: 'user-free-9',
    email: 'chloe@growth.agency',
    username: 'chloe_mktg',
    name: 'Chloe Dubois',
    role: 'FREELANCER',
    suspended: false,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'user-free-10',
    email: 'omar@mobile.app',
    username: 'omar_flutter',
    name: 'Omar Hassan',
    role: 'FREELANCER',
    suspended: false,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'user-free-11',
    email: 'zoe@blockchain.eth',
    username: 'zoe_web3',
    name: 'Zoe Sterling',
    role: 'FREELANCER',
    suspended: false,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'user-free-12',
    email: 'spammer@fake.com',
    username: 'spammer_user',
    name: 'Suspended Bot Account',
    role: 'FREELANCER',
    suspended: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  }
];

export const INITIAL_PROFILES: Record<string, Profile> = {
  'user-free-1': {
    id: 'prof-free-1',
    userId: 'user-free-1',
    headline: 'Senior Full Stack Engineer | React, Next.js & Node.js Specialist',
    bio: '7+ years building high-concurrency web apps, SaaS tools, and cloud platforms. Passionate about clean architecture, performance optimization, and intuitive UI.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    experienceLevel: 'EXPERT',
    hourlyRate: 85,
    availability: 'Full-time',
    links: { github: 'https://github.com/priyasharma', linkedin: 'https://linkedin.com/in/priyasharma', website: 'https://priyasharma.dev' },
    skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
    updatedAt: new Date().toISOString(),
    portfolio: [
      {
        id: 'port-1',
        profileId: 'prof-free-1',
        title: 'Nexus Analytics Dashboard',
        description: 'Real-time multi-tenant analytics platform processing 10M+ events daily built with Next.js App Router and PostgreSQL.',
        technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL'],
        url: 'https://nexus-analytics-demo.com',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'port-2',
        profileId: 'prof-free-1',
        title: 'CloudSync SaaS Platform',
        description: 'Automated workflow engine for enterprise cloud storage synchronization.',
        technologies: ['React', 'Node.js', 'Docker', 'AWS'],
        url: 'https://cloudsync-app.io',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80'
      }
    ]
  },
  'user-free-2': {
    id: 'prof-free-2',
    userId: 'user-free-2',
    headline: 'AI/ML Solutions Architect | LLM Fine-tuning & RAG Pipelines',
    bio: 'Specialized in building end-to-end Machine Learning systems, vector databases, custom RAG search, and fine-tuning OpenAI/Open-source models for enterprise domain tasks.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    experienceLevel: 'EXPERT',
    hourlyRate: 110,
    availability: 'Part-time',
    links: { github: 'https://github.com/devonvance', linkedin: 'https://linkedin.com/in/devonvance' },
    skills: ['Python', 'PyTorch', 'TensorFlow', 'AWS', 'Docker', 'PostgreSQL'],
    updatedAt: new Date().toISOString(),
    portfolio: [
      {
        id: 'port-3',
        profileId: 'prof-free-2',
        title: 'LegalDoc AI Copilot',
        description: 'Custom RAG system indexing 50,000+ legal PDFs with hybrid search and sub-second query retrieval.',
        technologies: ['Python', 'PyTorch', 'MongoDB', 'AWS'],
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80'
      }
    ]
  },
  'user-free-3': {
    id: 'prof-free-3',
    userId: 'user-free-3',
    headline: 'Lead Product Designer & UI/UX Design System Specialist',
    bio: 'Crafting delight-infused user journeys, comprehensive Figma design systems, and modern micro-animations for high-growth tech startups.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    experienceLevel: 'EXPERT',
    hourlyRate: 75,
    availability: 'Full-time',
    links: { website: 'https://sophiamartinez.design', linkedin: 'https://linkedin.com/in/sophiamartinez' },
    skills: ['UI/UX Design', 'Figma', 'Tailwind CSS', 'React'],
    updatedAt: new Date().toISOString(),
    portfolio: [
      {
        id: 'port-4',
        profileId: 'prof-free-3',
        title: 'Fintech Mobile Banking System',
        description: 'Complete UI redesign increasing app conversion by 34% across 200k active users.',
        technologies: ['Figma', 'UI/UX Design'],
        imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80'
      }
    ]
  },
  'user-free-4': {
    id: 'prof-free-4',
    userId: 'user-free-4',
    headline: 'Cybersecurity Analyst & Penetration Tester',
    bio: 'OSCP certified security professional. Penetration testing, vulnerability assessments, security audits, and SOC compliance for Web & API infrastructures.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    experienceLevel: 'INTERMEDIATE',
    hourlyRate: 90,
    availability: 'Contract',
    links: { github: 'https://github.com/liamsec' },
    skills: ['Cybersecurity', 'Python', 'Docker', 'AWS'],
    updatedAt: new Date().toISOString(),
    portfolio: []
  },
  'user-free-5': {
    id: 'prof-free-5',
    userId: 'user-free-5',
    headline: 'Data Scientist & Predictive Analytics Engineer',
    bio: 'Transforming complex data streams into actionable business intelligence. Expertise in Pandas, Scikit-learn, SQL, and interactive dashboards.',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    experienceLevel: 'INTERMEDIATE',
    hourlyRate: 70,
    availability: 'Part-time',
    links: { github: 'https://github.com/aishadata' },
    skills: ['Data Science', 'Python', 'PostgreSQL', 'AWS'],
    updatedAt: new Date().toISOString(),
    portfolio: []
  },
  'user-free-6': {
    id: 'prof-free-6',
    userId: 'user-free-6',
    headline: 'Frontend Developer | React, Next.js & Web Animations',
    bio: 'Obsessed with pixel perfection, fast load speeds, accessible HTML, and smooth 60fps web transitions.',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    experienceLevel: 'INTERMEDIATE',
    hourlyRate: 60,
    availability: 'Full-time',
    links: { github: 'https://github.com/lucassilva' },
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    updatedAt: new Date().toISOString(),
    portfolio: []
  }
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    clientId: 'user-client-1',
    title: 'Full-Stack Next.js 14 SaaS Dashboard with Real-Time Analytics',
    description: 'We need an experienced Next.js engineer to build our core customer dashboard. Must integrate Server Actions, Supabase Auth, Tailwind CSS, and Recharts. Needs crisp dark mode styling and top performance.',
    budgetMin: 3000,
    budgetMax: 5000,
    deadline: new Date(Date.now() + 21 * 86400000).toISOString(),
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    skills: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'PostgreSQL'],
    applicationsCount: 4
  },
  {
    id: 'proj-2',
    clientId: 'user-client-4',
    title: 'Custom RAG Knowledge Base & Fine-Tuned LLM Pipeline',
    description: 'Looking for an AI/ML specialist to construct a custom retrieval augmented generation pipeline using PyTorch, OpenAI embeddings, vector search, and a Python FastAPI backend.',
    budgetMin: 4500,
    budgetMax: 8000,
    deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    skills: ['Python', 'PyTorch', 'AWS', 'Docker', 'PostgreSQL'],
    applicationsCount: 2
  },
  {
    id: 'proj-3',
    clientId: 'user-client-2',
    title: 'B2B Fintech Web App UI/UX Redesign in Figma',
    description: 'Seeking a top UI/UX designer to craft modern desktop and mobile views for our web app. Includes modular design token system, wireframes, and interactive click-through prototypes.',
    budgetMin: 2000,
    budgetMax: 3500,
    deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    skills: ['UI/UX Design', 'Figma', 'Tailwind CSS'],
    applicationsCount: 5
  },
  {
    id: 'proj-4',
    clientId: 'user-client-3',
    title: 'Web Application Vulnerability Assessment & Penetration Test',
    description: 'Comprehensive security audit needed for a cloud-hosted HIPAA compliant health application. Must provide full vulnerability report and patch advisory.',
    budgetMin: 1500,
    budgetMax: 2500,
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    skills: ['Cybersecurity', 'Docker', 'AWS'],
    applicationsCount: 1
  },
  {
    id: 'proj-5',
    clientId: 'user-client-1',
    title: 'High-Converting Copywriting & Landing Page Redesign',
    description: 'Need compelling technical copy and marketing messaging for our AI enterprise software launch.',
    budgetMin: 1000,
    budgetMax: 2000,
    deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    skills: ['Copywriting', 'SEO'],
    applicationsCount: 3
  }
];

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    projectId: 'proj-1',
    freelancerId: 'user-free-1',
    proposal: 'Hello Alex! I have extensive experience building scalable Next.js 14 enterprise applications with App Router and Supabase. I can deliver your real-time analytics dashboard with clean code, sub-100ms load times, and a polished glassmorphism dark theme UI.',
    proposedPrice: 4200,
    expectedDays: 18,
    status: 'SHORTLISTED',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'app-2',
    projectId: 'proj-2',
    freelancerId: 'user-free-2',
    proposal: 'Hi Marcus! Building RAG models and vector databases is my core focus. I recently engineered a 50k document legal RAG system with PyTorch and OpenAI embeddings. I would love to build your custom AI pipeline with full unit tests and docker containerization.',
    proposedPrice: 6500,
    expectedDays: 25,
    status: 'SUBMITTED',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'app-3',
    projectId: 'proj-3',
    freelancerId: 'user-free-3',
    proposal: 'Hi Elena, I specialize in fintech UI/UX design systems. I can create a high-fidelity Figma design system tailored for fast dev handoff with auto-layout variables.',
    proposedPrice: 3000,
    expectedDays: 12,
    status: 'ACCEPTED',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    authorId: 'user-free-1',
    type: 'ADVICE',
    category: 'Web Development',
    body: '💡 Tip for Next.js 14 App Router: Always prefer Server Components for data fetching and keep Client Components at the leaf nodes. This drastically reduces JavaScript bundle size sent to the client!',
    status: 'PUBLISHED',
    createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    commentsCount: 3,
    likesCount: 14,
    moderation: { verdict: 'SAFE', reason: 'Content passes safety guidelines.' }
  },
  {
    id: 'post-2',
    authorId: 'user-free-2',
    type: 'SHOWCASE',
    category: 'AI & ML',
    body: '🚀 Just launched my open-source RAG benchmark tool! It tests recall rate vs chunk size for OpenAI vs local embeddings. Check out the repository and let me know your thoughts!',
    status: 'PUBLISHED',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    commentsCount: 5,
    likesCount: 22,
    moderation: { verdict: 'SAFE', reason: 'Clean tech showcase.' }
  },
  {
    id: 'post-3',
    authorId: 'user-free-3',
    type: 'QUESTION',
    category: 'UI/UX',
    body: 'How do fellow designers handle client feedback loops when prototyping complex micro-interactions in Figma? Do you record video walkthroughs or conduct live sync sessions?',
    status: 'PUBLISHED',
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    commentsCount: 7,
    likesCount: 9,
    moderation: { verdict: 'SAFE' }
  },
  {
    id: 'post-4',
    authorId: 'user-free-12',
    type: 'DISCUSSION',
    category: 'Freelancing Advice',
    body: 'Buy cheap followers and spam 500 proposals a day to get quick money fast click http://scam-link.biz',
    status: 'PENDING_REVIEW',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    commentsCount: 0,
    likesCount: 0,
    moderation: { verdict: 'REVIEW', reason: 'Potential spam and suspicious links detected.' }
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-free-1',
    type: 'application_status',
    message: 'Your application for "Full-Stack Next.js 14 SaaS Dashboard" was shortlisted by Alex Rivera!',
    link: '/applications',
    read: false,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: 'notif-2',
    userId: 'user-free-1',
    type: 'recommendation',
    message: 'New 94% match project found: "Full-Stack Next.js 14 SaaS Dashboard"',
    link: '/projects/proj-1',
    read: true,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString()
  }
];
