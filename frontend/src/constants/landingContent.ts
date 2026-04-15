export type CountryOption = {
  code: string;
  name: string;
  flagCode?: string;
};

export type VisaTypeOption = {
  code: string;
  name: string;
};

type ServiceCatalogCard = {
  label: string;
  title: string;
  description: string;
  variant: 'one' | 'two' | 'three';
  href: string;
};

export const landingContent = {
  brandName: 'Global Visas',
  navItems: ['Home', 'Visa Services', 'Pricing', 'Blogs', 'About Us', 'Contact Us'],
  loginCta: 'Apply Now',
  hero: {
    title: '[[Fastest|Simplest|Quickest]] Way to Get Your Australian Travel Visa in Minutes',
    subtitle:
      'Compare pathways and get a guided process tailored to your travel, study, or migration goals.',
    originCountryLabel: 'I am from',
    destinationCountryLabel: 'I want to go to',
    visaTypeLabel: 'Visa Type',
    originCountryOptions: [
      { code: 'AD', name: 'Andorra', flagCode: 'AD' },
      { code: 'AT', name: 'Austria', flagCode: 'AT' },
      { code: 'BE', name: 'Belgium', flagCode: 'BE' },
      { code: 'BN', name: 'Brunei', flagCode: 'BN' },
      { code: 'CA', name: 'Canada', flagCode: 'CA' },
      { code: 'DK', name: 'Denmark', flagCode: 'DK' },
      { code: 'FI', name: 'Finland', flagCode: 'FI' },
      { code: 'FR', name: 'France', flagCode: 'FR' },
      { code: 'DE', name: 'Germany', flagCode: 'DE' },
      { code: 'GR', name: 'Greece', flagCode: 'GR' },
      { code: 'HK', name: 'Hong Kong (SAR of China)', flagCode: 'HK' },
      { code: 'IS', name: 'Iceland', flagCode: 'IS' },
      { code: 'IE', name: 'Ireland', flagCode: 'IE' },
      { code: 'IT', name: 'Italy', flagCode: 'IT' },
      { code: 'JP', name: 'Japan', flagCode: 'JP' },
      { code: 'LI', name: 'Liechtenstein', flagCode: 'LI' },
      { code: 'LU', name: 'Luxembourg', flagCode: 'LU' },
      { code: 'MY', name: 'Malaysia', flagCode: 'MY' },
      { code: 'MT', name: 'Malta', flagCode: 'MT' },
      { code: 'MC', name: 'Monaco', flagCode: 'MC' },
      { code: 'NO', name: 'Norway', flagCode: 'NO' },
      { code: 'PT', name: 'Portugal', flagCode: 'PT' },
      { code: 'SM', name: 'Republic of San Marino', flagCode: 'SM' },
      { code: 'SG', name: 'Singapore', flagCode: 'SG' },
      { code: 'KR', name: 'South Korea', flagCode: 'KR' },
      { code: 'ES', name: 'Spain', flagCode: 'ES' },
      { code: 'SE', name: 'Sweden', flagCode: 'SE' },
      { code: 'CH', name: 'Switzerland', flagCode: 'CH' },
      { code: 'GB', name: 'United Kingdom', flagCode: 'GB' },
      { code: 'US', name: 'United States of America', flagCode: 'US' }
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
    primaryCta: 'Start Application',
    illustrationAlt: 'Smiling U.S. traveler holding passport and visa documents while reviewing an Australian visa application.'
  },
  comparison: {
    title: 'Why millions of travelers choose us',
    leftTitle: 'Do it yourself',
    leftPoints: ['Long government application forms', 'Confusing questions that can delay approvals', 'No real support when you get stuck', 'Progress may be lost if you leave mid-way', 'Limited and less secure payment options'],
    rightTitle: 'With us',
    rightPoints: ['Quick, guided applications', 'Clear questions reviewed by experts', '24/7 support on chat, email, and WhatsApp', 'Progress auto-saved so you can return anytime', 'Multiple secure ways to pay']
  },
  features: {
    eyebrow: '',
    title: 'Our Features',
    items: [
      {
        title: 'Quality Visa Services',
        description:
          'Global Visas provides professionally structured visitor visa services, ensuring each application clearly reflects genuine travel intent and complete documentation.'
      },
      {
        title: 'Professional & Expert Team',
        description:
          'Our team works with a document-first, compliance-focused approach, reviewing every detail to reduce errors and improve application strength.'
      },
      {
        title: 'Client Satisfaction Focused',
        description:
          'We prioritise transparency, timely communication, and clear next steps, so you always know where your application stands.'
      }
    ]
  },
  serviceCatalog: {
    eyebrow: 'OUR SERVICES',
    title: 'Choose Your Required Services from our list',
    intro:
      "Australia offers several types of visitor visas under the subclass 600 and other visa subclasses, depending on the traveler's nationality, reason for visit, and duration of stay. Below are the main types:",
    cards: [
      {
        label: 'SERVICE 1',
        title: 'eVisitor Visa - Subclass 651',
        description: 'Best for eligible passport holders making short tourist or business trips to Australia.',
        variant: 'one',
        href: '/visa/evisitor-visa-subclass-651'
      },
      {
        label: 'SERVICE 2',
        title: 'Visitor Visa under the subclass 600',
        description: 'Flexible pathway for tourism, business visitor activity, or family visits with broader eligibility.',
        variant: 'two',
        href: '/visa/visitor-visa-subclass-600'
      },
      {
        label: 'SERVICE 3',
        title: 'Electronic Travel Authority (ETA) - Subclass 601',
        description: 'Suitable for eligible passport holders travelling to Australia for short tourism or business visits.',
        variant: 'three',
        href: '/visa/electronic-travel-authority-eta-subclass-601'
      }
    ] satisfies ServiceCatalogCard[]
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
      'United States to Australia',
      'France to Australia',
      'Germany to Australia',
      'India to Australia',
      'Canada to Australia',
      'Philippines to Australia',
      'New Zealand to Australia',
      'Netherlands to Australia',
      'Italy to Australia',
      'United Kingdom to Australia'
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
      { label: 'About Us', href: '/about-us' },
      { label: 'Visa Services', href: '/visa-services' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Contact Us', href: '/contact-us' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms and Conditions', href: '/terms-and-conditions' },
      { label: 'Careers', href: '#' },
      { label: 'Help Center', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Press', href: '#' }
    ],
    socialLinks: ['Instagram', 'LinkedIn', 'YouTube', 'Facebook'],
    copyright: `(c) ${new Date().getFullYear()} AUS Visa Service. All rights reserved.`
  }
};
