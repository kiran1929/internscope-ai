import { ScrapeSourceMetadata, RawOpportunity, ParsedOpportunity } from './types';

export interface Connector {
  metadata: ScrapeSourceMetadata;
  fetchRaw(since?: Date): Promise<RawOpportunity[]>;
  parse(raw: RawOpportunity): Promise<ParsedOpportunity>;
}
