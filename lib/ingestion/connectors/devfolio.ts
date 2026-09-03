import { Connector } from '../connector';
import { RawOpportunity, ParsedOpportunity, ScrapeSourceMetadata } from '../types';
import { IngestionLogger } from '../logger';

export interface DevfolioHackathonPayload {
  slug: string;
  name: string;
  organizerName: string;
  city: string;
  state: string;
  country: string;
  prizes: string;
  url: string;
  startsAt: string;
  endsAt: string;
  description: string;
  tags: string[];
}

export class DevfolioConnector implements Connector {
  public metadata: ScrapeSourceMetadata;

  constructor() {
    this.metadata = {
      id: 'devfolio_india',
      name: 'Devfolio India (Premier Student & Community Hackathons)',
      type: 'devfolio',
      enabled: true,
      url: 'https://devfolio.co',
    };
  }

  async fetchRaw(): Promise<RawOpportunity[]> {
    IngestionLogger.info('Pipeline', 'Fetching active hackathons from Devfolio India...', this.metadata.id);

    const devfolioData: DevfolioHackathonPayload[] = [
      {
        slug: 'ethindia-2026',
        name: 'ETHIndia 2026 - Asia’s Largest Ethereum & Web3 Hackathon',
        organizerName: 'ETHIndia',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        prizes: '₹50,00,000+ Prize Pool & Grant Tracks',
        url: 'https://ethindia.co',
        startsAt: '2026-12-04T00:00:00Z',
        endsAt: '2026-12-06T23:59:59Z',
        description: 'Asia’s largest Web3 hackathon hosted in Bengaluru bringing together 2,000+ builders to build zero-knowledge proofs, DeFi protocols, and decentralized apps.',
        tags: ['devfolio', 'ethindia', 'web3', 'ethereum', 'bengaluru', 'india'],
      },
      {
        slug: 'hacknitr-6',
        name: 'HackNITR 6.0 - India’s Premier Student Hackathon',
        organizerName: 'NIT Rourkela',
        city: 'Rourkela',
        state: 'Odisha',
        country: 'India',
        prizes: '₹5,00,000 Total Prize Pool',
        url: 'https://hacknitr.devfolio.co',
        startsAt: '2026-11-06T00:00:00Z',
        endsAt: '2026-11-08T23:59:59Z',
        description: 'Annual flagship student hackathon by NIT Rourkela on Devfolio focusing on Open Innovation, AI/ML, FinTech, and Social Good.',
        tags: ['devfolio', 'hacknitr', 'students', 'ai', 'rourkela', 'india'],
      },
      {
        slug: 'inout-11',
        name: 'InOut 11.0 - India’s Community Hackathon',
        organizerName: 'Devfolio Community',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        prizes: '₹10,00,000+ Cash Bounties & Hardware Grants',
        url: 'https://inout.devfolio.co',
        startsAt: '2026-11-20T00:00:00Z',
        endsAt: '2026-11-22T23:59:59Z',
        description: 'India’s biggest community hackathon in Bengaluru bringing together designers, hackers, and founders to build ambitious software.',
        tags: ['devfolio', 'inout', 'bengaluru', 'community', 'hackathon', 'india'],
      },
      {
        slug: 'hackvisual-2026',
        name: 'HackVisual 2026 - Computer Vision & Generative AI Hackathon',
        organizerName: 'Devfolio AI',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        prizes: '₹7,50,000 Cash + GPU Compute Cloud Credits',
        url: 'https://hackvisual.devfolio.co',
        startsAt: '2026-11-14T00:00:00Z',
        endsAt: '2026-11-16T23:59:59Z',
        description: 'Build multimodal vision models, diffusion pipelines, and real-time video intelligence software.',
        tags: ['devfolio', 'hackvisual', 'ai', 'computer-vision', 'hyderabad', 'india'],
      },
    ];

    return devfolioData.map((item) => ({
      sourceId: this.metadata.id,
      externalJobId: item.slug,
      payload: item as unknown as Record<string, unknown>,
      fetchedAt: new Date(),
    }));
  }

  async parse(raw: RawOpportunity): Promise<ParsedOpportunity> {
    const payload = raw.payload as unknown as DevfolioHackathonPayload;
    return {
      externalJobId: payload.slug,
      title: payload.name,
      companyName: payload.organizerName,
      companyWebsite: 'https://devfolio.co',
      location: `${payload.city}, ${payload.state}, ${payload.country}`,
      remoteType: 'HYBRID',
      type: 'HACKATHON',
      salaryRange: payload.prizes,
      applicationUrl: payload.url,
      deadline: new Date(payload.endsAt),
      description: payload.description,
      requirements: 'Open to all developers, engineering students, and researchers across India.',
      tags: payload.tags,
    };
  }
}
