import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  OpportunityType,
  RemoteType,
  Company,
  Opportunity,
} from '../lib/generated/prisma/client';
import { getPgConnectionString } from '../lib/db-connection';

const pool = new pg.Pool({ connectionString: getPgConnectionString() });
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
    // Google (6)
    {
      title: 'STEP Internship 2027',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Google',
      location: 'Bengaluru, India',
      remoteType: RemoteType.ONSITE,
      salaryRange: '₹80,000 - ₹1,20,000 / month',
      benefits: 'Relocation housing, travel stipend, free gourmet meals',
      applicationUrl: 'https://buildyourfuture.withgoogle.com/step',
      deadline: new Date('2026-10-31'),
      description: 'Development program for first- and second-year undergraduate students major in CS at Google India engineering centers.',
      requirements: 'Currently enrolled in an Associate or Bachelor CS degree program; graduation between 2028 and 2029.',
    },
    {
      title: 'Software Engineering Internship, Summer 2027',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Google',
      location: 'Hyderabad, India',
      remoteType: RemoteType.HYBRID,
      salaryRange: '₹1,00,000 - ₹1,40,000 / month',
      benefits: 'Office perks, gym membership, high return offer rate',
      applicationUrl: 'https://careers.google.com/jobs/results/112518690523488966-software-developer-intern/',
      deadline: new Date('2026-11-15'),
      description: 'General software engineering intern working on production systems, YouTube, and Google Cloud infrastructure in India.',
      requirements: 'Experience in Java, C++, Python, or Go; pursuing BS, MS, or PhD in Computer Science or equivalent.',
    },
    {
      title: 'Software Engineering Internship (US)',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Google',
      location: 'Mountain View, CA',
      remoteType: RemoteType.ONSITE,
      salaryRange: '$55 - $72 / hour',
      benefits: 'Relocation housing, travel stipend, 401k matching',
      applicationUrl: 'https://careers.google.com/jobs/results/112518690523488966-software-developer-intern/',
      deadline: new Date('2026-11-15'),
      description: 'Software engineering intern working on core Google services in California.',
      requirements: 'Pursuing BS, MS, or PhD in Computer Science.',
    },
    {
      title: 'Associate Product Manager (APM) - New Grad',
      type: OpportunityType.NEW_GRAD,
      companyName: 'Google',
      location: 'New York, NY',
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
      location: 'Remote (Global)',
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
      location: 'Hyderabad, India',
      remoteType: RemoteType.ONSITE,
      salaryRange: '₹75,000 - ₹95,000 / month',
      benefits: 'Corporate housing, transit card, full healthcare access',
      applicationUrl: 'https://apply.careers.microsoft.com/careers/job/1970393556855498',
      deadline: new Date('2026-10-15'),
      description: '12-week rotational program designed for freshmen and sophomores to experience PM and SWE roles in Hyderabad IDC.',
      requirements: 'Enrolled in a Bachelor program; completed Intro to CS and calculus.',
    },
    {
      title: 'Software Engineering Intern 2027',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Microsoft',
      location: 'Bengaluru, India',
      remoteType: RemoteType.HYBRID,
      salaryRange: '₹1,00,000 - ₹1,25,000 / month',
      benefits: 'Stock grants, wellness reimbursement, relocation assistance',
      applicationUrl: 'https://apply.careers.microsoft.com/careers/job/1970393556857596',
      deadline: new Date('2026-11-30'),
      description: 'Full-time engineering internship in Azure, Developer Tools, or AI divisions in Bengaluru.',
      requirements: 'Graduating between September 2026 and June 2027 with a BS/MS/PhD in Computer Science.',
    },
    {
      title: 'Software Engineering New Grad 2027 (US)',
      type: OpportunityType.NEW_GRAD,
      companyName: 'Microsoft',
      location: 'Redmond, WA',
      remoteType: RemoteType.ONSITE,
      salaryRange: '$118,000 - $145,000 / year',
      benefits: 'Stock grants, wellness reimbursement, relocation assistance',
      applicationUrl: 'https://apply.careers.microsoft.com/careers/job/1970393556857596',
      deadline: new Date('2026-11-30'),
      description: 'Full-time engineering roles in Windows, Azure, Xbox, or AI divisions in Redmond.',
      requirements: 'Graduating between September 2026 and June 2027 with a BS/MS/PhD in Computer Science.',
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
      title: 'Hardware & Silicon Engineering Intern',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Apple',
      location: 'Hyderabad, India',
      remoteType: RemoteType.ONSITE,
      salaryRange: '₹90,000 - ₹1,30,000 / month',
      benefits: 'Employee product discounts, free transit shuttles',
      applicationUrl: 'https://jobs.apple.com/en-in/search?search=internship',
      deadline: new Date('2026-10-30'),
      description: 'Participate in the electrical, maps, and silicon design validation at Apple Hyderabad R&D.',
      requirements: 'Pursuing BS or MS in EE, CE, or ME; familiar with CAD, SPICE, or digital design.',
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
      title: 'Software Engineering Intern, Payments Infrastructure',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Stripe',
      location: 'Bengaluru, India',
      remoteType: RemoteType.HYBRID,
      salaryRange: '₹1,20,000 - ₹1,50,000 / month',
      benefits: 'Stripe meal plan, high-spec work laptop, return offer conversion',
      applicationUrl: 'https://stripe.com/careers/listing/software-engineer-intern/8031833',
      deadline: new Date('2026-10-10'),
      description: 'Work on foundational payment systems, developer APIs, or cloud platforms at Stripe India.',
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
      location: 'Remote (Global)',
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

    // Amazon (3)
    {
      title: 'AWS Software Engineering Intern',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Amazon',
      location: 'Bengaluru, India',
      remoteType: RemoteType.ONSITE,
      salaryRange: '₹85,000 - ₹1,10,000 / month',
      benefits: 'Relocation subsidy, free transit card, AWS developer accounts',
      applicationUrl: 'https://www.amazon.jobs/en/jobs/10418355/2027-software-dev-engineer-intern',
      deadline: new Date('2026-11-30'),
      description: 'Work on EC2, S3, or Lambda services, solving challenges in scaling, security, and distribution in Amazon Bengaluru.',
      requirements: 'Currently pursuing Bachelor or Master in CS; coursework in data structures, systems, and algorithms.',
    },
    {
      title: 'Amazon Software Development Engineer SDE (US)',
      type: OpportunityType.NEW_GRAD,
      companyName: 'Amazon',
      location: 'Seattle, WA',
      remoteType: RemoteType.ONSITE,
      salaryRange: '$120,000 - $145,000 / year',
      benefits: 'RSUs, health/dental, relocation package',
      applicationUrl: 'https://amazon.jobs/en/jobs/10462014/software-development-graduate-aws-2027-sydney',
      deadline: new Date('2026-12-15'),
      description: 'Full-time software engineering roles supporting retail, logistics, or AWS cloud software pipelines.',
      requirements: 'Graduating between October 2026 and Summer 2027 with BS/MS in Computer Science.',
    },
    {
      title: 'Applied Scientist Intern - Machine Learning',
      type: OpportunityType.INTERNSHIP,
      companyName: 'Amazon',
      location: 'Hyderabad, India',
      remoteType: RemoteType.HYBRID,
      salaryRange: '₹1,20,000 - ₹1,60,000 / month',
      benefits: 'Amazon internal compute cluster access, dedicated mentors',
      applicationUrl: 'https://amazon.jobs/en/jobs/10462014',
      deadline: new Date('2026-12-01'),
      description: 'Develop novel ML/AI architectures for ecommerce search, recommendations, and Alexa speech.',
      requirements: 'Enrolled in MS or PhD program in CS, Machine Learning, or Statistics.',
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

  // Users are provisioned via Clerk sign-in — no demo accounts in seed data.
  console.log('👤 Skipping demo user seeding (real users come from Clerk).');

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
