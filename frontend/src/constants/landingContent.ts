export const landingContent = {
  brandName: 'AUS Visa Service',
  navItems: ['Home', 'Visa Services', 'Blogs', 'About Us', 'Contact Us'],
  loginCta: 'Login',
  hero: {
    title: 'Find your [[perfect]] Australian visa in minutes',
    subtitle:
      'Compare pathways and get a guided process tailored to your travel, study, or migration goals.',
    selectOneLabel: 'I am from',
    selectTwoLabel: 'I want to',
    selectOneOptions: ['United States', 'India', 'United Kingdom', 'Canada'],
    selectTwoOptions: ['Work in Australia', 'Study in Australia', 'Visit Australia', 'Join family'],
    primaryCta: 'Find My Visa',
    illustrationAlt: 'Illustrated travel planning cards and paper plane.'
  },
  comparison: {
    title: 'Why people choose us over doing it yourself',
    leftTitle: 'Do it yourself',
    leftPoints: ['Research everything alone', 'Higher chance of missing details', 'Longer and confusing process'],
    rightTitle: 'With us',
    rightPoints: ['Guided visa matching', 'Expert-reviewed process', 'Faster, clearer, stress-free support']
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
