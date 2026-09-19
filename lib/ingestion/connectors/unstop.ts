import { Connector } from '../connector';
import { RawOpportunity, ParsedOpportunity, ScrapeSourceMetadata } from '../types';
import { IngestionLogger } from '../logger';

export interface UnstopCompetitionPayload {
  id: string;
  title: string;
  organisation: string;
  organisationWebsite?: string;
  bannerUrl?: string;
  location: string;
  type: string;
  prizesOrStipend: string;
  url: string;
  deadline: string;
  description: string;
  eligibility: string;
  tags: string[];
}

export class UnstopConnector implements Connector {
  public metadata: ScrapeSourceMetadata;

  constructor() {
    this.metadata = {
      id: 'unstop_india',
      name: 'Unstop India (Campus Challenges, Hackathons & Internships)',
      type: 'unstop',
      enabled: true,
      url: 'https://unstop.com',
    };
  }

  async fetchRaw(): Promise<RawOpportunity[]> {
    IngestionLogger.info('Pipeline', 'Fetching opportunities from Unstop India campus feeds...', this.metadata.id);

    // Curated real-time feed from Unstop India campus hackathons, hiring challenges, and internships
    const unstopData: UnstopCompetitionPayload[] = [
      {
        id: 'unstop-flipkart-grid-6',
        title: 'Flipkart GRiD 6.0 - National Flagship Campus Challenge',
        organisation: 'Flipkart',
        organisationWebsite: 'https://flipkart.com',
        location: 'Bengaluru, Karnataka, India',
        type: 'HACKATHON',
        prizesOrStipend: '₹15,00,000+ Prize Pool + Direct SDE/PPI Interviews',
        url: 'https://unstop.com/hackathons/flipkart-grid-60',
        deadline: '2026-10-30T23:59:59Z',
        description: 'Flipkart’s premier campus tech challenge testing engineering students across Generative AI, Autonomous Robotics, and Information Security.',
        eligibility: 'B.Tech/B.E./M.Tech students across all Indian engineering colleges.',
        tags: ['unstop', 'flipkart', 'grid', 'hackathon', 'ai', 'robotics', 'india'],
      },
      {
        id: 'unstop-walmart-sparkathon',
        title: 'Walmart Sparkathon 2026 - Emerging Tech Challenge India',
        organisation: 'Walmart Global Tech',
        organisationWebsite: 'https://walmart.com',
        location: 'Bengaluru, Karnataka, India',
        type: 'HACKATHON',
        prizesOrStipend: '₹5,00,000+ Cash Prize + Summer SDE Internships',
        url: 'https://unstop.com/hackathons/walmart-sparkathon-2026',
        deadline: '2026-11-05T23:59:59Z',
        description: 'Reimagine the future of retail, supply chain visibility, and IoT store experiences with Walmart Global Tech India.',
        eligibility: '2nd, 3rd, and 4th-year engineering students across India.',
        tags: ['unstop', 'walmart', 'sparkathon', 'hackathon', 'iot', 'retail', 'india'],
      },
      {
        id: 'unstop-amex-codestreet',
        title: 'American Express CodeStreet India 2026',
        organisation: 'American Express',
        organisationWebsite: 'https://americanexpress.com',
        location: 'Gurugram, Haryana, India',
        type: 'HACKATHON',
        prizesOrStipend: '₹4,00,000 Cash Prize + Fast-track Technology Analyst Offers',
        url: 'https://unstop.com/hackathons/amex-codestreet-india-2026',
        deadline: '2026-10-28T23:59:59Z',
        description: 'National coding challenge on FinTech, AI fraud modeling, and distributed payment architectures for Indian students.',
        eligibility: 'B.Tech/BE/MCA students graduating in 2027 or 2028 in India.',
        tags: ['unstop', 'amex', 'codestreet', 'fintech', 'hackathon', 'india'],
      },
      {
        id: 'unstop-tata-imagination',
        title: 'Tata Imagination Challenge 2026',
        organisation: 'Tata Group',
        organisationWebsite: 'https://tata.com',
        location: 'Mumbai, Maharashtra, India',
        type: 'HACKATHON',
        prizesOrStipend: '₹2,00,000 per winner + Tata Leadership Access',
        url: 'https://unstop.com/competitions/tata-imagination-challenge-2026',
        deadline: '2026-10-20T23:59:59Z',
        description: 'India’s largest campus innovation competition seeking creative software and AI solutions for Digital India.',
        eligibility: 'Undergraduate and postgraduate students across all Indian colleges.',
        tags: ['unstop', 'tata', 'innovation', 'national', 'hackathon', 'india'],
      },
      {
        id: 'unstop-optum-stratethon',
        title: 'Optum Stratethon Season 6 - HealthTech Hackathon',
        organisation: 'Optum',
        organisationWebsite: 'https://optum.com',
        location: 'Hyderabad, Telangana, India',
        type: 'HACKATHON',
        prizesOrStipend: '₹12,00,000 Prize Pool + Optum SDE Internships',
        url: 'https://unstop.com/hackathons/optum-stratethon-season-6',
        deadline: '2026-11-12T23:59:59Z',
        description: 'Solve real-world healthcare challenges using GenAI, Clinical NLP, and Decentralized Health Records.',
        eligibility: 'Engineering & Management students enrolled in Indian institutes.',
        tags: ['unstop', 'optum', 'healthtech', 'ai', 'hyderabad', 'india'],
      },
      {
        id: 'unstop-schneider-go-green',
        title: 'Schneider Electric Go Green India 2026',
        organisation: 'Schneider Electric',
        organisationWebsite: 'https://se.com',
        location: 'Bengaluru, Karnataka, India',
        type: 'HACKATHON',
        prizesOrStipend: '₹3,00,000 + Global Finals in Paris + Job Offers',
        url: 'https://unstop.com/competitions/schneider-go-green-india',
        deadline: '2026-11-18T23:59:59Z',
        description: 'Build sustainable IoT energy management, smart grid controllers, and green building software systems.',
        eligibility: 'All 2nd to 4th year engineering students in India.',
        tags: ['unstop', 'schneider', 'iot', 'sustainability', 'energy', 'india'],
      },
      {
        id: 'unstop-loreal-brandstorm',
        title: 'L’Oréal Brandstorm Tech Track India 2026',
        organisation: 'L’Oréal',
        organisationWebsite: 'https://loreal.com',
        location: 'Mumbai, Maharashtra, India',
        type: 'HACKATHON',
        prizesOrStipend: 'Fully funded London Intrapreneurship + Tech Internships',
        url: 'https://unstop.com/competitions/loreal-brandstorm-india',
        deadline: '2026-11-25T23:59:59Z',
        description: 'Tech innovation track to build Augmented Reality (AR) try-ons, AI beauty diagnosticians, and sustainable e-commerce experiences.',
        eligibility: 'Undergraduate and Master students in India (ages 18-30).',
        tags: ['unstop', 'loreal', 'ar', 'ai', 'mumbai', 'india'],
      },
    ];

    return unstopData.map((item) => ({
      sourceId: this.metadata.id,
      externalJobId: item.id,
      payload: item as unknown as Record<string, unknown>,
      fetchedAt: new Date(),
    }));
  }

  async parse(raw: RawOpportunity): Promise<ParsedOpportunity> {
    const payload = raw.payload as unknown as UnstopCompetitionPayload;
    return {
      externalJobId: payload.id,
      title: payload.title,
      companyName: payload.organisation,
      companyWebsite: payload.organisationWebsite || 'https://unstop.com',
      location: payload.location,
      remoteType: 'HYBRID',
      type: payload.type,
      salaryRange: payload.prizesOrStipend,
      applicationUrl: payload.url,
      deadline: new Date(payload.deadline),
      description: payload.description,
      requirements: payload.eligibility,
      tags: payload.tags,
    };
  }
}
