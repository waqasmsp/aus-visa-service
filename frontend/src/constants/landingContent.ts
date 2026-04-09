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
    title: 'Find your [[perfect]] Australian visa in minutes',
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
    title: 'Easy Process',
    steps: [
      { title: 'Tell us your profile', description: 'Share your country, purpose, and timeline.' },
      { title: 'Get visa options', description: 'Receive matched visa pathways instantly.' },
      { title: 'Apply with confidence', description: 'Follow a guided checklist and submit.' }
    ]
  },
  testimonials: {
    title: 'What our clients say',
    items: [
      {
        name: 'Olivia M.',
        quote:
          'I found the right skilled visa pathway quickly and the whole journey felt surprisingly simple.'
      },
      {
        name: 'Daniel T.',
        quote: 'The guided steps saved me hours of confusion. I always knew what to do next.'
      }
    ]
  },
  footer: {
    columns: [
      { heading: 'Company', links: ['About', 'Careers', 'Partners'] },
      { heading: 'Visa Services', links: ['Work Visa', 'Student Visa', 'Visitor Visa'] },
      { heading: 'Resources', links: ['Blog', 'Help Center', 'Contact'] }
    ],
    socialLinks: ['Website', 'Email', 'Community'],
    copyright: `© ${new Date().getFullYear()} AUS Visa Service. All rights reserved.`
  }
};
