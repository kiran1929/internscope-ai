import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  Role,
  OpportunityType,
  RemoteType,
  ApplicationStatus,
  NotificationType,
  Company,
  Opportunity,
  Prisma,
} from '../lib/generated/prisma/client';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Start seeding database...');

  // 1. Clean existing records in dependency order
  console.log('🧹 Cleaning old data...');
  await prisma.emailPreference.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.savedOpportunity.deleteMany({});
  await prisma.opportunity.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Seed 10 Companies
  console.log('🏢 Seeding companies...');
  const companiesData = [
    {
      name: 'Google',
      logoUrl: 'https://logo.clearbit.com/google.com',
      websiteUrl: 'https://careers.google.com',
      industry: 'Technology',
      description: 'Search engine, cloud computing, software, hardware, and AI leader.',
    },
    {
      name: 'Microsoft',
      logoUrl: 'https://logo.clearbit.com/microsoft.com',
      websiteUrl: 'https://careers.microsoft.com',
      industry: 'Technology',
      description: 'Global developer of software, cloud infrastructure, and consumer electronics.',
    },
    {
      name: 'Meta',
      logoUrl: 'https://logo.clearbit.com/meta.com',
      websiteUrl: 'https://metacareers.com',
      industry: 'Technology & Social Media',
      description: 'Connecting people through social media platforms, VR, and metaverse tech.',
    },
    {
      name: 'Apple',
      logoUrl: 'https://logo.clearbit.com/apple.com',
      websiteUrl: 'https://www.apple.com/careers',
      industry: 'Technology',
      description: 'Designer and developer of premium consumer electronics, operating systems, and services.',
    },
    {
      name: 'Amazon',
      logoUrl: 'https://logo.clearbit.com/amazon.com',
      websiteUrl: 'https://www.amazon.jobs',
      industry: 'Technology & E-commerce',
      description: 'E-commerce giant, cloud services provider (AWS), and hardware manufacturer.',
    },
    {
      name: 'Stripe',
      logoUrl: 'https://logo.clearbit.com/stripe.com',
      websiteUrl: 'https://stripe.com/jobs',
      industry: 'Financial Technology',
      description: 'Financial infrastructure and online payments API platform developer.',
    },
    {
      name: 'Vercel',
      logoUrl: 'https://logo.clearbit.com/vercel.com',
      websiteUrl: 'https://vercel.com/careers',
      industry: 'Technology & Cloud',
      description: 'The frontend cloud platform, empowering developers to deploy globally.',
    },
    {
      name: 'Supabase',
      logoUrl: 'https://logo.clearbit.com/supabase.com',
      websiteUrl: 'https://supabase.com/careers',
      industry: 'Technology & Open Source',
      description: 'The open source Firebase alternative, providing instant PostgreSQL backends.',
    },
    {
      name: 'Linear',
      logoUrl: 'https://logo.clearbit.com/linear.app',
      websiteUrl: 'https://linear.app/careers',
      industry: 'Software & SaaS',
      description: 'Issue tracker and project management platform built for modern product teams.',
    },
    {
      name: 'Netflix',
      logoUrl: 'https://logo.clearbit.com/netflix.com',
      websiteUrl: 'https://jobs.netflix.com',
      industry: 'Entertainment & Technology',
      description: 'Global streaming entertainment service offering movies, TV shows, and games.',
    },
  ];

  const companies: Record<string, Company> = {};
  for (const comp of companiesData) {
    const createdComp = await prisma.company.create({ data: comp });
    companies[comp.name] = createdComp;
  }
  console.log(`✓ Seeded ${Object.keys(companies).length} companies.`);

  // 3. Seed 30 Opportunities
  console.log('💼 Seeding opportunities...');
  const opportunitiesData = [
    // Google (5)
    {
      title: 'STEP Internship 2027',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Google',
      location: 'Mountain View, CA',
      remoteType: RemoteType.ONSITE,
      salaryRange: '$40 - $55 / hour',
      benefits: 'Relocation housing, travel stipend, free meals',
      applicationUrl: 'https://buildyourfuture.withgoogle.com/step',
      deadline: new Date('2026-10-31'),
      description: 'Development program for first- and second-year undergraduate students major in CS.',
      requirements: 'Currently enrolled in an Associate or Bachelor CS degree program; graduation between 2028 and 2029.',
    },
    {
      title: 'Software Engineering Internship, Summer 2027',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Google',
      location: 'New York, NY',
      remoteType: RemoteType.HYBRID,
      salaryRange: '$55 - $72 / hour',
      benefits: 'Office perks, gym membership, high return offer rate',
      applicationUrl: 'https://careers.google.com/jobs/results/112518690523488966-software-developer-intern/',
      deadline: new Date('2026-11-15'),
      description: 'General software engineering intern working on production systems and infrastructure.',
      requirements: 'Experience in Java, C++, Python, or Go; pursuing BS, MS, or PhD in Computer Science or equivalent.',
    },
    {
      title: 'Associate Product Manager (APM) - New Grad',
      type: OpportunityType.NEW_GRAD,
      companyName: 'Google',
      location: 'Mountain View, CA',
      remoteType: RemoteType.ONSITE,
      salaryRange: '$125,000 - $160,000 / year',
      benefits: '401k match, health benefits, restricted stock units (RSUs)',
      applicationUrl: 'https://careers.google.com/jobs/results/138972820464902854-software-engineering-intern/',
      deadline: new Date('2026-09-30'),
      description: 'Prestigious rotational program that grooms the next generation of product leaders.',
      requirements: 'Completed BS or MS in CS or related technical degree; strong leadership and design instinct.',
    },
    {
      title: 'Google PhD Fellowship Program',
      type: OpportunityType.FELLOWSHIP,
      companyName: 'Google',
      location: 'Remote',
      remoteType: RemoteType.REMOTE,
      salaryRange: '$50,000 stipend',
      benefits: 'Mentorship from Google Research scientists, networking',
      applicationUrl: 'https://research.google/outreach/phd-fellowship/',
      deadline: new Date('2026-12-01'),
      description: 'Fellowship supporting outstanding graduate students doing exceptional research in computer science.',
      requirements: 'Full-time PhD students enrolled at participating universities; nominated by department chair.',
    },
    {
      title: 'Google Summer of Code (GSoC) Research Program',
      type: OpportunityType.RESEARCH,
      companyName: 'Google',
      location: 'Remote',
      remoteType: RemoteType.REMOTE,
      salaryRange: '$3,000 - $6,000 stipend',
      benefits: 'Open-source code contributions, expert mentorship',
      applicationUrl: 'https://summerofcode.withgoogle.com/programs/2027',
      deadline: new Date('2026-05-15'),
      description: 'A global, online program focused on bringing new contributors into open source software development.',
      requirements: 'Must be 18+ years of age, enrolled in post-secondary education program or similar.',
    },

    // Microsoft (4)
    {
      title: 'Explore Microsoft Internship',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Microsoft',
      location: 'Redmond, WA',
      remoteType: RemoteType.ONSITE,
      salaryRange: '$38 - $48 / hour',
      benefits: 'Corporate housing, transit card, full healthcare access',
      applicationUrl: 'https://apply.careers.microsoft.com/careers/job/1970393556855498',
      deadline: new Date('2026-10-15'),
      description: '12-week rotational program designed for freshmen and sophomores to experience PM and SWE roles.',
      requirements: 'Enrolled in a Bachelor program; completed Intro to CS and calculus.',
    },
    {
      title: 'Software Engineering New Grad 2027',
      type: OpportunityType.NEW_GRAD,
      companyName: 'Microsoft',
      location: 'Seattle, WA',
      remoteType: RemoteType.HYBRID,
      salaryRange: '$118,000 - $145,000 / year',
      benefits: 'Stock grants, wellness reimbursement, relocation assistance',
      applicationUrl: 'https://apply.careers.microsoft.com/careers/job/1970393556857596',
      deadline: new Date('2026-11-30'),
      description: 'Full-time engineering roles in Windows, Azure, Xbox, or AI divisions.',
      requirements: 'Graduating between September 2026 and June 2027 with a BS/MS/PhD in Computer Science.',
    },
    {
      title: 'Microsoft Azure Hackathon Fellowship',
      type: OpportunityType.HACKATHON,
      companyName: 'Microsoft',
      location: 'Redmond, WA',
      remoteType: RemoteType.ONSITE,
      salaryRange: '$15,000 cash prizes',
      benefits: 'Fast-tracked interview for summer internships, Azure credits',
      applicationUrl: 'https://apply.careers.microsoft.com/careers',
      deadline: new Date('2026-08-20'),
      description: 'Weekend long building session with technical Azure mentors focusing on Generative AI pipelines.',
      requirements: 'Currently enrolled undergraduate students, team sizes of up to 4.',
    },
    {
      title: 'Microsoft Research Fellowship',
      type: OpportunityType.FELLOWSHIP,
      companyName: 'Microsoft',
      location: 'Cambridge, MA',
      remoteType: RemoteType.HYBRID,
      salaryRange: '$95,000 / year',
      benefits: 'Full researcher resources, publisher funding',
      applicationUrl: 'https://www.microsoft.com/en-us/research/academic-program/phd-fellowship/',
      deadline: new Date('2026-09-15'),
      description: 'Support for promising researchers post-graduation to explore complex cloud system computing concepts.',
      requirements: 'Recently completed PhD in Computer Science with a focus on Distributed Systems or Cryptography.',
    },

    // Meta (3)
    {
      title: 'Meta University (Software Engineering)',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Meta',
      location: 'Menlo Park, CA',
      remoteType: RemoteType.ONSITE,
      salaryRange: '$45 - $50 / hour',
      benefits: 'Paid housing, return offer path, direct mentor',
      applicationUrl: 'https://www.metacareers.com/careerprograms/students/',
      deadline: new Date('2026-10-01'),
      description: '8-week training and internship program for rising sophomores from underrepresented backgrounds.',
      requirements: 'Currently enrolled in an undergraduate degree; completed one CS course.',
    },
    {
      title: 'Enterprise Software Engineer, New Grad',
      type: OpportunityType.NEW_GRAD,
      companyName: 'Meta',
      location: 'Seattle, WA',
      remoteType: RemoteType.HYBRID,
      salaryRange: '$135,000 - $170,000 / year',
      benefits: 'Signature food options, health centers, annual bonus',
      applicationUrl: 'https://www.metacareers.com/jobsearch/?roles%5B0%5D=Internship',
      deadline: new Date('2026-10-20'),
      description: 'Design and implement internal tools and platforms that run Meta operations globally.',
      requirements: 'BS or MS in CS, or related field graduating in 2026-2027.',
    },
    {
      title: 'Llama Open Source AI Hackathon',
      type: OpportunityType.HACKATHON,
      companyName: 'Meta',
      location: 'San Francisco, CA',
      remoteType: RemoteType.ONSITE,
      salaryRange: '$20,000 top prize',
      benefits: 'GPU cloud access, meeting Meta AI leadership',
      applicationUrl: 'https://llama.meta.com',
      deadline: new Date('2026-09-05'),
      description: 'Build applications using Llama 3 models over 48 hours. Focus on agentic workflows and local compute.',
      requirements: 'Open registration; teams of 1 to 5 members.',
    },

    // Apple (3)
    {
      title: 'Hardware Engineering Intern, Summer 2027',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Apple',
      location: 'Cupertino, CA',
      remoteType: RemoteType.ONSITE,
      salaryRange: '$50 - $65 / hour',
      benefits: 'Employee product discounts, free transit shuttles',
      applicationUrl: 'https://jobs.apple.com/en-us/search?search=internship',
      deadline: new Date('2026-10-30'),
      description: 'Participate in the electrical or mechanical design and validation of next-generation consumer hardware.',
      requirements: 'Pursuing BS or MS in EE, CE, or ME; familiar with CAD, SPICE, or oscilloscope tools.',
    },
    {
      title: 'iOS Developer New Grad 2027',
      type: OpportunityType.NEW_GRAD,
      companyName: 'Apple',
      location: 'Cupertino, CA',
      remoteType: RemoteType.ONSITE,
      salaryRange: '$130,000 - $165,000 / year',
      benefits: 'Full benefits, annual stock refresh, gym access',
      applicationUrl: 'https://jobs.apple.com/en-us/search?search=iOS',
      deadline: new Date('2026-11-10'),
      description: 'Build native iOS experiences for core applications, system frameworks, or visionOS platforms.',
      requirements: 'Experience with Swift, SwiftUI, and Objective-C; BS in CS/CE graduating in 2027.',
    },
    {
      title: 'Apple Scholars in AI/ML PhD Fellowship',
      type: OpportunityType.FELLOWSHIP,
      companyName: 'Apple',
      location: 'Cupertino, CA',
      remoteType: RemoteType.HYBRID,
      salaryRange: '$100,000 stipend',
      benefits: 'Internship at Apple Research, dedicated research mentor',
      applicationUrl: 'https://machinelearning.apple.com',
      deadline: new Date('2026-12-15'),
      description: 'Supports PhD students doing research in machine learning and artificial intelligence.',
      requirements: 'PhD candidate in nominated fields; strong publication record in NeurIPS, ICML, CVPR.',
    },

    // Stripe (3)
    {
      title: 'Software Engineering Intern, Infrastructure',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Stripe',
      location: 'San Francisco, CA',
      remoteType: RemoteType.HYBRID,
      salaryRange: '$60 - $75 / hour',
      benefits: 'Stripe meal plan, high-spec work laptop, return offer conversion',
      applicationUrl: 'https://stripe.com/careers/listing/software-engineer-intern/8031833',
      deadline: new Date('2026-10-10'),
      description: 'Work on foundational payment systems, developer APIs, or cloud platforms.',
      requirements: 'Pursuing BS in CS or related major, graduation between Dec 2027 and Summer 2028.',
    },
    {
      title: 'Full Stack Engineer - New Grad 2027',
      type: OpportunityType.NEW_GRAD,
      companyName: 'Stripe',
      location: 'Seattle, WA',
      remoteType: RemoteType.HYBRID,
      salaryRange: '$135,000 - $160,000 / year',
      benefits: 'Stock grants, home office budget, fitness subsidy',
      applicationUrl: 'https://stripe.com/careers/search?teams=University',
      deadline: new Date('2026-11-20'),
      description: 'Build user-facing payment flows, dashboard experiences, and subscription models.',
      requirements: 'Experience in React, Ruby, Go, or Java; graduating BS/MS in 2027.',
    },
    {
      title: 'Stripe API Hackathon for Tech Inclusion',
      type: OpportunityType.HACKATHON,
      companyName: 'Stripe',
      location: 'Remote',
      remoteType: RemoteType.REMOTE,
      salaryRange: '$10,000 prize pool',
      benefits: 'Stripe swag pack, priority recruiter screen',
      applicationUrl: 'https://stripe.com/careers/search?teams=University',
      deadline: new Date('2026-07-31'),
      description: 'A 24-hour virtual hackathon building payment utilities that lower barriers for global commerce.',
      requirements: 'Students currently enrolled in undergraduate or graduate programs globally.',
    },

    // Vercel (3)
    {
      title: 'Frontend Frameworks Intern, Next.js',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Vercel',
      location: 'Remote',
      remoteType: RemoteType.REMOTE,
      salaryRange: '$40 - $55 / hour',
      benefits: 'Flexible hours, remote equipment allowance',
      applicationUrl: 'https://vercel.com/careers',
      deadline: new Date('2026-11-01'),
      description: 'Contribute directly to Next.js core, build features, fix compiler issues, and improve dev experience.',
      requirements: 'Deep knowledge of React, Next.js, and TypeScript; experience with Rust is a plus.',
    },
    {
      title: 'Cloud Systems Engineer, New Grad',
      type: OpportunityType.NEW_GRAD,
      companyName: 'Vercel',
      location: 'Remote',
      remoteType: RemoteType.REMOTE,
      salaryRange: '$110,000 - $140,000 / year',
      benefits: 'Equity, unlimited PTO, coworking membership stipend',
      applicationUrl: 'https://vercel.com/careers',
      deadline: new Date('2026-10-15'),
      description: 'Build the serverless runtime and edge routing network running Vercel applications globally.',
      requirements: 'Familiar with Node.js, Go, Rust, or AWS/Cloudflare networks; BS in CS graduating in 2027.',
    },
    {
      title: 'Vercel Turborepo Scholarship Program',
      type: OpportunityType.SCHOLARSHIP,
      companyName: 'Vercel',
      location: 'Remote',
      remoteType: RemoteType.REMOTE,
      salaryRange: '$5,000 academic grant',
      benefits: 'Mentorship meetings, fast-track internship application',
      applicationUrl: 'https://vercel.com/careers',
      deadline: new Date('2026-08-31'),
      description: 'Award for students promoting monorepo optimizations or open source build utilities.',
      requirements: 'Undergraduate student major in CS or software engineering with open source code contributions.',
    },

    // Supabase (3)
    {
      title: 'Developer Advocate Intern, Open Source',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Supabase',
      location: 'Remote',
      remoteType: RemoteType.REMOTE,
      salaryRange: '$35 - $45 / hour',
      benefits: 'Stipend for technical content creation, remote setup',
      applicationUrl: 'https://supabase.com/careers',
      deadline: new Date('2026-10-05'),
      description: 'Create technical tutorials, sample apps, and represent Supabase in developer communities.',
      requirements: 'Enrolled in post-secondary program; active on GitHub; loves writing technical guides.',
    },
    {
      title: 'Database Engineer, Postgres Focus (New Grad)',
      type: OpportunityType.NEW_GRAD,
      companyName: 'Supabase',
      location: 'Remote',
      remoteType: RemoteType.REMOTE,
      salaryRange: '$120,000 - $150,000 / year',
      benefits: 'Unlimited PTO, medical, open source sponsorships',
      applicationUrl: 'https://supabase.com/careers',
      deadline: new Date('2026-11-01'),
      description: 'Work directly on optimizing Postgres extensions, connection poolers, and auth modules.',
      requirements: 'Strong SQL and database optimization skills; C or Go experience; graduating in 2026-2027.',
    },
    {
      title: 'Supabase Launch Week Hackathon',
      type: OpportunityType.HACKATHON,
      companyName: 'Supabase',
      location: 'Remote',
      remoteType: RemoteType.REMOTE,
      salaryRange: '$5,000 Open Source budget',
      benefits: 'Fast track database engineering interview, Supabase mug',
      applicationUrl: 'https://supabase.com/careers',
      deadline: new Date('2026-12-10'),
      description: 'Build a project using Supabase storage, database, real-time, or edge functions over 7 days.',
      requirements: 'Open globally; projects must be open source.',
    },

    // Linear (3)
    {
      title: 'Product Engineer Intern, Summer 2027',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Linear',
      location: 'Remote',
      remoteType: RemoteType.REMOTE,
      salaryRange: '$55 - $70 / hour',
      benefits: 'Remote office stipend, matching tech hardware package',
      applicationUrl: 'https://linear.app/careers',
      deadline: new Date('2026-11-20'),
      description: 'Design and build clean interface features, lightning-fast sync engines, and integrations.',
      requirements: 'High attention to design detail, experience with React, Electron, or SQL; enrolled in CS/Design.',
    },
    {
      title: 'Full Stack Engineer - New Grad',
      type: OpportunityType.NEW_GRAD,
      companyName: 'Linear',
      location: 'Remote',
      remoteType: RemoteType.REMOTE,
      salaryRange: '$130,000 - $160,000 / year',
      benefits: 'Equity, flexible remote working, wellness budget',
      applicationUrl: 'https://linear.app/careers',
      deadline: new Date('2026-10-15'),
      description: 'Build the core architecture powering the fastest issue tracker on earth.',
      requirements: 'Solid TypeScript/JavaScript knowledge, experience with PostgreSQL/GraphQL; graduating BS in 2027.',
    },
    {
      title: 'Linear Design System Research Fellowship',
      type: OpportunityType.FELLOWSHIP,
      companyName: 'Linear',
      location: 'Remote',
      remoteType: RemoteType.REMOTE,
      salaryRange: '$25,000 academic stipend',
      benefits: 'Design mentorship, published showcase of research',
      applicationUrl: 'https://linear.app/careers',
      deadline: new Date('2026-08-15'),
      description: '6-month fellowship researching sub-millisecond keyboard shortcuts, accessibility, and canvas render loops.',
      requirements: 'Master or PhD students in HCI or Software Engineering; portfolio showing interactive web apps.',
    },

    // Amazon (2)
    {
      title: 'AWS Software Engineering Intern',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Amazon',
      location: 'Seattle, WA',
      remoteType: RemoteType.ONSITE,
      salaryRange: '$48 - $62 / hour',
      benefits: 'Relocation subsidy, free transit card, AWS developer accounts',
      applicationUrl: 'https://www.amazon.jobs/en/jobs/10418355/2027-software-dev-engineer-intern',
      deadline: new Date('2026-11-30'),
      description: 'Work on EC2, S3, or Lambda services, solving challenges in scaling, security, and distribution.',
      requirements: 'Currently pursuing Bachelor or Master in CS; coursework in data structures, systems, and algorithms.',
    },
    {
      title: 'Amazon Software Development Engineer SDE, New Grad',
      type: OpportunityType.NEW_GRAD,
      companyName: 'Amazon',
      location: 'Boston, MA',
      remoteType: RemoteType.HYBRID,
      salaryRange: '$120,000 - $145,000 / year',
      benefits: 'RSUs, health/dental, relocation package',
      applicationUrl: 'https://amazon.jobs/en/jobs/10462014/software-development-graduate-aws-2027-sydney',
      deadline: new Date('2026-12-15'),
      description: 'Full-time software engineering roles supporting retail, logistics, or AWS cloud software pipelines.',
      requirements: 'Graduating between October 2026 and Summer 2027 with BS/MS in Computer Science.',
    },

    // Netflix (1)
    {
      title: 'Netflix Software Engineering Internship, Summer 2027',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Netflix',
      location: 'Los Gatos, CA',
      remoteType: RemoteType.HYBRID,
      salaryRange: '$75 - $90 / hour',
      benefits: 'Premium corporate housing, high conversion path',
      applicationUrl: 'https://explore.jobs.netflix.net/careers/job/790312415414-machine-learning-engineer-intern-ms-phd-2026-los-gatos-california-united-states-of-america?domain=netflix.com&microsite=netflix.com',
      deadline: new Date('2026-09-30'),
      description: 'Work in streaming infrastructure, recommendation algorithms, or developer studio tooling.',
      requirements: 'Pursuing BS/MS/PhD in Computer Science with strong coding experience in Java, JavaScript, or C++.',
    },
  ];

  const opportunities: Opportunity[] = [];
  for (const opp of opportunitiesData) {
    const company = companies[opp.companyName];
    if (!company) continue;

    const createdOpp = await prisma.opportunity.create({
      data: {
        title: opp.title,
        type: opp.type,
        companyId: company.id,
        location: opp.location,
        remoteType: opp.remoteType,
        salaryRange: opp.salaryRange,
        benefits: opp.benefits,
        applicationUrl: opp.applicationUrl,
        deadline: opp.deadline,
        description: opp.description,
        requirements: opp.requirements,
        isActive: true,
      },
    });
    opportunities.push(createdOpp);
  }
  console.log(`✓ Seeded ${opportunities.length} opportunities.`);

  // 4. Seed 3 Users with Profiles and Email Preferences
  console.log('👤 Seeding users and profiles...');
  const usersData = [
    {
      clerkId: 'user_clerk_admin01',
      email: 'admin@internscope.ai',
      role: Role.ADMIN,
      firstName: 'Kiran',
      lastName: 'Gudepu',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'PostgreSQL', 'Prisma', 'System Design'],
      graduationYear: 2026,
      major: 'Computer Science & Engineering',
    },
    {
      clerkId: 'user_clerk_user01',
      email: 'kiran.candidate@gmail.com',
      role: Role.USER,
      firstName: 'Kiran',
      lastName: 'Candidate',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80',
      skills: ['JavaScript', 'TypeScript', 'TailwindCSS', 'Next.js', 'Python', 'Git'],
      graduationYear: 2027,
      major: 'Software Engineering',
    },
    {
      clerkId: 'user_clerk_user02',
      email: 'john.doe@university.edu',
      role: Role.USER,
      firstName: 'John',
      lastName: 'Doe',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
      skills: ['Python', 'C++', 'Algorithms', 'SQL', 'Docker', 'Machine Learning'],
      graduationYear: 2028,
      major: 'Computer Science',
    },
  ];

  const seededUsers: Prisma.UserGetPayload<{ include: { profile: true; emailPreference: true } }>[] = [];
  for (const userData of usersData) {
    const user = await prisma.user.create({
      data: {
        clerkId: userData.clerkId,
        email: userData.email,
        role: userData.role,
        profile: {
          create: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatarUrl: userData.avatarUrl,
            skills: userData.skills,
            graduationYear: userData.graduationYear,
            major: userData.major,
          },
        },
        emailPreference: {
          create: {
            weeklyDigest: true,
            instantAlerts: true,
            deadlineReminders: true,
          },
        },
      },
      include: {
        profile: true,
        emailPreference: true,
      },
    });
    seededUsers.push(user);
  }
  console.log(`✓ Seeded ${seededUsers.length} users with profiles and email preferences.`);

  // 5. Seed Bookmarks (SavedOpportunity)
  console.log('🔖 Seeding bookmarks (SavedOpportunities)...');
  const userCandidate = seededUsers[1]; // kiran.candidate@gmail.com
  const userJohn = seededUsers[2];      // john.doe@university.edu

  // kiran saves 4 opportunities
  await prisma.savedOpportunity.create({
    data: { userId: userCandidate.id, opportunityId: opportunities[0].id }, // Google STEP
  });
  await prisma.savedOpportunity.create({
    data: { userId: userCandidate.id, opportunityId: opportunities[5].id }, // Microsoft Explore
  });
  await prisma.savedOpportunity.create({
    data: { userId: userCandidate.id, opportunityId: opportunities[9].id }, // Meta University
  });
  await prisma.savedOpportunity.create({
    data: { userId: userCandidate.id, opportunityId: opportunities[18].id }, // Vercel Frameworks
  });

  // john saves 2 opportunities
  await prisma.savedOpportunity.create({
    data: { userId: userJohn.id, opportunityId: opportunities[1].id }, // Google SWE
  });
  await prisma.savedOpportunity.create({
    data: { userId: userJohn.id, opportunityId: opportunities[14].id }, // Apple AI Fellowship
  });
  console.log('✓ Seeded bookmarks successfully.');

  // 6. Seed Applications
  console.log('📋 Seeding applications...');
  // kiran's applications
  await prisma.application.create({
    data: {
      userId: userCandidate.id,
      opportunityId: opportunities[0].id,
      status: ApplicationStatus.DISCOVERED,
      notes: 'Need to review resume and highlight STEP focus.',
    },
  });
  await prisma.application.create({
    data: {
      userId: userCandidate.id,
      opportunityId: opportunities[1].id,
      status: ApplicationStatus.APPLIED,
      notes: 'Applied on 2026-07-28 via Google Careers portal.',
    },
  });
  await prisma.application.create({
    data: {
      userId: userCandidate.id,
      opportunityId: opportunities[5].id,
      status: ApplicationStatus.INTERVIEW,
      notes: 'Scheduled explore phone screen next week! Prep array patterns.',
    },
  });
  await prisma.application.create({
    data: {
      userId: userCandidate.id,
      opportunityId: opportunities[6].id,
      status: ApplicationStatus.REJECTED,
      notes: 'Microsoft new grad application was screened out. Try again for other teams.',
    },
  });

  // john's applications
  await prisma.application.create({
    data: {
      userId: userJohn.id,
      opportunityId: opportunities[2].id,
      status: ApplicationStatus.APPLIED,
      notes: 'Applied for Google APM program.',
    },
  });
  await prisma.application.create({
    data: {
      userId: userJohn.id,
      opportunityId: opportunities[15].id,
      status: ApplicationStatus.OFFER,
      notes: 'Received SWE Intern offer! $65/hr Cupertino location.',
    },
  });
  console.log('✓ Seeded applications successfully.');

  // 7. Seed Notifications
  console.log('🔔 Seeding notifications...');
  await prisma.notification.create({
    data: {
      userId: userCandidate.id,
      type: NotificationType.SYSTEM,
      title: 'Welcome to InternScope AI',
      message: 'Account created! Get started by searching new tech internship roles.',
      isRead: true,
    },
  });
  await prisma.notification.create({
    data: {
      userId: userCandidate.id,
      type: NotificationType.APPLICATION_DEADLINE,
      title: 'Deadline Approaching!',
      message: 'The deadline for STEP Internship 2027 is in 3 days. Complete your application!',
      isRead: false,
    },
  });
  await prisma.notification.create({
    data: {
      userId: userCandidate.id,
      type: NotificationType.MATCH_ACCURACY,
      title: 'High Match Found!',
      message: 'Vercel Frameworks Intern aligns with 94% of your React & TypeScript profile skills.',
      isRead: false,
    },
  });

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log('💤 Disconnected from Neon PostgreSQL.');
  });
