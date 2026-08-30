import { NormalizedOpportunity, ValidationResult } from './types';
import { isDeadlineExpired } from '../opportunities/deadline-utils';

export class OpportunityValidator {
  static validate(normalized: NormalizedOpportunity): ValidationResult {
    const errors: string[] = [];

    // 1. Check Title
    if (!normalized.title || normalized.title.trim() === '') {
      errors.push('Opportunity title is missing or empty.');
    }

    // 2. Check Company Name
    if (!normalized.companyName || normalized.companyName.trim() === '') {
      errors.push('Company name is missing or empty.');
    }

    // 3. Check Application URL
    if (!normalized.applicationUrl || normalized.applicationUrl.trim() === '') {
      errors.push('Application URL is missing or empty.');
    } else {
      const urlError = this.validateUrl(normalized.applicationUrl, 'Application URL');
      if (urlError) errors.push(urlError);
    }

    // 4. Check Company Website URL (if provided)
    if (normalized.companyWebsite) {
      const urlError = this.validateUrl(normalized.companyWebsite, 'Company Website URL');
      if (urlError) errors.push(urlError);
    }

    // 5. Check Company LinkedIn URL (if provided)
    if (normalized.companyLinkedin) {
      const urlError = this.validateUrl(normalized.companyLinkedin, 'LinkedIn URL');
      if (urlError) errors.push(urlError);
    }

    // 6. Reject expired deadlines
    if (normalized.deadline && isDeadlineExpired(normalized.deadline)) {
      errors.push(
        `Opportunity has expired. Deadline was ${new Date(normalized.deadline).toDateString()}`
      );
    }

    // 7. Check location
    if (!normalized.location || normalized.location.trim() === '') {
      errors.push('Location is missing or empty.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static validateUrl(url: string, fieldName: string): string | null {
    try {
      new URL(url);
      return null;
    } catch {
      return `${fieldName} ("${url}") is not a valid absolute HTTP/HTTPS URL.`;
    }
  }
}
