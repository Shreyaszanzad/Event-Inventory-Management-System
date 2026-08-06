export const CITIES = [
  { id: 'mumbai',  name: 'Mumbai', icon: '🏙️', popular: true },
  { id: 'pune',    name: 'Pune',   icon: '🎓', popular: true },
  { id: 'nagpur',  name: 'Nagpur', icon: '🍊', popular: true },
];

export const CATEGORIES = [
  { id: 'music', name: 'Music Concerts', icon: '🎵', count: '45+ Events', color: '#722ed1', bg: '#f9f0ff' },
  { id: 'comedy', name: 'Standup Comedy', icon: '🎙️', count: '32+ Shows', color: '#eb2f96', bg: '#fff0f6' },
  { id: 'sports', name: 'Sports & Matches', icon: '⚽', count: '18+ Matches', color: '#52c41a', bg: '#f6ffed' },
  { id: 'workshops', name: 'Workshops & Expo', icon: '🎨', count: '28+ Sessions', color: '#fa8c16', bg: '#fff7e6' },
  { id: 'theatre', name: 'Theatre & Drama', icon: '🎭', count: '14+ Plays', color: '#13c2c2', bg: '#e6fffb' },
  { id: 'nightlife', name: 'Parties & DJ Nights', icon: '🍸', count: '50+ Parties', color: '#f5222d', bg: '#fff1f0' },
];

export const MOCK_USER_PROFILE = {
  name: 'Rahul Sharma',
  email: 'rahul.sharma@example.com',
  mobile: '9876543210',
  city: 'Mumbai',
  memberSince: 'January 2024',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
};

export const MOCK_BOOKINGS = [
  {
    bookingId: 'EVT-BK-2026-98421',
    eventId: 'evt-101',
    eventTitle: 'Arijit Singh Symphony Night 2026',
    categoryName: 'Music Concert',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    date: '12 AUG 2026',
    time: '07:00 PM',
    venue: 'Jio World Garden, BKC',
    cityName: 'Mumbai',
    status: 'Confirmed',
    statusColor: 'green',
    totalTickets: 2,
    grandTotal: 2358,
    paymentMethod: 'UPI (Google Pay)',
    bookingDate: '28 JUL 2026, 04:30 PM',
    selectedTiers: [{ name: 'Silver Pass (General)', count: 2, price: 999 }]
  },
  {
    bookingId: 'EVT-BK-2026-45120',
    eventId: 'evt-102',
    eventTitle: 'Zakir Khan - Papa Bolte Hain Tour',
    categoryName: 'Standup Comedy',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    date: '18 AUG 2026',
    time: '06:30 PM',
    venue: 'Kedar Nath Sahani Auditorium',
    cityName: 'Delhi-NCR',
    status: 'Confirmed',
    statusColor: 'green',
    totalTickets: 1,
    grandTotal: 1228,
    paymentMethod: 'Credit Card (HDFC)',
    bookingDate: '20 JUL 2026, 09:15 AM',
    selectedTiers: [{ name: 'Gold VIP Pass', count: 1, price: 999 }]
  },
  {
    bookingId: 'EVT-BK-2025-11048',
    eventId: 'evt-105',
    eventTitle: 'The Phantom Musical Drama',
    categoryName: 'Theatre & Drama',
    image: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=800&q=80',
    date: '10 MAY 2025',
    time: '08:00 PM',
    venue: 'Nita Mukesh Ambani Cultural Centre',
    cityName: 'Mumbai',
    status: 'Completed',
    statusColor: 'blue',
    totalTickets: 2,
    grandTotal: 2950,
    paymentMethod: 'NetBanking (ICICI)',
    bookingDate: '02 MAY 2025, 02:00 PM',
    selectedTiers: [{ name: 'Silver Pass', count: 2, price: 1250 }]
  }
];

