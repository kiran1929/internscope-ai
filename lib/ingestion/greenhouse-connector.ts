import { Connector } from './connector';
import { ScrapeSourceMetadata, RawOpportunity, ParsedOpportunity } from './types';

export class GreenhouseConnector implements Connector {
  public readonly metadata: ScrapeSourceMetadata = {
    id: 'greenhouse_stripe',
    name: 'Stripe Greenhouse Portal',
    type: 'greenhouse',
    enabled: true,
    url: 'https://boards-api.greenhouse.io/v1/boards/stripe/jobs',
  };

  // Mock fetching Greenhouse JSON response payloads
  async fetchRaw(): Promise<RawOpportunity[]> {
    const rawJobs = [
      {
        id: 'stripe-intern-101',
        title: 'Software Engineering Intern, Frontend (Fall 2026)',
        location: { name: 'Seattle, WA' },
        absolute_url: 'https://stripe.com/jobs/stripe-intern-101',
        content: 'Join Stripe as a Software Engineering Intern on the dashboard team. Requires React and TypeScript.',
        metadata: [
          { name: 'Salary', value: '$8,000 / month' },
          { name: 'LinkedIn', value: 'https://linkedin.com/company/stripe' },
        ],
      },
      {
        id: 'stripe-intern-102',
        title: 'Software Engineering Intern, Backend (Fall 2026)',
        location: { name: 'Remote, US' },
        absolute_url: 'https://stripe.com/jobs/stripe-intern-102',
        content: 'Design low-latency database queries. Requires Node.js and PostgreSQL. Expired 2025.',
        metadata: [
          { name: 'Salary', value: '$9,000 / month' },
          { name: 'Deadline', value: '2025-12-31' }, // expired test
        ],
      },
      {
        id: 'stripe-intern-103',
        title: 'Product Design Intern',
        location: { name: 'San Francisco, CA' },
        absolute_url: 'stripe-intern-103-invalid-url', // malformed URL test
        content: 'Craft user interfaces for Stripe Terminal. Requires Figma skills.',
      },
    ];

    return rawJobs.map((job) => ({
      sourceId: this.metadata.id,
      externalJobId: job.id,
      payload: job,
      fetchedAt: new Date(),
    }));
  }

  async parse(raw: RawOpportunity): Promise<ParsedOpportunity> {
    const payload = raw.payload as {
      title?: string;
      location?: { name?: string };
      absolute_url?: string;
      content?: string;
      metadata?: Array<{ name: string; value: string }>;
    };

    const linkedin = payload.metadata?.find((m) => m.name === 'LinkedIn')?.value;
    const deadline = payload.metadata?.find((m) => m.name === 'Deadline')?.value;
    const salary = payload.metadata?.find((m) => m.name === 'Salary')?.value;

    return {
      externalJobId: raw.externalJobId,
      title: payload.title || '',
      companyName: 'Stripe', // Stripe Greenhouse portal
      companyWebsite: 'https://stripe.com',
      companyLinkedin: linkedin,
      location: payload.location?.name || '',
      remoteType: payload.location?.name?.toLowerCase().includes('remote') ? 'remote' : 'onsite',
      type: 'internship',
      salaryRange: salary,
      applicationUrl: payload.absolute_url || '',
      description: payload.content || '',
      deadline: deadline,
      tags: ['Stripe', 'Engineering'],
    };
  }
}
