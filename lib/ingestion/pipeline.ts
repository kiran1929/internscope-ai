import { Connector } from './connector';
import { Normalizer } from './normalizer';
import { CompanyMatcher } from './matcher';
import { DuplicateDetector } from './duplicate-detector';
import { OpportunityValidator } from './validator';
import { OpportunityRepository } from '../repositories/opportunity';
import { IngestionLogger } from './logger';
import {
  IngestionSummary,
  OpportunityIngestionRecord,
  RawOpportunity,
  ParsedOpportunity,
  NormalizedOpportunity,
  CompanyMatchResult,
  DuplicateDetectResult,
  ValidationResult
} from './types';
import { ParseError, ValidationError, PersistenceError } from './errors';
import { DeadLetterQueue } from './dead-letter-queue';

export class IngestionPipeline {
  constructor(private readonly connector: Connector) {}

  async run(): Promise<IngestionSummary> {
    const source = this.connector.metadata;
    const startTime = new Date();
    
    IngestionLogger.info('Pipeline', `Starting ingestion run for source: ${source.name} (${source.id})`, source.id);

    const summary: IngestionSummary = {
      sourceId: source.id,
      startTime,
      endTime: startTime, // placeholder until finished
      totalFetched: 0,
      totalParsed: 0,
      totalNormalized: 0,
      totalMatched: 0,
      totalValidated: 0,
      totalDuplicates: 0,
      totalPersisted: 0,
      totalFailed: 0,
      records: [],
    };

    let raws: RawOpportunity[] = [];
    try {
      IngestionLogger.info('Pipeline', 'Fetching raw payloads from source connector...', source.id);
      raws = await this.connector.fetchRaw();
      summary.totalFetched = raws.length;
      IngestionLogger.info('Fetched', `Successfully fetched ${raws.length} raw payloads`, source.id, undefined, { count: raws.length });
    } catch (error) {
      const errObj = error instanceof Error ? error : new Error(String(error));
      IngestionLogger.error('Pipeline', 'Failed to fetch raw opportunities from source connector', source.id, undefined, undefined, errObj);
      summary.endTime = new Date();
      return summary;
    }

    for (const raw of raws) {
      const record: OpportunityIngestionRecord = {
        raw,
        parsed: null,
        normalized: null,
        match: null,
        duplicate: null,
        validation: null,
        status: 'failed',
        errors: [],
      };

      try {
        // 1. Parsing Stage
        let parsed: ParsedOpportunity;
        try {
          parsed = await this.connector.parse(raw);
          record.parsed = parsed;
          summary.totalParsed++;
          IngestionLogger.debug('Parsed', `Parsed opportunity: ${parsed.title}`, source.id, raw.externalJobId);
        } catch (err) {
          const errObj = err instanceof Error ? err : new Error(String(err));
          throw new ParseError(`Failed to parse raw payload: ${errObj.message}`, errObj);
        }

        // 2. Normalization Stage
        const normalized = Normalizer.normalize(parsed);
        record.normalized = normalized;
        summary.totalNormalized++;
        IngestionLogger.debug('Normalized', `Normalized opportunity fields for: ${normalized.title}`, source.id, raw.externalJobId);

        // 3. Company Matching Stage
        const matchResult = await CompanyMatcher.match(normalized);
        record.match = matchResult;
        if (matchResult.companyId) {
          summary.totalMatched++;
          IngestionLogger.debug('Matched', `Matched company "${normalized.companyName}" to ID: ${matchResult.companyId}`, source.id, raw.externalJobId);
        } else {
          IngestionLogger.debug('Matched', `No matched company found for: "${normalized.companyName}"`, source.id, raw.externalJobId);
        }

        // 4. Duplicate Detection Stage
        const duplicateResult = await DuplicateDetector.detect(normalized, matchResult.companyId);
        record.duplicate = duplicateResult;
        if (duplicateResult.isDuplicate) {
          summary.totalDuplicates++;
          record.status = 'duplicate';
          IngestionLogger.info('Skipped', `Duplicate skipped: ${normalized.title} (Confidence: ${duplicateResult.confidence})`, source.id, raw.externalJobId, { reason: duplicateResult.message });
          summary.records.push(record);
          continue;
        }

        // 5. Validation Stage
        const validationResult = OpportunityValidator.validate(normalized);
        record.validation = validationResult;
        if (!validationResult.isValid) {
          summary.totalFailed++;
          record.status = 'failed';
          record.errors.push(...validationResult.errors);
          IngestionLogger.warn('Validated', `Validation failed for: ${normalized.title}`, source.id, raw.externalJobId, { errors: validationResult.errors });
          summary.records.push(record);
          continue;
        }
        summary.totalValidated++;

        // 6. Persistence Stage (CRIT-003: Zero Data Loss Pipeline)
        let targetCompanyId = matchResult.companyId;
        if (!targetCompanyId) {
          const autoProvision = await CompanyMatcher.getOrCreateCompany(normalized);
          targetCompanyId = autoProvision.companyId;
          if (autoProvision.isNew) {
            IngestionLogger.info('Matched', `Auto-provisioned company record for "${normalized.companyName}"`, source.id, raw.externalJobId);
          }
        }

        try {
          await OpportunityRepository.upsertByUrl({
            title: normalized.title,
            type: normalized.type,
            location: normalized.location,
            remoteType: normalized.remoteType,
            applicationUrl: normalized.applicationUrl,
            description: normalized.description,
            requirements: normalized.requirements,
            salaryRange: normalized.salaryRange,
            deadline: normalized.deadline,
            companyId: targetCompanyId,
            tags: normalized.tags,
            isActive: true,
          });

          record.status = 'success';
          summary.totalPersisted++;
          IngestionLogger.info('Accepted', `Saved opportunity: "${normalized.title}" under company ID: ${targetCompanyId}`, source.id, raw.externalJobId);
        } catch (err) {
          const errObj = err instanceof Error ? err : new Error(String(err));
          throw new PersistenceError(`Database insert failed: ${errObj.message}`, errObj);
        }

      } catch (err) {
        const errObj = err instanceof Error ? err : new Error(String(err));
        summary.totalFailed++;
        record.status = 'failed';
        record.errors.push(errObj.message);
        
        // Push to Dead Letter Queue (HIGH-004)
        DeadLetterQueue.recordFailure(
          source.id,
          'PipelineProcessing',
          errObj.message,
          raw.externalJobId,
          raw.payload
        );

        IngestionLogger.error(
          'Failed',
          `Pipeline error processing job record: ${errObj.message}`,
          source.id,
          raw.externalJobId,
          undefined,
          errObj
        );
      }

      summary.records.push(record);
    }

    summary.endTime = new Date();
    const duration = summary.endTime.getTime() - summary.startTime.getTime();
    
    IngestionLogger.info(
      'Pipeline',
      `Ingestion pipeline finished in ${duration}ms. Persisted: ${summary.totalPersisted}, Duplicates: ${summary.totalDuplicates}, Failed: ${summary.totalFailed}`,
      source.id,
      undefined,
      { summary }
    );

    return summary;
  }
}