export const TICKET_TIERS = [
  {
    id: 'tier-silver',
    name: 'Silver Pass (General Admission)',
    price: 999,
    originalPrice: 1299,
    availableSeats: 45,
    tag: 'Standard',
    tagColor: 'blue',
    features: ['Standing Access in Main Arena', 'General Entry Gate Access', 'Standard Food & Beverage Stalls']
  },
  {
    id: 'tier-gold',
    name: 'Gold VIP Pass',
    price: 1999,
    originalPrice: 2499,
    availableSeats: 18,
    tag: 'Most Popular',
    tagColor: 'gold',
    features: ['VIP Fanpit Area (Direct Front View)', 'Fast-Track Express Security Entry', '1 Complimentary Welcome Drink Voucher']
  },
  {
    id: 'tier-platinum',
    name: 'Platinum Lounge Pass',
    price: 3499,
    originalPrice: 4200,
    availableSeats: 6,
    tag: 'Exclusive',
    tagColor: 'purple',
    features: ['Front Row Premium Air-Conditioned Seating', 'Unlimited Gourmet Snacks & Cocktails', 'Dedicated Valet Parking & Meet & Greet Pass']
  }
];

export const HERO_BANNERS = [
  {
    id: 1,
    title: 'Sunburn Arena Live 2026',
    subtitle: 'Featuring International Headliners & Immersive Visuals',
    category: 'Music Concert',
    date: 'SAT, 15 AUG 2026',
    venue: 'Jawaharlal Nehru Stadium, Delhi',
    price: '₹1,499 onwards',
    bgGradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    tag: 'SELLING FAST'
  },
  {
    id: 2,
    title: 'Laugh Out Loud - All Stars',
    subtitle: 'India\'s Top Standup Comedians Live On Stage',
    category: 'Comedy',
    date: 'SUN, 23 AUG 2026',
    venue: 'NCPA, Nariman Point, Mumbai',
    price: '₹799 onwards',
    bgGradient: 'linear-gradient(135deg, #e11d48 0%, #f97316 100%)',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80',
    tag: 'EXCLUSIVE'
  },
  {
    id: 3,
    title: 'Tech Summit & Startup Expo',
    subtitle: 'Network with 5,000+ Founders, VCs, and Innovators',
    category: 'Workshops',
    date: 'FRI, 04 SEP 2026',
    venue: 'BIEC, Bengaluru',
    price: '₹2,999 onwards',
    bgGradient: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    tag: 'FEATURED'
  }
];

