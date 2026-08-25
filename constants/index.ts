import { Company, Internship, Application, Activity, EmailReportPreference } from '../types';

export const COMPANIES: Company[] = [
  { id: '1', name: 'Microsoft', logo: 'MSFT', industry: 'Enterprise Software', activeOpeningsCount: 12, isTracking: true, website: 'https://microsoft.com' },
  { id: '2', name: 'Google', logo: 'GOOG', industry: 'Search & Cloud', activeOpeningsCount: 8, isTracking: true, website: 'https://google.com' },
  { id: '3', name: 'Apple', logo: 'AAPL', industry: 'Consumer Tech', activeOpeningsCount: 5, isTracking: false, website: 'https://apple.com' },
  { id: '4', name: 'Amazon', logo: 'AMZN', industry: 'E-commerce & Cloud', activeOpeningsCount: 15, isTracking: true, website: 'https://amazon.com' },
  { id: '5', name: 'Meta', logo: 'META', industry: 'Social Media', activeOpeningsCount: 7, isTracking: true, website: 'https://meta.com' },
  { id: '6', name: 'NVIDIA', logo: 'NVDA', industry: 'Semiconductors', activeOpeningsCount: 9, isTracking: true, website: 'https://nvidia.com' },
  { id: '7', name: 'OpenAI', logo: 'OPENAI', industry: 'Artificial Intelligence', activeOpeningsCount: 4, isTracking: true, website: 'https://openai.com' },
  { id: '8', name: 'Anthropic', logo: 'ANTH', industry: 'Artificial Intelligence', activeOpeningsCount: 3, isTracking: false, website: 'https://anthropic.com' },
  { id: '9', name: 'Adobe', logo: 'ADBE', industry: 'Creative Software', activeOpeningsCount: 6, isTracking: false, website: 'https://adobe.com' },
  { id: '10', name: 'Stripe', logo: 'STRIPE', industry: 'Fintech', activeOpeningsCount: 5, isTracking: true, website: 'https://stripe.com' },
  { id: '11', name: 'Atlassian', logo: 'TEAM', industry: 'Developer Tools', activeOpeningsCount: 4, isTracking: true, website: 'https://atlassian.com' },
  { id: '12', name: 'Databricks', logo: 'DATABRICKS', industry: 'Data Intelligence', activeOpeningsCount: 6, isTracking: true, website: 'https://databricks.com' },
  { id: '13', name: 'Snowflake', logo: 'SNOW', industry: 'Cloud Data', activeOpeningsCount: 3, isTracking: false, website: 'https://snowflake.com' },
  { id: '14', name: 'Cloudflare', logo: 'NET', industry: 'Security & CDN', activeOpeningsCount: 8, isTracking: true, website: 'https://cloudflare.com' },
  { id: '15', name: 'Netflix', logo: 'NFLX', industry: 'Entertainment', activeOpeningsCount: 2, isTracking: false, website: 'https://netflix.com' },
  { id: '16', name: 'Spotify', logo: 'SPOT', industry: 'Audio Streaming', activeOpeningsCount: 4, isTracking: true, website: 'https://spotify.com' },
];

