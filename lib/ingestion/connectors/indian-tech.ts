import { Connector } from '../connector';
import { RawOpportunity, ParsedOpportunity, ScrapeSourceMetadata } from '../types';
import { IngestionLogger } from '../logger';
import { INDIAN_TECH_CATALOG, IndianCatalogOpportunity } from '../indian-catalog';
import { OpportunityType } from '../../generated/prisma/enums';

export class IndianTechConnector implements Connector {
  public metadata: ScrapeSourceMetadata;

  constructor() {
    this.metadata = {
      id: 'indian_tech_ecosystem',
      name: 'Indian Tech Unicorns, GCCs & Research Ecosystem',
      type: 'indian-tech',
      enabled: true,
      url: 'https://internscope-ai.in',
    };
  }

  async fetchRaw(): Promise<RawOpportunity[]> {
    const internships = INDIAN_TECH_CATALOG.filter(
      (item) => item.type === OpportunityType.INTERNSHIP
    );
    IngestionLogger.info('Pipeline', `Ingesting ${internships.length} Indian tech internships...`, this.metadata.id);

    return internships.map((item: IndianCatalogOpportunity, idx: number) => ({
      sourceId: this.metadata.id,
      externalJobId: `ind-tech-${idx}-${item.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      payload: item as unknown as Record<string, unknown>,
      fetchedAt: new Date(),
    }));
  }

  async parse(raw: RawOpportunity): Promise<ParsedOpportunity> {
    const payload = raw.payload as unknown as IndianCatalogOpportunity;
    return {
      externalJobId: raw.externalJobId,
      title: payload.title,
      companyName: payload.companyName,
      companyWebsite: payload.companyWebsite,
      location: payload.location,
      remoteType: payload.remoteType,
      type: payload.type,
      salaryRange: payload.salaryRange,
      applicationUrl: payload.applicationUrl,
      deadline: payload.deadline,
      description: payload.description,
      requirements: payload.requirements,
      tags: payload.tags,
    };
  }
}
