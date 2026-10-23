// -------------------------------------------------------------------
// Site content — every piece of marketing copy lives here so the pages
// stay readable and the wording can be edited in a single place.
// -------------------------------------------------------------------
// Images come from Unsplash (free to use) and are loaded straight from
// their CDN, so there is nothing to download or host locally.
// -------------------------------------------------------------------

// -------------------------------------------------------------------
// Brand imagery stored in the project (so it ships with the site).
// -------------------------------------------------------------------
import aboutUsImg from "../assets/about-us.jpg";
import expressDeliveryImg from "../assets/express-delivery.jpg";
import relayPointImg from "../assets/relay-point.jpg";

// Small helper so every image URL is built the same way.
// `w` = width in px, `h` = optional height (the photo is cropped).
export const img = (id, w = 1200, h = 800, extra = "") =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=70${extra}`;

// -------------------------------------------------------------------
// Brand + contact details
// -------------------------------------------------------------------
export const BRAND = {
  name: "SwiftTrack",
  legalName: "SwiftTrack Logistics Inc.",
  tagline: "Global parcel tracking across the US, Europe and Asia",
  email: "support@swifttrack.com",
  phone: "+1 (212) 555-0142",
  phoneHref: "+12125550142",
  whatsapp: "+1 (212) 555-0142",
  address: "350 Fifth Avenue, Suite 4200, New York, NY 10118, USA",
  hours: "Every day · 08:00 – 20:00 ET",
  founded: 2014,
};

export const SOCIALS = [
  { name: "Facebook", icon: "facebook", href: "https://facebook.com" },
  { name: "X", icon: "x", href: "https://x.com" },
  { name: "Instagram", icon: "instagram", href: "https://instagram.com" },
  { name: "LinkedIn", icon: "linkedin", href: "https://linkedin.com" },
  { name: "YouTube", icon: "youtube", href: "https://youtube.com" },
];

// -------------------------------------------------------------------
// Navigation (used by the navbar + the footer)
// -------------------------------------------------------------------
export const NAV = {
  track: {
    label: "Track a parcel",
    to: "/track",
  },
  services: {
    label: "Services",
    to: "/services",
    items: [
      {
        to: "/services#express",
        title: "Express delivery",
        text: "Next-day and 48-hour deliveries across the US and Europe.",
      },
      {
        to: "/services#international",
        title: "International shipping",
        text: "Door-to-door to Europe, Asia, the Middle East and beyond.",
      },
      {
        to: "/services#relay",
        title: "Relay points",
        text: "Collect or drop off your parcel at 2,400+ partner shops.",
      },
      {
        to: "/services#freight",
        title: "Freight & cargo",
        text: "Pallets, containers and heavy consignments by road and sea.",
      },
    ],
  },
  pricing: { label: "Rates & pricing", to: "/pricing" },
  relay: { label: "Relay points", to: "/relay-points" },
  company: {
    label: "Company",
    to: "/about",
    items: [
      { to: "/about", title: "About SwiftTrack", text: "Who we are and how we got here." },
      { to: "/about#story", title: "Our story", text: "From one van in Brooklyn to 35 hubs." },
      { to: "/help", title: "Help centre", text: "Guides, customs rules and common questions." },
      { to: "/contact", title: "Contact us", text: "Talk to a human in under 2 minutes." },
    ],
  },
  help: { label: "Help", to: "/help" },
  contact: { label: "Contact", to: "/contact" },
};

// -------------------------------------------------------------------
// Background photography (Unsplash photo ids)
// -------------------------------------------------------------------
export const IMAGES = {
  hero: img("photo-1601584115197-04ecc0da31d7", 1920, 1100),
  heroAlt: img("photo-1586528116311-ad8dd3c8310d", 1920, 1100),
  fleet: img("photo-1586864387967-d02ef85d93e8", 1400, 900),
  warehouse: img("photo-1553413077-190dd305871c", 1400, 900),
  boxes: img("photo-1494412651409-8963ce7935a7", 1400, 900),
  airport: img("photo-1436491865332-7a61a109cc05", 1400, 900),
  port: img("photo-1578575437130-527eed3abbec", 1400, 900),
  shop: img("photo-1441986300917-64674bd600d8", 900, 700),
  supermarket: img("photo-1542838132-92c53300491e", 900, 700),
  team: img("photo-1521737604893-d14cc237f11d", 1200, 800),
  meeting: img("photo-1517048676732-d65bc937f952", 1200, 800),
  analytics: img("photo-1454165804606-c3d57bc86b40", 1200, 800),
  courier: img("photo-1566576912321-d58ddd7a6088", 900, 700),
  road: img("photo-1494412574643-ff11b0a5c1c3", 1200, 800),
  counter: img("photo-1556742049-0cfed4f6a45d", 900, 700),
  aboutUs: aboutUsImg,
  express: expressDeliveryImg,
  relay: relayPointImg,
};

// -------------------------------------------------------------------
// Key numbers (trust bar / stats band)
// -------------------------------------------------------------------
export const STATS = [
  { value: "1.2M+", label: "Parcels tracked", hint: "since 2014" },
  { value: "180+", label: "Countries served", hint: "across 6 continents" },
  { value: "2,400+", label: "Relay points", hint: "partner shops" },
  { value: "98.6%", label: "On-time delivery", hint: "last 12 months" },
];

export const TRUST_POINTS = [
  {
    icon: "shield",
    title: "Every parcel insured",
    text: "Up to $10,000 per shipment, included as standard.",
  },
  {
    icon: "bolt",
    title: "Live GPS updates",
    text: "Scans are pushed to your tracking page the moment they happen.",
  },
  {
    icon: "globe",
    title: "Customs handled",
    text: "We pre-clear documents for the US, EU and Asia so your parcel never gets stuck.",
  },
  {
    icon: "headset",
    title: "Real humans, 7 days",
    text: "A multilingual support team (English, Spanish, French and German) answers in minutes.",
  },
];

// -------------------------------------------------------------------
// Services (cards on the home page + the services page)
// -------------------------------------------------------------------
export const SERVICES = [
  {
    id: "express",
    icon: "bolt",
    title: "Express delivery",
    text: "Priority air and road transport for parcels that cannot wait.",
    points: ["Next working day in 40+ metro areas", "48-hour nationwide delivery", "Signature on delivery"],
    image: IMAGES.express,
  },
  {
    id: "international",
    icon: "globe",
    title: "International shipping",
    text: "Door-to-door shipping to Europe, Asia, the Middle East and Latin America.",
    points: ["Air freight from 3 to 5 days", "Door-to-door or relay point", "DDP — duties included"],
    image: IMAGES.airport,
  },
  {
    id: "relay",
    icon: "pin",
    title: "Relay points",
    text: "Pick up or drop off at more than 2,400 partner shops near you.",
    points: ["Open 7 days a week", "Card, contactless or cash", "Live opening hours"],
    image: IMAGES.relay,
  },
  {
    id: "freight",
    icon: "box",
    title: "Freight & cargo",
    text: "Pallets, crates and full containers moved by road, sea and air.",
    points: ["Up to 26 tonnes per pallet", "Container loading & unloading", "Cargo insurance"],
    image: IMAGES.port,
  },
  {
    id: "ecommerce",
    icon: "cart",
    title: "E-commerce logistics",
    text: "A fulfilment partner for online shops selling across the US, Europe and Asia.",
    points: ["Same-day pick & pack", "Returns handling", "Weekly reconciliation"],
    image: IMAGES.warehouse,
  },
  {
    id: "fulfilment",
    icon: "warehouse",
    title: "Storage & fulfilment",
    text: "Keep your stock in one of our secure, climate-controlled hubs.",
    points: ["Bonded warehousing", "Pick, pack and label", "Stock API integration"],
    image: IMAGES.boxes,
  },
];

// -------------------------------------------------------------------
// How the tracking works (home page)
// -------------------------------------------------------------------
export const STEPS = [
  {
    icon: "search",
    title: "Enter your tracking number",
    text: "Copy the 12-character number from your confirmation email, SMS or receipt.",
  },
  {
    icon: "radar",
    title: "We locate the parcel",
    text: "Our system matches the number to the right carrier and reads its last scan.",
  },
  {
    icon: "route",
    title: "Follow it to your door",
    text: "Watch every step on a live timeline, from pickup to proof of delivery.",
  },
];

// -------------------------------------------------------------------
// Carrier partners (wordmarks are drawn in CSS/SVG, no logo files)
// -------------------------------------------------------------------
export const CARRIERS = [
  { name: "DHL", color: "#d40511", bg: "#ffcc00", tag: "Express" },
  { name: "UPS", color: "#351c15", bg: "#f7b500", tag: "Express" },
  { name: "FedEx", color: "#4d148c", bg: "#ff6600", tag: "Express" },
  { name: "USPS", color: "#004b87", bg: "#ffffff", tag: "Postal" },
  { name: "Royal Mail", color: "#da291c", bg: "#ffd100", tag: "Postal" },
  { name: "GLS", color: "#0b7a3b", bg: "#ffffff", tag: "Road" },
  { name: "DPD", color: "#e30613", bg: "#ffffff", tag: "Road" },
  { name: "Aramex", color: "#0b3d91", bg: "#e30613", tag: "Air" },
];

// -------------------------------------------------------------------
// Countries we ship to (flag emoji + code for the flag CDN)
// -------------------------------------------------------------------
export const COUNTRIES = [
  { code: "us", name: "United States", flag: "🇺🇸", hubs: 10 },
  { code: "ca", name: "Canada", flag: "🇨🇦", hubs: 2 },
  { code: "mx", name: "Mexico", flag: "🇲🇽", hubs: 1 },
  { code: "br", name: "Brazil", flag: "🇧🇷", hubs: 1 },
  { code: "gb", name: "United Kingdom", flag: "🇬🇧", hubs: 4 },
  { code: "de", name: "Germany", flag: "🇩🇪", hubs: 4 },
  { code: "fr", name: "France", flag: "🇫🇷", hubs: 3 },
  { code: "nl", name: "Netherlands", flag: "🇳🇱", hubs: 2 },
  { code: "es", name: "Spain", flag: "🇪🇸", hubs: 2 },
  { code: "cn", name: "China", flag: "🇨🇳", hubs: 2 },
  { code: "jp", name: "Japan", flag: "🇯🇵", hubs: 1 },
  { code: "sg", name: "Singapore", flag: "🇸🇬", hubs: 1 },
  { code: "au", name: "Australia", flag: "🇦🇺", hubs: 1 },
  { code: "ae", name: "United Arab Emirates", flag: "🇦🇪", hubs: 1 },
];

// -------------------------------------------------------------------
// Customer reviews
// -------------------------------------------------------------------
export const TESTIMONIALS = [
  {
    name: "Sophia R.",
    role: "New York",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5,
    text: "I tracked my parcel from New York to Paris in real time. Every scan was there, the customs form even. This is the first site that actually worked for me.",
  },
  {
    name: "Daniel K.",
    role: "London",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5,
    text: "I sell on Instagram and ship every order with SwiftTrack. The relay point in Shoreditch means my customers can pick up on Saturday. Huge win for my business.",
  },
  {
    name: "Priya S.",
    role: "Toronto",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    rating: 4,
    text: "Support answered in English at 21:00 and sorted a delayed parcel in ten minutes. The delay badge warned me before the customer called.",
  },
  {
    name: "Marco B.",
    role: "Milan",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    rating: 5,
    text: "I send fabric rolls to Berlin every week. Weight, dimensions, ETA — all shown before I pay. The admin side is clean and my clients love the tracking page.",
  },
  {
    name: "Nadia B.",
    role: "Brussels",
    avatar: "https://randomuser.me/api/portraits/women/21.jpg",
    rating: 5,
    text: "Shipping from Toronto to Europe used to mean two weeks of guessing. Now I give my customers a link and they follow the parcel themselves.",
  },
  {
    name: "Kenji T.",
    role: "Tokyo",
    avatar: "https://randomuser.me/api/portraits/men/52.jpg",
    rating: 4,
    text: "Door-to-door between Singapore and Tokyo in four days with duties included. Price was better than the courier I used before.",
  },
];

// -------------------------------------------------------------------
// Frequently asked questions (home page + help centre)
// -------------------------------------------------------------------
export const FAQ_HOME = [
  {
    q: "How long does delivery usually take?",
    a: "Local deliveries within the same city usually take 1–2 working days. Domestic shipments take 2–4 working days and international shipments take 5–10 working days depending on customs.",
  },
  {
    q: "My tracking number is not recognised. What should I do?",
    a: "Double-check the number (it looks like TRK000000001) and make sure you copied all 12 characters. If it still fails, the parcel may have just been created — please try again in a few hours.",
  },
  {
    q: "Can I change the delivery address?",
    a: "Yes, as long as the parcel has not been handed to the delivery van yet. Contact our support team with your tracking number and the new address.",
  },
  {
    q: "What happens if delivery fails?",
    a: "Our courier tries again the next working day, or leaves the parcel at the nearest relay point for you to collect. You get a notification with the exact address and opening hours.",
  },
];

export const FAQ_CATEGORIES = [
  {
    id: "tracking",
    title: "Tracking & updates",
    icon: "radar",
    intro: "Everything about following a parcel from pickup to delivery.",
    items: [
      {
        q: "Where do I find my tracking number?",
        a: "It is in your confirmation email and SMS, printed on your receipt, and it starts with TRK followed by 9 letters or digits. It is always 12 characters long.",
      },
      {
        q: "How often is my parcel updated?",
        a: "We publish scans as they happen. Most parcels generate 4 to 7 scans: created, picked up, in transit, sorting centre, out for delivery and delivered.",
      },
      {
        q: "Does tracking work without an account?",
        a: "Yes. The public tracking page needs nothing but the tracking number — no registration, no password, no cookies.",
      },
      {
        q: "The map is not moving, why?",
        a: "Between two scans a parcel is simply in the van. The map only moves when a new scan is recorded, which is what we want you to see: real positions, not fake animation.",
      },
    ],
  },
  {
    id: "shipping",
    title: "Shipping options",
    icon: "box",
    intro: "Choosing the right service for your parcel.",
    items: [
      {
        q: "Which service should I pick?",
        a: "Express for urgent parcels, Standard for the best price, and International for anything crossing a border. The pricing page compares transit times and rates side by side.",
      },
      {
        q: "What is the maximum weight and size?",
        a: "30 kg and 120 × 60 × 60 cm for parcels. Above that we move your shipment as freight, by pallet or container.",
      },
      {
        q: "Do you ship liquids, batteries or food?",
        a: "Yes, with packaging rules. Perfume, aerosols and batteries need specific packaging — our relay points provide the correct boxes for free.",
      },
      {
        q: "Can I pay on delivery?",
        a: "Yes, card or contactless at every relay point in the US and Europe, and card on delivery in most countries.",
      },
    ],
  },
  {
    id: "customs",
    title: "Customs & duties",
    icon: "globe",
    intro: "Documents, taxes and how we clear your parcel.",
    items: [
      {
        q: "Do I have to pay customs?",
        a: "With DDP services, duties and taxes are included in the price — nothing to pay on delivery. With DDU you settle the amount with the courier.",
      },
      {
        q: "Which documents do I need?",
        a: "A copy of the recipient's ID and a proof of purchase (invoice or receipt). For shipments valued over $2,500, a customs declaration signed by the sender.",
      },
      {
        q: "My parcel is held at customs, what now?",
        a: "Open the tracking page — a “Customs hold” notice appears with the exact document we are missing. Send it to support@swifttrack.com and we release the parcel the same day.",
      },
      {
        q: "Are there restricted destinations?",
        a: "We do not ship to territories under international sanctions, and we cannot accept dangerous goods such as fuels, firearms or live animals.",
      },
    ],
  },
  {
    id: "relay",
    title: "Relay points & collection",
    icon: "pin",
    intro: "Collecting, dropping off and paying at partner shops.",
    items: [
      {
        q: "What is a relay point?",
        a: "A partner shop — a supermarket, a post office or a pharmacy — where you can drop off a parcel or collect one that is waiting for you. Opening hours are shown on the map.",
      },
      {
        q: "How long is a parcel kept at a relay point?",
        a: "Ten days. We send you a reminder on day seven, and return the parcel to the sender after the tenth day.",
      },
      {
        q: "Do relay points charge extra?",
        a: "No. Dropping off and collecting are free. If you are paying for the goods on delivery, the relay point collects that amount on behalf of the sender.",
      },
    ],
  },
  {
    id: "billing",
    title: "Billing & refunds",
    icon: "invoice",
    intro: "Invoices, payment methods and what happens when we cannot deliver.",
    items: [
      {
        q: "Which payment methods do you accept?",
        a: "Visa, Mastercard, American Express, PayPal, Apple Pay, bank transfer for business accounts, and cash on delivery in selected regions.",
      },
      {
        q: "How do I get an invoice?",
        a: "Every business account gets a tax invoice by email after each shipment, and a monthly statement you can download from the admin dashboard.",
      },
      {
        q: "My parcel was lost — am I refunded?",
        a: "All parcels are insured up to $10,000. After 30 days without delivery we either resend the parcel or refund you in full, whichever you prefer.",
      },
    ],
  },
];

// -------------------------------------------------------------------
// Rate card used on the pricing page
// -------------------------------------------------------------------
export const RATE_CARDS = [
  {
    id: "standard",
    name: "Standard",
    icon: "box",
    eta: "2 – 4 days",
    price: "$29",
    priceNote: "from 0 – 1 kg",
    best: "Best value for non-urgent parcels",
    features: [
      "Door-to-door delivery",
      "Tracking page for the sender",
      "Insured up to $10,000",
      "Free relay point drop-off",
    ],
    highlight: false,
  },
  {
    id: "express",
    name: "Express",
    icon: "bolt",
    eta: "Next working day",
    price: "$59",
    priceNote: "from 0 – 1 kg",
    best: "Urgent documents and samples",
    features: [
      "Priority handling at every hub",
      "Morning delivery slot",
      "Signature required",
      "Real-time SMS notifications",
    ],
    highlight: true,
  },
  {
    id: "international",
    name: "International",
    icon: "globe",
    eta: "5 – 10 days",
    price: "$89",
    priceNote: "from 0 – 1 kg, DDP",
    best: "Door-to-door Europe, Asia and the Middle East",
    features: [
      "DDP — duties and taxes included",
      "Customs pre-clearance by our team",
      "Tracked at every flight and hub",
      "Return handling included",
    ],
    highlight: false,
  },
];

export const ZONE_PRICES = [
  { zone: "New York → Boston", service: "Express", price: "$45", transit: "24 h" },
  { zone: "New York → Los Angeles", service: "Standard", price: "$39", transit: "3 days" },
  { zone: "Los Angeles → Chicago", service: "Standard", price: "$42", transit: "3 days" },
  { zone: "New York → London", service: "International", price: "$89", transit: "5 days" },
  { zone: "London → Paris", service: "Express", price: "$55", transit: "24 h" },
  { zone: "Rotterdam → Berlin", service: "Standard", price: "$35", transit: "2 days" },
  { zone: "Singapore → Sydney", service: "International", price: "$95", transit: "6 days" },
  { zone: "New York → Tokyo", service: "International", price: "$115", transit: "7 days" },
];

// -------------------------------------------------------------------
// Offices / hubs
// -------------------------------------------------------------------
export const OFFICES = [
  {
    city: "New York",
    role: "Headquarters & main hub",
    address: "350 Fifth Avenue, Suite 4200, New York, NY 10118",
    phone: "+1 (212) 555-0142",
    hours: "Mon – Sat · 07:30 – 19:30 ET",
    map: "350 Fifth Avenue, New York, NY",
  },
  {
    city: "London",
    role: "European gateway",
    address: "1 Canada Square, Canary Wharf, London E14 5AB",
    phone: "+44 20 7946 0958",
    hours: "Mon – Sat · 08:00 – 19:00 GMT",
    map: "1 Canada Square, London",
  },
  {
    city: "Singapore",
    role: "Asia-Pacific gateway",
    address: "8 Marina Boulevard, #12-01, Singapore 018981",
    phone: "+65 6812 0055",
    hours: "Mon – Sat · 08:30 – 19:00 SGT",
    map: "8 Marina Boulevard, Singapore",
  },
];

// -------------------------------------------------------------------
// Timeline used on the about page
// -------------------------------------------------------------------
export const MILESTONES = [
  {
    year: "2014",
    title: "One van in Brooklyn",
    text: "Marcus starts delivering parcels between Brooklyn and Manhattan with a second-hand van and a phone book.",
  },
  {
    year: "2017",
    title: "The first sorting centre",
    text: "We open our New Jersey hub and start handling cross-country shipments overnight.",
  },
  {
    year: "2019",
    title: "London gateway",
    text: "Our first transatlantic air freight partnership opens a direct New York → London line in 48 hours.",
  },
  {
    year: "2021",
    title: "Relay network goes live",
    text: "Partner shops join in New York, London and Berlin, cutting failed deliveries by more than half.",
  },
  {
    year: "2024",
    title: "1.2 million parcels",
    text: "Ten years of tracking data, 2,400 relay points and a live API for e-commerce customers.",
  },
];

// -------------------------------------------------------------------
// Demo tracking numbers (shown on the tracking page so visitors can
// try the product straight away).
// -------------------------------------------------------------------
export const DEMO_NUMBERS = [
  { number: "TRK000000001", label: "Delivered", hint: "New York → Boston" },
  { number: "TRK3F9A12BC7D", label: "In transit", hint: "New York → London" },
  { number: "TRK5B7C9D2EF1A", label: "Out for delivery", hint: "London → Paris" },
  { number: "TRK8A1B2C3D4E", label: "Delayed", hint: "Berlin → Amsterdam" },
];