export const INTERNSHIPS: Internship[] = [
  {
    id: 'int_1',
    companyId: '1',
    companyName: 'Microsoft',
    companyLogo: 'MSFT',
    role: 'Software Engineering Intern (Azure Core)',
    location: 'Redmond, WA (Hybrid)',
    status: 'open',
    deadline: '2026-09-15',
    matchScore: 94,
    tags: ['Next.js', 'Rust', 'Cloud', 'Systems'],
    description: 'Work with the Azure Core systems team building next-generation distributed systems infrastructure. You will write high-performance systems code in Rust and C++.',
    url: 'https://microsoft.com/careers'
  },
  {
    id: 'int_2',
    companyId: '2',
    companyName: 'Google',
    companyLogo: 'GOOG',
    role: 'STEP Intern, Software Engineering',
    location: 'Mountain View, CA (In-Person)',
    status: 'open',
    deadline: '2026-10-01',
    matchScore: 88,
    tags: ['Python', 'C++', 'Algorithms', 'Data Structures'],
    description: 'STEP (Student Training in Engineering Program) is a 12-week internship for first and second-year undergraduate students, focusing on software engineering.',
    url: 'https://google.com/careers'
  },
  {
    id: 'int_3',
    companyId: '10',
    companyName: 'Stripe',
    companyLogo: 'STRIPE',
    role: 'Backend Engineering Intern (Payments)',
    location: 'San Francisco, CA (Hybrid)',
    status: 'open',
    deadline: '2026-08-30',
    matchScore: 97,
    tags: ['Ruby', 'Go', 'APIs', 'Financial Systems'],
    description: 'Help build Stripe\'s core payment routing API. Focus on reliability, transaction consistency, and low-latency API architecture.',
    url: 'https://stripe.com/jobs'
  },
  {
    id: 'int_4',
    companyId: '7',
    companyName: 'OpenAI',
    companyLogo: 'OPENAI',
    role: 'AI Research Intern (Superalignment)',
    location: 'San Francisco, CA (In-Person)',
    status: 'open',
    deadline: '2026-09-01',
    matchScore: 78,
    tags: ['PyTorch', 'Transformers', 'Reinforcement Learning'],
    description: 'Work directly on aligning frontier models. Design experiments to evaluate model capabilities, safety guardrails, and generalization bounds.',
    url: 'https://openai.com/careers'
  },
  {
    id: 'int_5',
    companyId: '6',
    companyName: 'NVIDIA',
    companyLogo: 'NVDA',
    role: 'GPU Compiler Engineering Intern',
    location: 'Santa Clara, CA (Hybrid)',
    status: 'open',
    deadline: '2026-08-25',
    matchScore: 82,
    tags: ['C++', 'CUDA', 'LLVM', 'Compilers'],
    description: 'Contribute to the LLVM-based CUDA compiler toolchain. Optimize kernel generation and memory placement strategies for next-generation Hopper GPUs.',
    url: 'https://nvidia.com/careers'
  },
  {
    id: 'int_6',
    companyId: '5',
    companyName: 'Meta',
    companyLogo: 'META',
    role: 'Production Engineering Intern',
    location: 'Seattle, WA (Hybrid)',
    status: 'open',
    deadline: '2026-09-10',
    matchScore: 91,
    tags: ['Linux', 'Networking', 'Python', 'Kubernetes'],
    description: 'Ensure Meta\'s massive systems scale reliably. Write automation scripts, debug kernel bottlenecks, and manage fleet-wide deployments.',
    url: 'https://meta.com/careers'
  },
  {
    id: 'int_7',
    companyId: '14',
    companyName: 'Cloudflare',
    companyLogo: 'NET',
    role: 'Security Engineering Intern',
    location: 'Austin, TX (Hybrid)',
    status: 'open',
    deadline: '2026-09-20',
    matchScore: 85,
    tags: ['Rust', 'DNS', 'Cryptography', 'Wasm'],
    description: 'Build security layers directly into Cloudflare\'s edge workers. Prototype new cryptographic authentication schemes and verify isolation bounds.',
    url: 'https://cloudflare.com/careers'
  },
  {
    id: 'int_8',
    companyId: '16',
    companyName: 'Spotify',
    companyLogo: 'SPOT',
    role: 'Frontend Engineering Intern (Web Player)',
    location: 'New York, NY (Hybrid)',
    status: 'open',
    deadline: '2026-10-15',
    matchScore: 95,
    tags: ['React', 'TypeScript', 'Web Audio API', 'Accessibility'],
    description: 'Collaborate with the Web Player core team to design and implement highly interactive and accessible audio streaming controls.',
    url: 'https://spotify.com/careers'
  }
];

export const APPLICATIONS: Application[] = [
  {
    id: 'app_1',
    internshipId: 'int_3',
    companyName: 'Stripe',
    companyLogo: 'STRIPE',
    role: 'Backend Engineering Intern (Payments)',
    status: 'interview',
    appliedDate: '2026-07-10',
    lastUpdated: '2026-07-28',
    notes: 'Completed technical phone screen. Waiting for virtual onsite scheduling.',
    nextStep: 'System Design and Coding Panel (3 hours)'
  },
  {
    id: 'app_2',
    internshipId: 'int_1',
    companyName: 'Microsoft',
    companyLogo: 'MSFT',
    role: 'Software Engineering Intern (Azure Core)',
    status: 'applied',
    appliedDate: '2026-07-15',
    lastUpdated: '2026-07-15',
    notes: 'Resume submitted online. Referral attached.',
    nextStep: 'Resume Screening'
  },
  {
    id: 'app_3',
    internshipId: 'int_5',
    companyName: 'NVIDIA',
    companyLogo: 'NVDA',
    role: 'GPU Compiler Engineering Intern',
    status: 'discovered',
    appliedDate: '2026-07-20',
    lastUpdated: '2026-07-20',
    notes: 'Resume needs update focusing on LLVM / compiler projects before applying.',
    nextStep: 'Optimize resume & submit'
  },
  {
    id: 'app_4',
    internshipId: 'int_6',
    companyName: 'Meta',
    companyLogo: 'META',
    role: 'Production Engineering Intern',
    status: 'offer',
    appliedDate: '2026-06-15',
    lastUpdated: '2026-07-25',
    notes: 'Received official offer letter! Base salary $10,500/mo. Relocation provided.',
    nextStep: 'Decide on offer by August 10'
  }
];

