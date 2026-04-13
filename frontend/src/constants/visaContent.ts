export type VisaNavItem = {
  title: string;
  href: string;
  summary: string;
  imageVariant: 'one' | 'two' | 'three' | 'four';
};

export type VisaPageContent = {
  title: string;
  intro: string;
  countryColumns?: string[][];
  bullets?: string[];
  streams?: { heading: string; points: string[] }[];
  table?: { headers: string[]; rows: string[][] };
};

export const visaNavItems: VisaNavItem[] = [
  {
    title: 'Visitor Visa (Subclass 600)',
    href: '/visa/visitor-visa-subclass-600',
    summary:
      'Designed for tourism, family visits, and short business travel with multiple streams and flexible stay durations.',
    imageVariant: 'one'
  },
  {
    title: 'Electronic Travel Authority (ETA) – Subclass 601',
    href: '/visa/electronic-travel-authority-eta-subclass-601',
    summary: 'Fast digital visa option for eligible passport holders who need short tourism or business trips to Australia.',
    imageVariant: 'two'
  },
  {
    title: 'eVisitor Visa – Subclass 651',
    href: '/visa/evisitor-visa-subclass-651',
    summary: 'No-cost travel authorization for eligible European passport holders with multiple entries across 12 months.',
    imageVariant: 'three'
  },
  {
    title: 'Visitor Visa Streams Comparison (Subclass 600)',
    href: '/visa/visitor-visas-under-the-subclass-600',
    summary:
      'Side-by-side comparison of Subclass 600 tourist, sponsored family, business visitor, and ADS options to help choose faster.',
    imageVariant: 'four'
  }
];

export const visaPages: Record<string, VisaPageContent> = {
  '/visa/visitor-visa-subclass-600': {
    title: 'Visitor Visa (Subclass 600)',
    intro: 'This is the most common visitor visa and includes several streams:',
    streams: [
      {
        heading: 'Tourist Stream (Apply outside Australia or within Australia)',
        points: [
          'For people visiting for holidays, recreation, or to visit family and friends.',
          'Duration: Usually up to 3, 6, or 12 months.',
          'Can be applied for from inside or outside Australia.'
        ]
      },
      {
        heading: 'Sponsored Family Stream',
        points: [
          'For people sponsored by an eligible Australian citizen or permanent resident.',
          'The sponsor may need to provide a security bond.',
          'Extra checks apply to ensure visitor intent and return plans.'
        ]
      },
      {
        heading: 'Business Visitor Stream',
        points: [
          'For short business visits such as meetings, conferences, or negotiations.',
          'Does not allow paid work in Australia.',
          'Usually granted for up to 3 months per entry.'
        ]
      }
    ],
    bullets: ['Applications are assessed case-by-case based on documents and travel intent.']
  },
  '/visa/electronic-travel-authority-eta-subclass-601': {
    title: 'Electronic Travel Authority (ETA) – Subclass 601',
    intro: 'For passport holders from certain countries.',
    countryColumns: [
      ['Andorra', 'Austria', 'Belgium', 'Brunei', 'Canada', 'Denmark', 'Finland', 'France', 'Germany', 'Greece'],
      ['Hong Kong (SAR of China)', 'Iceland', 'Ireland', 'Italy', 'Japan', 'Liechtenstein', 'Luxembourg', 'Malaysia', 'Malta', 'Monaco'],
      ['Norway', 'Portugal', 'Republic of San Marino', 'Singapore', 'South Korea', 'Spain', 'Sweden', 'Switzerland', 'United Kingdom', 'United States of America']
    ],
    bullets: [
      'For tourism or business visitor activities.',
      'Valid for 12 months, allowing multiple entries and stays of up to 3 months each.',
      'Apply digitally and keep passport details up to date before travel.'
    ]
  },
  '/visa/evisitor-visa-subclass-651': {
    title: 'eVisitor Visa – Subclass 651',
    intro: 'For passport holders of the EU and select European countries.',
    countryColumns: [
      ['Andorra', 'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland'],
      ['France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Latvia', 'Liechtenstein', 'Lithuania'],
      ['Luxembourg', 'Malta', 'Monaco', 'The Netherlands', 'Norway', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia']
    ],
    bullets: [
      'Free of charge.',
      'Valid for 12 months, allows multiple entries and 3-month stays.',
      'For tourism or business visitor purposes.'
    ]
  },
  '/visa/visitor-visas-under-the-subclass-600': {
    title: 'Visitor Visa Streams under Subclass 600',
    intro: 'Compare the major streams available under Subclass 600.',
    table: {
      headers: ['Visa Type', 'Purpose', 'Who Can Apply', 'Stay Duration'],
      rows: [
        ['Subclass 600 – Tourist', 'Tourism, visiting family', 'All nationalities', 'Up to 3, 6, or 12 months'],
        [
          'Subclass 600 – Sponsored Family',
          'Visiting family (with sponsor)',
          'All nationalities (with Australian sponsor)',
          'Up to 12 months'
        ],
        ['Subclass 600 – Business Visitor', 'Business meetings and events', 'All nationalities', 'Up to 3 months'],
        ['Subclass 600 – ADS Stream', 'Tour groups from China', 'Citizens of China via approved agents', 'Usually up to 30 days']
      ]
    },
    bullets: ['Choose the stream that best matches your purpose of travel and supporting documents.']
  }
};
