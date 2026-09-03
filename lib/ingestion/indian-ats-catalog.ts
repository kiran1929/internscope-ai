import type { ScrapeBoard } from './company-catalog';

const PROVIDER_PRIORITY: Record<ScrapeBoard['provider'], number> = {
  greenhouse: 0,
  lever: 1,
  ashby: 2,
  smartrecruiters: 3,
  workday: 4,
};

function dedupeBoardsByCompanyName(boards: ScrapeBoard[]): ScrapeBoard[] {
  const byName = new Map<string, ScrapeBoard>();
  for (const board of boards) {
    const key = board.name.trim().toLowerCase();
    const existing = byName.get(key);
    if (
      !existing ||
      PROVIDER_PRIORITY[board.provider] < PROVIDER_PRIORITY[existing.provider]
    ) {
      byName.set(key, board);
    }
  }
  return Array.from(byName.values());
}

function indiaGh(name: string, boardToken: string, websiteUrl: string): ScrapeBoard {
  return {
    name,
    provider: 'greenhouse',
    boardToken,
    websiteUrl,
    industry: 'Technology',
    region: 'india',
    enabled: true,
  };
}

function indiaLever(name: string, boardToken: string, websiteUrl: string): ScrapeBoard {
  return {
    name,
    provider: 'lever',
    boardToken,
    websiteUrl,
    industry: 'Technology',
    region: 'india',
    enabled: true,
  };
}

function indiaAshby(name: string, boardToken: string, websiteUrl: string): ScrapeBoard {
  return {
    name,
    provider: 'ashby',
    boardToken,
    websiteUrl,
    industry: 'Technology',
    region: 'india',
    enabled: true,
  };
}

/**
 * Indian companies with public Greenhouse / Lever / Ashby job boards.
 * Scraper keeps only India-location + internship roles (see pipeline filters).
 */