export const ACTIVITIES: Activity[] = [
  { id: 'act_1', type: 'interview', message: 'Stripe updated application status to: Interviewing', timestamp: '2 hours ago', internshipId: 'int_3' },
  { id: 'act_2', type: 'match', message: 'New match found: Spotify - Frontend Engineering Intern (95% Match)', timestamp: '5 hours ago', internshipId: 'int_8' },
  { id: 'act_3', type: 'deadline', message: 'NVIDIA application deadline is in 2 days!', timestamp: '1 day ago', internshipId: 'int_5' },
  { id: 'act_4', type: 'applied', message: 'Submitted application to Microsoft (Azure Core)', timestamp: '2 days ago', internshipId: 'int_1' },
  { id: 'act_5', type: 'system', message: 'Daily internship scraping run completed. 14 new openings detected.', timestamp: '3 days ago' }
];

export const EMAIL_PREFERENCES: EmailReportPreference[] = [
  { id: 'pref_1', name: 'Daily Match Digest', frequency: 'daily', isActive: true, categories: ['90%+ Matches', 'Deadlines within 7 days'] },
  { id: 'pref_2', name: 'Weekly Openings Summary', frequency: 'weekly', isActive: true, categories: ['All tracked companies', 'New categories'] },
  { id: 'pref_3', name: 'Immediate Deadline Alerts', frequency: 'instant', isActive: false, categories: ['Tracked positions', 'Saved positions'] }
];

export const FAQS = [
  {
    question: 'How does the AI matching score work?',
    answer: 'Our algorithm parses your uploaded resume and compares your skills, frameworks, course projects, and work experience against the job description requirements of specific tech companies, providing a dynamic matching percentage.'
  },
  {
    question: 'Where do you source the internship openings from?',
    answer: 'We scrape company careers pages directly alongside GitHub community boards, LinkedIn, and Handshake, running every 6 hours. This ensures you see openings within hours of them going live.'
  },
  {
    question: 'Can I track custom applications?',
    answer: 'Yes! Even if we do not track a company, you can add custom entries with details, deadlines, and current interview status directly to your personal applications dashboard.'
  },
  {
    question: 'Is there a limit to how many companies I can track?',
    answer: 'On our free tier, you can track up to 5 companies and receive weekly reports. Our Pro tier (coming soon) supports tracking unlimited companies, instant scraper notifications, and AI resume tailoring suggestions.'
  }
];

export const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'SWE Intern @ Stripe (UC Berkeley)',
    content: 'InternScope gave me a 2-day head start on the Stripe backend role before it hit standard job boards. I got my referral and submitted my application early, which was crucial.',
    avatar: 'SC'
  },
  {
    name: 'David Kojo',
    role: 'STEP Intern @ Google (Georgia Tech)',
    content: 'The resume match score was surprisingly accurate. It highlighted that I lacked C++ keywords on my resume, and once I added my graphics project, my score went up and I got the interview call.',
    avatar: 'DK'
  },
  {
    name: 'Alex Rivera',
    role: 'ML Intern @ OpenAI (MIT)',
    content: 'The email alerts are incredibly helpful. I don\'t have to spend hours searching boards every day. I just get a ping when high-match ML roles go live.',
    avatar: 'AR'
  }
];

export const FEATURES = [
  {
    title: 'AI Internship Tracking',
    description: 'Machine learning tracks changes on careers pages to isolate genuine internships and ignore standard full-time roles.',
    icon: 'Brain'
  },
  {
    title: 'Daily Email Reports',
    description: 'Personalized match digests containing new openings, application status changes, and critical approaching deadlines.',
    icon: 'Mail'
  },
  {
    title: '100+ Top Tech Companies',
    description: 'Deep coverage of MAANG, unicorn startups, and quantitative trading firms with updates fetched every 6 hours.',
    icon: 'Buildings'
  },
  {
    title: 'Resume Match Score',
    description: 'Upload your resume and instantly view keyword matches, suggested revisions, and alignment with target role descriptions.',
    icon: 'Sparkles'
  },
  {
    title: 'Interview Preparation',
    description: 'AI-curated prep material, specific technical questions asked at target companies, and personalized flashcards.',
    icon: 'FileText'
  },
  {
    title: 'Deadline Alerts',
    description: 'Smart calendars and browser/email notifications so you never miss rolling admission deadlines or critical closing windows.',
    icon: 'Bell'
  }
];
