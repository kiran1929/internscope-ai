import { ScrapeSourceMetadata, RawOpportunity, ParsedOpportunity } from './types';

export interface Connector {
  metadata: ScrapeSourceMetadata;
  fetchRaw(): Promise<RawOpportunity[]>;
  parse(raw: RawOpportunity): Promise<ParsedOpportunity>;
}