export const INDIAN_ATS_BOARDS: ScrapeBoard[] = [
  // ── Greenhouse (India HQ or major India engineering hubs) ──
  indiaGh('BrowserStack', 'browserstack', 'https://www.browserstack.com'),
  indiaGh('Razorpay', 'razorpay', 'https://razorpay.com'),
  indiaGh('PhonePe', 'phonepe', 'https://phonepe.com'),
  indiaGh('Hasura', 'hasura', 'https://hasura.io'),
  indiaGh('CleverTap', 'clevertap', 'https://clevertap.com'),
  indiaGh('InMobi', 'inmobi', 'https://inmobi.com'),
  indiaGh('HackerRank', 'hackerrank', 'https://hackerrank.com'),
  indiaGh('Rubrik', 'rubrik', 'https://rubrik.com'),
  indiaGh('Prodigal', 'prodigal', 'https://prodigaltech.com'),
  indiaGh('DevRev', 'devrev', 'https://devrev.ai'),
  indiaGh('Headout', 'headoutcareers', 'https://headout.com'),
  indiaGh('Harness', 'harnessinc', 'https://harness.io'),
  indiaGh('6sense', '6sense', 'https://6sense.com'),
  indiaGh('Chargebee', 'chargebee', 'https://chargebee.com'),
  indiaGh('Postman', 'postman', 'https://postman.com'),
  indiaGh('Freshworks', 'freshworks', 'https://freshworks.com'),
  indiaGh('Suki AI', 'suki', 'https://suki.ai'),
  indiaGh('Observe.AI', 'observeai', 'https://observe.ai'),
  indiaGh('Whatfix', 'whatfix', 'https://whatfix.com'),
  indiaGh('GreyOrange', 'greyorange', 'https://greyorange.com'),
  indiaGh('Fractal', 'fractal', 'https://fractal.ai'),
  indiaGh('ThoughtSpot', 'thoughtspot', 'https://thoughtspot.com'),
  indiaGh('Nutanix', 'nutanix', 'https://nutanix.com'),
  indiaGh('Sprinklr', 'sprinklr', 'https://sprinklr.com'),
  indiaGh('Smallcase', 'smallcase', 'https://smallcase.com'),
  indiaGh('Policybazaar', 'policybazaar', 'https://policybazaar.com'),
  indiaGh('Swiggy', 'swiggy', 'https://swiggy.com'),
  indiaGh('Zomato', 'zomato', 'https://zomato.com'),
  indiaGh('Dream11', 'dream11', 'https://dream11.com'),
  indiaGh('Delhivery', 'delhivery', 'https://delhivery.com'),
  indiaGh('Nykaa', 'nykaa', 'https://nykaa.com'),
  indiaGh('Paytm', 'paytm', 'https://paytm.com'),
  indiaGh('Ola', 'ola', 'https://olacabs.com'),
  indiaGh('Flipkart', 'flipkart', 'https://flipkart.com'),
  indiaGh('MakeMyTrip', 'makemytrip', 'https://makemytrip.com'),
  indiaGh('BharatPe', 'bharatpe', 'https://bharatpe.com'),
  indiaGh('Spinny', 'spinny', 'https://spinny.com'),
  indiaGh('Porter', 'porter', 'https://porter.in'),
  indiaGh('Rapido', 'rapido', 'https://rapido.bike'),
  indiaGh('CoinSwitch', 'coinswitch', 'https://coinswitch.co'),
  indiaGh('Licious', 'licious', 'https://licious.in'),
  indiaGh('Curefit', 'curefit', 'https://cure.fit'),
  indiaGh('Unacademy', 'unacademy', 'https://unacademy.com'),
  indiaGh('Upstox', 'upstox', 'https://upstox.com'),
  indiaGh('Jupiter', 'jupiter', 'https://jupiter.money'),
  indiaGh('Fi Money', 'fi', 'https://fi.money'),
  indiaGh('Ather Energy', 'atherenergy', 'https://atherenergy.com'),

  // ── Lever (India startups) ──
  indiaLever('Zepto', 'zepto', 'https://zeptonow.com'),
  indiaLever('CRED', 'cred', 'https://cred.club'),
  indiaLever('Urban Company', 'urbancompany', 'https://urbancompany.com'),
  indiaLever('ShareChat', 'sharechat', 'https://sharechat.com'),
  indiaLever('Slice', 'sliceit', 'https://sliceit.com'),
  indiaLever('Meesho', 'meesho', 'https://meesho.io'),
  indiaLever('Groww', 'groww', 'https://groww.in'),
  indiaLever('Dunzo', 'dunzo', 'https://dunzo.com'),
  indiaLever('DealShare', 'dealshare', 'https://dealshare.in'),
  indiaLever('Beatoven.ai', 'beatoven', 'https://beatoven.ai'),
  indiaLever('Rapido', 'rapido', 'https://rapido.bike'),
  indiaLever('Porter', 'porter', 'https://porter.in'),
  indiaLever('Spinny', 'spinny', 'https://spinny.com'),
  indiaLever('Smallcase', 'smallcase', 'https://smallcase.com'),
  indiaLever('BharatPe', 'bharatpe', 'https://bharatpe.com'),
  indiaLever('Ola', 'ola', 'https://olacabs.com'),
  indiaLever('Razorpay', 'razorpay', 'https://razorpay.com'),
  indiaLever('InMobi', 'inmobi', 'https://inmobi.com'),
  indiaLever('Postman', 'postman', 'https://postman.com'),
  indiaLever('BrowserStack', 'browserstack', 'https://browserstack.com'),

  // ── Ashby (India startups) ──
  indiaAshby('Devfolio', 'devfolio', 'https://devfolio.co'),
  indiaAshby('Polygon', 'polygontechnology', 'https://polygon.technology'),
  indiaAshby('Lenskart', 'lenskart', 'https://lenskart.com'),
  indiaAshby('FamPay', 'fam', 'https://famapp.in'),
  indiaAshby('Loco', 'loco', 'https://loco.gg'),
  indiaAshby('Leap Wallet', 'leapwallet', 'https://leapwallet.io'),
  indiaAshby('Zolve', 'zolve', 'https://zolve.com'),
  indiaAshby('Settle', 'settle', 'https://settle.club'),
  indiaAshby('Hyperface', 'hyperface', 'https://hyperface.co'),
  indiaAshby('Kazam', 'kazam', 'https://kazam.in'),
  indiaAshby('SleepyCat', 'sleepycat', 'https://sleepycat.in'),
  indiaAshby('Pyor', 'pyor', 'https://pyor.xyz'),
  indiaAshby('BharatX', 'bharatx', 'https://bharatx.tech'),
  indiaAshby('Jar', 'jar', 'https://jar.app'),
  indiaAshby('Open', 'open', 'https://open.money'),
];

export function getIndianAtsBoards(): ScrapeBoard[] {
  return dedupeBoardsByCompanyName(
    INDIAN_ATS_BOARDS.filter((board) => board.enabled !== false)
  );
}

export function getIndianAtsBoardCount(): number {
  return getIndianAtsBoards().length;
}

export function getIndianAtsBoardsByProvider(
  provider: ScrapeBoard['provider']
): ScrapeBoard[] {
  return getIndianAtsBoards().filter((board) => board.provider === provider);
}