export const EVENTS = [
  {
    id: 'evt-101',
    title: 'Arijit Singh Symphony Night 2026',
    category: 'music',
    categoryName: 'Music Concert',
    city: 'mumbai',
    cityName: 'Mumbai',
    date: '2026-08-12',
    dateFormatted: '12 AUG 2026',
    time: '07:00 PM',
    venue: 'Jio World Garden',
    venueAddress: 'Plot No C-64, G Block, BKC, Bandra East, Mumbai, Maharashtra 400051',
    price: 1999,
    originalPrice: 2499,
    rating: 4.9,
    reviewsCount: 1240,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    tag: 'Trending',
    tagColor: '#722ed1',
    isFeatured: true,
    description: 'Experience an unforgettable evening as India\'s premier playback singer Arijit Singh performs live with a 45-piece grand orchestra. Hear hits like Tum Hi Ho, Channa Mereya, Apna Bana Le, and Kesariya re-imagined with spectacular symphonic arrangements and world-class laser light production.',
    organizer: {
      name: 'Sunburn & Percept Live Entertainment',
      logo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
      eventsCount: 84,
      verified: true
    },
    shows: [
      { id: 's1', date: '12 AUG 2026', time: '04:00 PM', status: 'Available', seatsLeft: 120, venue: 'Jio World Garden, BKC' },
      { id: 's2', date: '12 AUG 2026', time: '07:30 PM', status: 'Fast Filling', seatsLeft: 14, venue: 'Jio World Garden, BKC' },
      { id: 's3', date: '13 AUG 2026', time: '07:00 PM', status: 'Available', seatsLeft: 85, venue: 'Jio World Garden, BKC' }
    ],
    terms: [
      'Tickets are non-refundable once booked.',
      'Age Limit: 5+ years. Children above 5 require a full ticket.',
      'Gates open 2 hours prior to showtime.',
      'Outside food, beverages, and cameras are strictly prohibited.'
    ]
  },
  {
    id: 'evt-102',
    title: 'Zakir Khan - Papa Bolte Hain Tour',
    category: 'comedy',
    categoryName: 'Standup Comedy',
    city: 'delhi',
    cityName: 'Delhi-NCR',
    date: '2026-08-18',
    dateFormatted: '18 AUG 2026',
    time: '06:30 PM',
    venue: 'Kedar Nath Sahani Auditorium',
    venueAddress: 'Press Road, Minto Road, Civic Centre, New Delhi 110002',
    price: 999,
    originalPrice: 1299,
    rating: 4.8,
    reviewsCount: 890,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    tag: 'Almost Full',
    tagColor: '#f5222d',
    isFeatured: true,
    description: 'The Sakht Launda returns with his brand-new 90-minute solo standup show "Papa Bolte Hain". Unraveling hilarious stories of Indian households, middle-class aspirations, father-son dynamics, and heartbreak with Zakir\'s signature charm.',
    organizer: {
      name: 'OML Comedy Network',
      logo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      eventsCount: 140,
      verified: true
    },
    shows: [
      { id: 's1', date: '18 AUG 2026', time: '06:30 PM', status: 'Fast Filling', seatsLeft: 8, venue: 'Kedar Nath Sahani Auditorium' },
      { id: 's2', date: '18 AUG 2026', time: '09:00 PM', status: 'Available', seatsLeft: 45, venue: 'Kedar Nath Sahani Auditorium' }
    ],
    terms: [
      'Show language: Hindi.',
      'Age Limit: 16+ years.',
      'No entry permitted after 15 minutes of show start.'
    ]
  },
  {
    id: 'evt-103',
    title: 'Grand Champions T20 Derby Finals',
    category: 'sports',
    categoryName: 'Sports & Matches',
    city: 'bengaluru',
    cityName: 'Bengaluru',
    date: '2026-08-22',
    dateFormatted: '22 AUG 2026',
    time: '04:00 PM',
    venue: 'M. Chinnaswamy Stadium',
    venueAddress: 'MG Road, Bengaluru, Karnataka 560001',
    price: 1499,
    originalPrice: 1800,
    rating: 4.9,
    reviewsCount: 3100,
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    tag: 'Hot Deal',
    tagColor: '#fa8c16',
    isFeatured: true,
    description: 'Witness the high-octane championship final match live under lights! Top international stars battle out for the coveted T20 Trophy. Experience electrifying atmosphere, DJ music, cheerleader performances, and VIP hospitality boxes.',
    organizer: {
      name: 'Karnataka Sports Alliance',
      logo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
      eventsCount: 32,
      verified: true
    },
    shows: [
      { id: 's1', date: '22 AUG 2026', time: '04:00 PM', status: 'Available', seatsLeft: 450, venue: 'M. Chinnaswamy Stadium' }
    ],
    terms: [
      'Re-entry is not permitted.',
      'Helmets, bags, water bottles prohibited inside stadium premises.'
    ]
  }
];

export const FEATURES = [
  {
    title: 'Instant E-Tickets',
    description: 'Get your QR code tickets instantly on SMS, Email, and WhatsApp.',
    icon: '⚡'
  },
  {
    title: '100% Verified Sellers',
    description: 'Guaranteed entry with verified venue pass validation.',
    icon: '🛡️'
  },
  {
    title: 'Easy Cancellation',
    description: 'Hassle-free 100% refund policy for eligible events.',
    icon: '🔄'
  },
  {
    title: '24/7 Priority Support',
    description: 'Dedicated customer helpline for smooth booking experience.',
    icon: '💬'
  }
];
