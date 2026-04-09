export type CountryOption = {
  code: string;
  name: string;
  flagCode?: string;
};

export type VisaTypeOption = {
  code: string;
  name: string;
};

export const landingContent = {
  brandName: 'Global Visas',
  navItems: ['Home', 'Visa Services', 'Blogs', 'About Us', 'Contact Us'],
  loginCta: 'Login',
  hero: {
    title: '[[Fastest|Quickest|Swiftest|Speediest]] Way to Get Your Australian Travel Visa in Minutes',
    subtitle:
      'Compare pathways and get a guided process tailored to your travel, study, or migration goals.',
    originCountryLabel: 'I am from',
    destinationCountryLabel: 'I want to go to',
    visaTypeLabel: 'Visa Type',
    originCountryOptions: [
      { code: 'US', name: 'United States', flagCode: 'US' },
      { code: 'IN', name: 'India', flagCode: 'IN' },
      { code: 'GB', name: 'United Kingdom', flagCode: 'GB' },
      { code: 'CA', name: 'Canada', flagCode: 'CA' }
    ] satisfies CountryOption[],
    destinationCountryOptions: [
      { code: 'AU', name: 'Australia', flagCode: 'AU' },
      { code: 'NZ', name: 'New Zealand', flagCode: 'NZ' },
      { code: 'SG', name: 'Singapore', flagCode: 'SG' },
      { code: 'AE', name: 'United Arab Emirates', flagCode: 'AE' }
    ] satisfies CountryOption[],
    visaTypeOptions: [
      { code: 'visitor', name: 'Visitor Visa' },
      { code: 'business', name: 'Business Visa' },
      { code: 'transit', name: 'Transit Visa' },
      { code: 'student', name: 'Student Visa' },
      { code: 'work', name: 'Work Visa' }
    ] satisfies VisaTypeOption[],
    primaryCta: 'Find My Visa',
    illustrationAlt: 'Illustrated travel planning cards and paper plane.'
  },
  comparison: {
    title: 'Why millions of travelers choose us',
    leftTitle: 'Do it yourself',
    leftPoints: ['Long government application forms', 'Confusing questions that can delay approvals', 'No real support when you get stuck', 'Progress may be lost if you leave mid-way', 'Limited and less secure payment options'],
    rightTitle: 'With us',
    rightPoints: ['Quick, guided applications', 'Clear questions reviewed by experts', '24/7 support on chat, email, and WhatsApp', 'Progress auto-saved so you can return anytime', 'Multiple secure ways to pay']
  },
  stats: [
    { label: 'Success Rate', value: '99%' },
    { label: 'Years Experience', value: '12+' },
    { label: 'Support', value: '24/7' },
    { label: 'Visas Processed', value: '200+' }
  ],
  process: {
    title: 'Our easy process',
    steps: [
      { title: 'Tell us your profile', description: 'Share your country, purpose, and timeline.' },
      { title: 'Get visa options', description: 'Receive matched visa pathways instantly.' },
      { title: 'Apply with confidence', description: 'Follow a guided checklist and submit.' }
    ]
  },
  testimonials: {
    title: 'Over 50,000 positive reviews',
    items: [
      {
        name: 'Christine Pain Wood',
        quote:
          'The process was quick and easy to understand. There were many opportunities to correct errors, and technology made everything much more efficient.'
      },
      {
        name: 'Laiha Aidiepemily',
        quote:
          'Faster than expected. I got my result in less than 24 hours. Processing is simple, smooth, and easy. I highly recommend their service.'
      },
      {
        name: 'Michael John Beavis',
        quote:
          'Your patience and understanding of my visa application were exceptional, and I received a positive result. Excellent job. Thank you very much.'
      },
      {
        name: 'Samantha Rivera',
        quote:
          'The step-by-step guidance removed all stress. The support team answered quickly and checked every detail before submission.'
      },
      {
        name: 'Arjun Patel',
        quote:
          'From visa matching to submission, everything felt organized and transparent. I always knew what was next and why it mattered.'
      }
    ]
  },
  newsletter: {
    title: 'Travel smarter, explore further!',
    description: "Subscribe now for the latest visa updates, travel tips, and exclusive deals you won't want to miss.",
    emailPlaceholder: 'Enter your email',
    ctaLabel: 'Sign me up'
  },
  footer: {
    tagline: 'Unlock the world with smarter, faster visa support.',
    visaRoutes: [
      'United States to United Kingdom',
      'France to United Kingdom',
      'Germany to United Kingdom',
      'United States to India',
      'Canada to United Kingdom',
      'United States to Philippines',
      'Australia to India',
      'United States to New Zealand',
      'Netherlands to United Kingdom',
      'Italy to United Kingdom'
    ],
    visaNews: [
      'UK visa and immigration fees rise from April 2026',
      'EU Entry/Exit system fully operational on April 10',
      'Egypt makes transit visa mandatory for Bangladeshis',
      'Armenia visa exemption for US, EU, and Gulf residents',
      'Mozambique launches new eVisa and ETA platform'
    ],
    blogs: [
      'Real stories: 5 trips saved at the last minute',
      'iVisa vs government sites: understanding the fee gap',
      'Visa mistakes that can ruin your holiday plans',
      'ETIAS Europe: how to apply for 2026 authorization'
    ],
    companyLinks: [
      'About Us',
      'Careers',
      'Contact Us',
      'Help Center',
      'Refer a Friend',
      'Testimonials',
      'Blog',
      'Press',
      'Visa News',
      'Affiliates and Partnerships'
    ],
    socialLinks: ['Instagram', 'LinkedIn', 'YouTube', 'Facebook'],
    copyright: `(c) ${new Date().getFullYear()} AUS Visa Service. All rights reserved.`
  }
};
