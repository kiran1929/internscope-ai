/**
 * Utilities for parsing and classifying job locations (Inside India vs Outside India).
 */

// Known Indiana / US locations that should NEVER be classified as India
const INDIANA_AND_US_INDICATORS = [
  'indiana',
  'indianapolis',
  'bloomington',
  'west lafayette',
  'lafayette',
  'fort wayne',
  'south bend',
  'evansville',
  'carmel',
  'fishers',
  'terre haute',
  'muncie',
  'kokomo',
  'elkhart',
  'columbus, in',
  'gary, in',
  'in, usa',
  'in, us',
  'in, united states',
];

// Major other countries and regions for fast exclusion
const NON_INDIA_COUNTRIES = [
  'usa',
  'u.s.a',
  'united states',
  'united kingdom',
  'uk',
  'canada',
  'germany',
  'france',
  'australia',
  'singapore',
  'japan',
  'china',
  'brazil',
  'netherlands',
  'ireland',
  'sweden',
  'switzerland',
  'israel',
  'poland',
  'spain',
  'italy',
  'mexico',
  'new zealand',
];

const INDIAN_CITIES_AND_REGIONS = [
  // Tier 1 & Tech Hubs
  'bengaluru',
  'bangalore',
  'hyderabad',
  'secunderabad',
  'mumbai',
  'bombay',
  'navi mumbai',
  'thane',
  'delhi',
  'new delhi',
  'ncr',
  'delhi ncr',
  'noida',
  'greater noida',
  'gurgaon',
  'gurugram',
  'faridabad',
  'ghaziabad',
  'pune',
  'chennai',
  'madras',
  'kolkata',
  'calcutta',
  'ahmedabad',
  'gandhinagar',
  'surat',
  'vadodara',
  'kochi',
  'cochin',
  'thiruvananthapuram',
  'trivandrum',
  'calicut',
  'kozhikode',
  'chandigarh',
  'mohali',
  'panchkula',
  'jaipur',
  'indore',
  'bhopal',
  'bhubaneswar',
  'cuttack',
  'coimbatore',
  'madurai',
  'trichy',
  'tiruchirappalli',
  'lucknow',
  'kanpur',
  'nagpur',
  'visakhapatnam',
  'vizag',
  'vijayawada',
  'mysore',
  'mysuru',
  'goa',
  'panaji',
  'dehradun',
  'guwahati',
  'patna',
  'ranchi',
  'jamshedpur',
  'mangalore',
  'mangaluru',
  'hubli',
  'dharwad',
  'belgaum',
  'belagavi',
  'warangal',
  'raipur',
  'gwalior',
  'jabalpur',
  'amritsar',
  'jalandhar',
  'ludhiana',
  'udaipur',
  'jodhpur',
  // Indian States & Union Territories
  'andhra pradesh',
  'arunachal pradesh',
  'assam',
  'bihar',
  'chhattisgarh',
  'gujarat',
  'haryana',
  'himachal pradesh',
  'jharkhand',
  'karnataka',
  'kerala',
  'madhya pradesh',
  'maharashtra',
  'manipur',
  'meghalaya',
  'mizoram',
  'nagaland',
  'odisha',
  'orissa',
  'punjab',
  'rajasthan',
  'sikkim',
  'tamil nadu',
  'telangana',
  'tripura',
  'uttar pradesh',
  'uttarakhand',
  'west bengal',
];

/**
 * Checks if a given location string belongs to Inside India.
 */
export function isIndiaLocation(location?: string | null): boolean {
  if (!location) return false;
  const loc = location.toLowerCase().trim();

  // 1. Explicit Indiana & Indiana cities check -> NOT India
  if (INDIANA_AND_US_INDICATORS.some((ind) => loc.includes(ind))) {
    return false;
  }

  // 2. Check for explicit "India" or "Bharat" word (with word boundaries to avoid matching Indiana/Indianola/etc.)
  const hasExactIndia =
    /\bindia\b/i.test(loc) ||
    /\bbharat\b/i.test(loc) ||
    /\(india\)/i.test(loc) ||
    /\[india\]/i.test(loc) ||
    /-\s*india\b/i.test(loc);

  if (hasExactIndia) {
    // Extra safety: ensure it's not "Indiana" or something like "Indianola"
    if (!/\bindiana\b/i.test(loc) && !/\bindianapolis\b/i.test(loc)) {
      return true;
    }
  }

  // 3. Check for recognized Indian cities, IT hubs, and states
  const hasIndianCityOrState = INDIAN_CITIES_AND_REGIONS.some((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
    return regex.test(loc);
  });

  if (hasIndianCityOrState) {
    // If it has a known Indian city (e.g. Bengaluru, Hyderabad, Pune), verify it doesn't conflict with a foreign country
    return true;
  }

  // If none matched, it's outside India (e.g. US cities, international, general remote)
  return false;
}

/**
 * Returns location category: 'india' or 'outside_india'.
 */
export function getLocationCategory(location?: string | null): 'india' | 'outside_india' {
  return isIndiaLocation(location) ? 'india' : 'outside_india';
}
