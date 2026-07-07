// lib/branches.ts
// Data model for the location / "branch" landing pages. Each branch is a
// local-area SEO page for a neighbourhood we let in. All copy here is original
// to House of Lettings — written to target local search intent
// ("letting agents in <area>", "houses/flats to rent in <area>") without
// duplicating any competitor's wording.

export type City = 'Leeds' | 'Manchester';

export interface Office {
  city: City;
  region: string;              // county / region for schema + copy
  addressLines: string[];      // street lines (no city/postcode)
  addressCity: string;
  postcode: string;
  phoneDisplay: string;
  phoneHref: string;           // tel: value
  email: string;
  hours: string;
  mapQuery: string;            // Google Maps query string (URL-encoded at use site)
  geo: { lat: number; lng: number };
}

// Both offices currently share one inbox (info@houseoflettings.co.uk); the
// phone + postal address switch by city so a tenant/landlord always reaches
// the right local team.
export const OFFICES: Record<City, Office> = {
  Leeds: {
    city: 'Leeds',
    region: 'West Yorkshire',
    addressLines: ['199 Roundhay Road', 'Harehills'],
    addressCity: 'Leeds',
    postcode: 'LS8 5PL',
    phoneDisplay: '0113 868 9212',
    phoneHref: 'tel:+441138689212',
    email: 'info@houseoflettings.co.uk',
    hours: 'Mon–Fri 9am–6pm · Sat 10am–2pm',
    mapQuery: '199 Roundhay Road, Harehills, Leeds LS8 5PL',
    geo: { lat: 53.8175, lng: -1.5205 },
  },
  Manchester: {
    city: 'Manchester',
    region: 'Greater Manchester',
    addressLines: ['Peter House', 'Oxford Street'],
    addressCity: 'Manchester',
    postcode: 'M1 5AN',
    phoneDisplay: '0161 768 1758',
    phoneHref: 'tel:+441617681758',
    email: 'info@houseoflettings.co.uk',
    hours: 'Mon–Fri 9am–6pm · Sat 10am–2pm',
    mapQuery: 'Peter House, Oxford Street, Manchester M1 5AN',
    geo: { lat: 53.4761, lng: -2.2426 },
  },
};

export interface BranchHighlight {
  label: string;
  text: string;
}

export interface Branch {
  slug: string;
  name: string;               // "Headingley"
  city: City;
  postcodes: string[];        // outcodes used to match live listings, e.g. ['LS6']
  areaKeywords: string[];     // lowercase tokens matched against a listing's location string
  tagline: string;            // short hero subline
  intro: string;              // one-sentence lead used on the index cards
  about: string[];            // 2 original paragraphs about the area + its rental market
  highlights: BranchHighlight[];
  popularSearches: string[];  // keyword chips (also feed the meta keywords)
  seoTitle: string;
  seoDescription: string;
  heroImage: string;          // path under /public
}

// A small rotating pool of on-brand imagery (we don't hold per-street photos).
const HERO_POOL = [
  '/images/heropage.webp',
  '/images/brand-desk.webp',
  '/images/compliance.webp',
  '/images/Landlord_page.webp',
  '/images/service-compare.webp',
];
const hero = (i: number) => HERO_POOL[i % HERO_POOL.length];

// ── Leeds branches ─────────────────────────────────────────────
const LEEDS: Branch[] = [
  {
    slug: 'leeds-city-centre',
    name: 'Leeds City Centre',
    city: 'Leeds',
    postcodes: ['LS1', 'LS2'],
    areaKeywords: ['leeds city centre', 'city centre', 'the calls', 'granary wharf', 'arena quarter', 'ls1', 'ls2'],
    tagline: 'Apartment living in the heart of Leeds',
    intro: 'City-centre apartments and professional lets between the Calls, Granary Wharf and the Arena Quarter.',
    about: [
      'Leeds City Centre is the busiest rental market in West Yorkshire, driven by a large professional workforce, two major universities and one of the strongest jobs markets outside London. Demand concentrates on modern one and two-bedroom apartments around Granary Wharf, the Calls, Wellington Place and the Arena Quarter, where tenants pay a premium for a short walk to the office and the station.',
      'Our Leeds team lets and manages apartments across LS1 and LS2 for landlords who want minimal voids and reliable, referenced tenants. Because so much of this stock is buy-to-let, presentation and pricing matter — we benchmark every property against live comparables so it goes to market at the right rent and lets fast.',
    ],
    highlights: [
      { label: 'Transport', text: 'Leeds rail station and the A64(M) loop road put tenants minutes from anywhere in the city.' },
      { label: 'Tenants', text: 'Young professionals, relocating workers and postgraduates dominate demand here.' },
      { label: 'Property type', text: 'Predominantly purpose-built and converted apartments, many furnished.' },
    ],
    popularSearches: ['flats to rent Leeds city centre', 'apartments to rent LS1', 'letting agents Leeds city centre', 'city centre lettings Leeds'],
    seoTitle: 'Letting Agents in Leeds City Centre (LS1 & LS2) | House of Lettings',
    seoDescription: 'Local letting agents for Leeds City Centre. Apartments and professional lets to rent across LS1 & LS2, plus full property management for landlords. No hidden fees.',
    heroImage: hero(0),
  },
  {
    slug: 'headingley',
    name: 'Headingley',
    city: 'Leeds',
    postcodes: ['LS6'],
    areaKeywords: ['headingley', 'far headingley', 'north lane', 'otley road', 'ls6'],
    tagline: 'Leeds’ best-known student and professional suburb',
    intro: 'Shared houses and professional flats a stone’s throw from North Lane and the cricket ground.',
    about: [
      'Headingley is one of the most sought-after rental areas in Leeds, famous for its cricket and rugby stadium, the bars and independents of North Lane, and a steady stream of students and young professionals from the nearby universities. The housing stock is classic red-brick Victorian terraces — ideal for HMOs and sharers — alongside a growing number of professional flats and refurbished period conversions.',
      'We let and manage a wide range of Headingley property, from four and five-bed student houses to one-bed professional apartments. With demand this consistent, well-presented homes at the right rent are typically reserved well before tenancies end, and our team handles the compliance, referencing and renewals that keep LS6 landlords fully let year on year.',
    ],
    highlights: [
      { label: 'Transport', text: 'Frequent buses along Otley Road and a direct Headingley rail link to the city centre.' },
      { label: 'Tenants', text: 'Students, graduates and professionals sharing or renting solo.' },
      { label: 'Property type', text: 'Victorian terraces, HMOs and period conversions.' },
    ],
    popularSearches: ['houses to rent Headingley', 'student houses Headingley', 'HMO letting agents LS6', 'flats to rent Headingley'],
    seoTitle: 'Letting Agents in Headingley, Leeds (LS6) | House of Lettings',
    seoDescription: 'Headingley letting agents specialising in student houses, HMOs and professional flats to rent across LS6. Full management and tenant-find for local landlords.',
    heroImage: hero(1),
  },
  {
    slug: 'chapel-allerton',
    name: 'Chapel Allerton',
    city: 'Leeds',
    postcodes: ['LS7'],
    areaKeywords: ['chapel allerton', 'chapeltown', 'harrogate road', 'regent street', 'ls7'],
    tagline: 'North Leeds’ café-culture village',
    intro: 'Stylish apartments and family homes around Chapel Allerton’s bars, delis and independents.',
    about: [
      'Chapel Allerton has become one of north Leeds’ most desirable postcodes, with a village feel, an award-winning high street of delis, bars and restaurants, and quick access into the city. It draws a mix of professionals, couples and young families who want character housing without moving out to the suburbs, which keeps LS7 rental demand strong all year.',
      'Our team lets everything from one-bed conversions above the high street to three and four-bedroom family houses on the tree-lined roads towards Moortown. Tenants here expect quality, so we help landlords present homes well, price them accurately and secure long, stable tenancies with fully referenced applicants.',
    ],
    highlights: [
      { label: 'Lifestyle', text: 'One of Leeds’ strongest independent high streets — a genuine draw for tenants.' },
      { label: 'Tenants', text: 'Professionals, couples and young families seeking longer lets.' },
      { label: 'Property type', text: 'Period conversions, terraces and family semis.' },
    ],
    popularSearches: ['houses to rent Chapel Allerton', 'flats to rent LS7', 'letting agents Chapel Allerton', 'family homes to rent north Leeds'],
    seoTitle: 'Letting Agents in Chapel Allerton, Leeds (LS7) | House of Lettings',
    seoDescription: 'Chapel Allerton letting agents. Apartments and family homes to rent across LS7, with full property management and free rental valuations for landlords.',
    heroImage: hero(2),
  },
  {
    slug: 'roundhay',
    name: 'Roundhay',
    city: 'Leeds',
    postcodes: ['LS8'],
    areaKeywords: ['roundhay', 'oakwood', 'moortown', 'roundhay park', 'ls8'],
    tagline: 'Family homes beside Roundhay Park',
    intro: 'Sought-after family houses and apartments around one of Europe’s largest city parks.',
    about: [
      'Roundhay is prime north Leeds, built around the 700-acre Roundhay Park with its lakes, gardens and open space. It is a premium family rental market — larger detached and semi-detached homes, strong local schools and the independent shops of Oakwood parade all support consistently high demand and low voids across LS8.',
      'We manage family houses and quality apartments for Roundhay landlords who value careful tenant selection and hands-off, fully compliant management. Homes near the park and the best school catchments let quickly, and our local knowledge helps landlords set a rent that reflects genuine demand rather than guesswork.',
    ],
    highlights: [
      { label: 'Green space', text: 'Roundhay Park, Tropical World and Waterloo Lake on the doorstep.' },
      { label: 'Tenants', text: 'Families and professionals wanting space and good schools.' },
      { label: 'Property type', text: 'Detached and semi-detached houses plus premium apartments.' },
    ],
    popularSearches: ['houses to rent Roundhay', 'family homes to rent LS8', 'letting agents Roundhay', 'apartments to rent Oakwood'],
    seoTitle: 'Letting Agents in Roundhay, Leeds (LS8) | House of Lettings',
    seoDescription: 'Roundhay letting agents for family houses and apartments to rent across LS8. Full management, careful tenant selection and free rental valuations.',
    heroImage: hero(3),
  },
  {
    slug: 'hyde-park',
    name: 'Hyde Park',
    city: 'Leeds',
    postcodes: ['LS6', 'LS3'],
    areaKeywords: ['hyde park', 'woodhouse', 'burley', 'ls3', 'hyde park corner'],
    tagline: 'Leeds’ student heartland',
    intro: 'Affordable shared houses and studios within walking distance of both universities.',
    about: [
      'Hyde Park sits right between the University of Leeds, Leeds Beckett and the city centre, making it the engine room of the Leeds student rental market. The area is dominated by back-to-back and through terraces configured as shared houses, giving landlords some of the strongest gross yields in the city.',
      'Our team handles the realities of student and young-professional letting in LS6 and LS3 — group viewings, guarantor referencing, HMO licensing and the tight annual letting cycle. We get properties advertised early, filled with referenced sharers and turned around cleanly between tenancies so landlords never miss the peak season.',
    ],
    highlights: [
      { label: 'Location', text: 'Walking distance to both Leeds universities and Hyde Park itself.' },
      { label: 'Tenants', text: 'Undergraduates, postgraduates and sharers on a budget.' },
      { label: 'Property type', text: 'Back-to-back and through terraces, mostly licensed HMOs.' },
    ],
    popularSearches: ['student houses Hyde Park Leeds', 'houses to rent LS6', 'HMO letting agents Hyde Park', 'shared houses to rent Leeds'],
    seoTitle: 'Letting Agents in Hyde Park, Leeds (LS6) | House of Lettings',
    seoDescription: 'Hyde Park letting agents specialising in student and shared houses to rent in LS6. HMO management, referencing and tenant-find for Leeds landlords.',
    heroImage: hero(4),
  },
  {
    slug: 'kirkstall',
    name: 'Kirkstall',
    city: 'Leeds',
    postcodes: ['LS4', 'LS5'],
    areaKeywords: ['kirkstall', 'burley', 'bridge road', 'kirkstall abbey', 'ls4', 'ls5'],
    tagline: 'Riverside value between the city and Headingley',
    intro: 'Well-priced flats and terraces near Kirkstall Abbey and the retail park.',
    about: [
      'Kirkstall offers some of the best value in west Leeds, with the historic Abbey, the River Aire and a large retail park all close by, plus fast links into the city and out to Headingley. It appeals to professionals and couples priced out of neighbouring LS6 but who still want a quick commute and green space nearby.',
      'We let and manage terraces, apartments and the newer riverside developments across LS4 and LS5. Rents here have grown steadily as the area regenerates, and our team makes sure landlords capture that with accurate pricing, quality photography and thorough tenant referencing.',
    ],
    highlights: [
      { label: 'Heritage', text: 'Kirkstall Abbey and the Leeds–Liverpool Canal towpath on the doorstep.' },
      { label: 'Tenants', text: 'Commuting professionals and value-conscious couples.' },
      { label: 'Property type', text: 'Terraces, canal-side apartments and modern developments.' },
    ],
    popularSearches: ['flats to rent Kirkstall', 'houses to rent LS5', 'letting agents Kirkstall', 'apartments to rent Burley'],
    seoTitle: 'Letting Agents in Kirkstall, Leeds (LS4 & LS5) | House of Lettings',
    seoDescription: 'Kirkstall letting agents for flats and houses to rent across LS4 & LS5. Full property management and free rental valuations for west Leeds landlords.',
    heroImage: hero(5),
  },
  {
    slug: 'horsforth',
    name: 'Horsforth',
    city: 'Leeds',
    postcodes: ['LS18'],
    areaKeywords: ['horsforth', 'town street', 'ls18', 'newlay'],
    tagline: 'A thriving north-west Leeds village',
    intro: 'Popular family and professional lets along Horsforth’s long, café-lined Town Street.',
    about: [
      'Horsforth is one of the largest and most in-demand villages in Leeds, with a long high street of independent cafés, bars and shops, excellent schools and its own rail station straight into the city. It consistently draws families and professionals looking for a village lifestyle with an easy commute, which keeps rental demand high and voids low across LS18.',
      'Our team lets stone-built terraces, semis and modern apartments to referenced, longer-term tenants. Property here rarely stays available for long, so we focus on getting the pricing and presentation right first time and managing tenancies proactively to protect our landlords’ income.',
    ],
    highlights: [
      { label: 'Transport', text: 'Horsforth rail station and the Leeds ring road for fast commuting.' },
      { label: 'Tenants', text: 'Families and professionals wanting village life near the city.' },
      { label: 'Property type', text: 'Stone terraces, semis and newer apartments.' },
    ],
    popularSearches: ['houses to rent Horsforth', 'flats to rent LS18', 'letting agents Horsforth', 'family homes to rent Horsforth'],
    seoTitle: 'Letting Agents in Horsforth, Leeds (LS18) | House of Lettings',
    seoDescription: 'Horsforth letting agents for houses and apartments to rent across LS18. Full management, tenant-find and free rental valuations for local landlords.',
    heroImage: hero(6),
  },
  {
    slug: 'morley',
    name: 'Morley',
    city: 'Leeds',
    postcodes: ['LS27'],
    areaKeywords: ['morley', 'churwell', 'ls27'],
    tagline: 'Affordable commuter-town renting',
    intro: 'Great-value family houses and flats with a fast train into central Leeds.',
    about: [
      'Morley is a busy market town to the south-west of Leeds with its own high street, a new rail station and quick motorway access, making it a favourite with commuters who want more space for their money. Rental demand is broad — from first-time renters and couples to families needing three-bed houses — and prices remain some of the most affordable in the LS postcodes.',
      'We manage terraces, semis and apartments across LS27 for landlords who want steady, long-term tenancies. Because affordability drives demand here, well-maintained homes at a sensible rent let quickly, and our team keeps them compliant, occupied and generating reliable income.',
    ],
    highlights: [
      { label: 'Transport', text: 'Morley rail station and the M62/M621 for commuters.' },
      { label: 'Tenants', text: 'Families, couples and first-time renters after value.' },
      { label: 'Property type', text: 'Stone terraces, semis and low-rise apartments.' },
    ],
    popularSearches: ['houses to rent Morley', 'flats to rent LS27', 'letting agents Morley', 'family homes to rent Morley Leeds'],
    seoTitle: 'Letting Agents in Morley, Leeds (LS27) | House of Lettings',
    seoDescription: 'Morley letting agents for affordable houses and flats to rent across LS27. Full property management and free rental valuations for landlords.',
    heroImage: hero(7),
  },
  {
    slug: 'pudsey',
    name: 'Pudsey',
    city: 'Leeds',
    postcodes: ['LS28'],
    areaKeywords: ['pudsey', 'farsley', 'stanningley', 'ls28'],
    tagline: 'Midway between Leeds and Bradford',
    intro: 'Well-connected homes to rent across Pudsey, Farsley and Stanningley.',
    about: [
      'Pudsey sits neatly between Leeds and Bradford, giving tenants a genuine choice of two city commutes plus the independent shops and cafés of neighbouring Farsley. It is a dependable, good-value rental market with a strong mix of stone terraces, semis and newer developments spread across LS28.',
      'Our team lets and manages homes for a broad tenant base — commuters, families and couples — who value the location and the price point. We handle everything from marketing and referencing to compliance and renewals, keeping Pudsey landlords let and hands-off.',
    ],
    highlights: [
      { label: 'Location', text: 'Equidistant from Leeds and Bradford with easy ring-road access.' },
      { label: 'Tenants', text: 'Commuters, families and couples wanting choice and value.' },
      { label: 'Property type', text: 'Stone terraces, semis and modern developments.' },
    ],
    popularSearches: ['houses to rent Pudsey', 'flats to rent LS28', 'letting agents Pudsey', 'homes to rent Farsley'],
    seoTitle: 'Letting Agents in Pudsey, Leeds (LS28) | House of Lettings',
    seoDescription: 'Pudsey letting agents for houses and flats to rent across LS28, including Farsley and Stanningley. Full management and free rental valuations.',
    heroImage: hero(8),
  },
  {
    slug: 'armley',
    name: 'Armley',
    city: 'Leeds',
    postcodes: ['LS12'],
    areaKeywords: ['armley', 'wortley', 'new wortley', 'ls12'],
    tagline: 'High-yield renting on the city’s doorstep',
    intro: 'Affordable terraces and flats minutes from Leeds city centre.',
    about: [
      'Armley is one of the closest affordable neighbourhoods to Leeds city centre, which makes it a strong buy-to-let market with attractive yields. The area is largely made up of through and back-to-back terraces alongside newer apartments, and its proximity to the city keeps demand from working tenants and young renters consistently high across LS12.',
      'Our team specialises in letting and managing this kind of stock efficiently — accurate pricing, thorough referencing and proactive maintenance to protect income. For landlords focused on yield and low voids, Armley remains one of the most dependable postcodes in west Leeds.',
    ],
    highlights: [
      { label: 'Location', text: 'A short hop from the city centre via the A647 and A58.' },
      { label: 'Tenants', text: 'Working tenants and young renters wanting to be close in.' },
      { label: 'Property type', text: 'Through and back-to-back terraces plus modern flats.' },
    ],
    popularSearches: ['houses to rent Armley', 'flats to rent LS12', 'letting agents Armley', 'cheap houses to rent Leeds'],
    seoTitle: 'Letting Agents in Armley, Leeds (LS12) | House of Lettings',
    seoDescription: 'Armley letting agents for affordable houses and flats to rent across LS12. High-yield buy-to-let management and free rental valuations for landlords.',
    heroImage: hero(9),
  },
];

// ── Manchester branches ────────────────────────────────────────
const MANCHESTER: Branch[] = [
  {
    slug: 'manchester-city-centre',
    name: 'Manchester City Centre',
    city: 'Manchester',
    postcodes: ['M1', 'M2', 'M3', 'M4'],
    areaKeywords: ['manchester city centre', 'city centre', 'northern quarter', 'ancoats', 'deansgate', 'spinningfields', 'm1', 'm2', 'm3', 'm4'],
    tagline: 'High-rise living in the North’s capital',
    intro: 'Modern apartments and professional lets from the Northern Quarter to Deansgate.',
    about: [
      'Manchester City Centre is one of the fastest-growing residential rental markets in the UK, with tens of thousands of new apartments delivered around Deansgate, Spinningfields, the Northern Quarter and Ancoats. A huge professional and graduate population, major employers and two universities keep demand for one and two-bed apartments intense and voids short.',
      'Our Manchester team lets and manages city-centre apartments for landlords who want their investment filled quickly with referenced, professional tenants. In a market this competitive on both rent and presentation, we benchmark every property against live comparables and market it hard from day one.',
    ],
    highlights: [
      { label: 'Transport', text: 'Metrolink, Piccadilly and Victoria stations put the whole city within reach.' },
      { label: 'Tenants', text: 'Professionals, graduates and relocating workers.' },
      { label: 'Property type', text: 'Purpose-built high-rise and converted apartments.' },
    ],
    popularSearches: ['apartments to rent Manchester city centre', 'flats to rent M1', 'letting agents Manchester city centre', 'city centre apartments to rent'],
    seoTitle: 'Letting Agents in Manchester City Centre (M1–M4) | House of Lettings',
    seoDescription: 'Manchester City Centre letting agents. Modern apartments and professional lets to rent across M1–M4, plus full property management for landlords. No hidden fees.',
    heroImage: hero(0),
  },
  {
    slug: 'didsbury',
    name: 'Didsbury',
    city: 'Manchester',
    postcodes: ['M20'],
    areaKeywords: ['didsbury', 'west didsbury', 'east didsbury', 'burton road', 'm20'],
    tagline: 'South Manchester’s most desirable suburb',
    intro: 'Premium apartments and family homes around Didsbury village and Burton Road.',
    about: [
      'Didsbury is arguably the most sought-after suburb in south Manchester, with two lively villages, the bars and delis of Burton Road in West Didsbury, riverside parks and excellent schools. It draws professionals, couples and families willing to pay a premium for lifestyle and quick Metrolink access to the city, which underpins strong, year-round rental demand in M20.',
      'Our team lets everything from stylish one-bed conversions to substantial family houses. Tenants here have high expectations, so we help landlords present homes to the standard the area commands, price accurately and secure long, well-referenced tenancies.',
    ],
    highlights: [
      { label: 'Lifestyle', text: 'Two villages, Burton Road’s independents and Fletcher Moss park.' },
      { label: 'Tenants', text: 'Professionals, couples and families seeking longer lets.' },
      { label: 'Property type', text: 'Period conversions, apartments and family houses.' },
    ],
    popularSearches: ['flats to rent Didsbury', 'houses to rent M20', 'letting agents Didsbury', 'apartments to rent West Didsbury'],
    seoTitle: 'Letting Agents in Didsbury, Manchester (M20) | House of Lettings',
    seoDescription: 'Didsbury letting agents for apartments and family homes to rent across M20, including West and East Didsbury. Full management and free rental valuations.',
    heroImage: hero(1),
  },
  {
    slug: 'chorlton',
    name: 'Chorlton',
    city: 'Manchester',
    postcodes: ['M21'],
    areaKeywords: ['chorlton', 'chorlton-cum-hardy', 'beech road', 'm21'],
    tagline: 'Independent, green and always in demand',
    intro: 'Character homes and flats around Beech Road and Chorlton’s water park.',
    about: [
      'Chorlton is one of south Manchester’s most characterful neighbourhoods, known for the independent shops and bars of Beech Road and Wilbraham Road, its green spaces and a strong community feel. It appeals to professionals, creatives and families who want personality over new-build uniformity, keeping M21 rental demand reliably high.',
      'We let and manage Victorian and Edwardian houses, conversions and apartments across Chorlton. With tenants often looking to settle for the long term, our focus is careful tenant matching, accurate pricing and responsive management that keeps both landlords and tenants happy.',
    ],
    highlights: [
      { label: 'Lifestyle', text: 'Beech Road independents and Chorlton Water Park nearby.' },
      { label: 'Tenants', text: 'Professionals, creatives and families wanting to settle.' },
      { label: 'Property type', text: 'Victorian and Edwardian houses, conversions and flats.' },
    ],
    popularSearches: ['houses to rent Chorlton', 'flats to rent M21', 'letting agents Chorlton', 'family homes to rent Chorlton'],
    seoTitle: 'Letting Agents in Chorlton, Manchester (M21) | House of Lettings',
    seoDescription: 'Chorlton letting agents for character houses and flats to rent across M21. Full property management and free rental valuations for south Manchester landlords.',
    heroImage: hero(2),
  },
  {
    slug: 'fallowfield',
    name: 'Fallowfield',
    city: 'Manchester',
    postcodes: ['M14'],
    areaKeywords: ['fallowfield', 'ladybarn', 'wilmslow road', 'm14'],
    tagline: 'The centre of Manchester student life',
    intro: 'Shared student houses along the Wilmslow Road corridor.',
    about: [
      'Fallowfield is the heart of Manchester’s student rental market, sitting on the Wilmslow Road “curry mile” corridor within easy reach of the universities. The area is dominated by large Victorian and Edwardian terraces let as shared student houses, delivering strong yields for buy-to-let landlords across M14.',
      'Our team knows the student letting cycle inside out — early marketing, group viewings, guarantor referencing and HMO compliance. We fill houses ahead of the peak, turn them around cleanly between academic years and keep landlords fully let without the hassle.',
    ],
    highlights: [
      { label: 'Location', text: 'On the bus corridor straight to the University of Manchester and MMU.' },
      { label: 'Tenants', text: 'Undergraduates and postgraduates sharing.' },
      { label: 'Property type', text: 'Large Victorian terraces run as licensed HMOs.' },
    ],
    popularSearches: ['student houses Fallowfield', 'houses to rent M14', 'HMO letting agents Fallowfield', 'shared houses to rent Manchester'],
    seoTitle: 'Letting Agents in Fallowfield, Manchester (M14) | House of Lettings',
    seoDescription: 'Fallowfield letting agents specialising in student and shared houses to rent in M14. HMO management, referencing and tenant-find for Manchester landlords.',
    heroImage: hero(3),
  },
  {
    slug: 'salford-quays',
    name: 'Salford Quays',
    city: 'Manchester',
    postcodes: ['M50'],
    areaKeywords: ['salford quays', 'mediacityuk', 'media city', 'the quays', 'm50'],
    tagline: 'Waterfront apartments at MediaCityUK',
    intro: 'Modern dockside flats beside MediaCityUK and the Lowry.',
    about: [
      'Salford Quays has been transformed into one of Greater Manchester’s premier waterfront rental destinations, anchored by MediaCityUK, the BBC and ITV, the Lowry and a dedicated Metrolink line. The area is almost entirely modern apartments, and the concentration of media, tech and professional employers keeps demand for quality one and two-beds consistently strong across M50.',
      'Our team lets and manages waterfront apartments for landlords who want reliable, professional tenants and short voids. We market to the relocating and commuting professionals who drive this market and handle the full let end to end, from referencing to compliance.',
    ],
    highlights: [
      { label: 'Transport', text: 'Dedicated Metrolink line into the city and out to the Trafford Centre.' },
      { label: 'Tenants', text: 'Media, tech and professional workers.' },
      { label: 'Property type', text: 'Modern waterfront apartments, many with parking.' },
    ],
    popularSearches: ['apartments to rent Salford Quays', 'flats to rent M50', 'letting agents Salford Quays', 'MediaCityUK apartments to rent'],
    seoTitle: 'Letting Agents at Salford Quays, Manchester (M50) | House of Lettings',
    seoDescription: 'Salford Quays letting agents for waterfront apartments to rent across M50 and MediaCityUK. Full property management and free rental valuations for landlords.',
    heroImage: hero(4),
  },
  {
    slug: 'prestwich',
    name: 'Prestwich',
    city: 'Manchester',
    postcodes: ['M25'],
    areaKeywords: ['prestwich', 'sedgley park', 'heaton park', 'm25'],
    tagline: 'Village feel beside Heaton Park',
    intro: 'Family homes and apartments next to one of Europe’s largest municipal parks.',
    about: [
      'Prestwich offers a village atmosphere on the northern edge of Manchester, with the vast green expanse of Heaton Park, a growing food-and-drink scene around the village, and its own Metrolink stops straight into the city. It has become increasingly popular with families and professionals priced out of the southern suburbs, supporting steady rental demand across M25.',
      'Our team lets semis, terraces and apartments to referenced, longer-term tenants. With the area on an upward trajectory, we help landlords price to the current market and manage tenancies proactively to keep income steady and voids low.',
    ],
    highlights: [
      { label: 'Green space', text: 'Heaton Park, its lakes and trails right on the doorstep.' },
      { label: 'Tenants', text: 'Families and professionals wanting space and a village feel.' },
      { label: 'Property type', text: 'Semis, terraces and modern apartments.' },
    ],
    popularSearches: ['houses to rent Prestwich', 'flats to rent M25', 'letting agents Prestwich', 'family homes to rent Prestwich'],
    seoTitle: 'Letting Agents in Prestwich, Manchester (M25) | House of Lettings',
    seoDescription: 'Prestwich letting agents for family homes and apartments to rent across M25, beside Heaton Park. Full management and free rental valuations for landlords.',
    heroImage: hero(5),
  },
  {
    slug: 'withington',
    name: 'Withington',
    city: 'Manchester',
    postcodes: ['M20'],
    areaKeywords: ['withington', 'old moat', 'm20 withington'],
    tagline: 'Where students meet young professionals',
    intro: 'Affordable shared houses and flats between Fallowfield and Didsbury.',
    about: [
      'Withington bridges student Fallowfield and professional Didsbury, giving it a broad tenant base of postgraduates, medics from the nearby hospitals and young professionals. Its high street, cinema and easy bus links keep demand strong, and its terraces and conversions offer better value than neighbouring Didsbury.',
      'Our team lets and manages shared houses, one-beds and family terraces across the Withington part of M20. We match the right tenants to each property, keep HMOs licensed and compliant, and manage tenancies so landlords enjoy dependable income with minimal involvement.',
    ],
    highlights: [
      { label: 'Location', text: 'On the bus corridor between the universities, hospitals and Didsbury.' },
      { label: 'Tenants', text: 'Postgraduates, medics and young professionals.' },
      { label: 'Property type', text: 'Terraces, conversions and shared houses.' },
    ],
    popularSearches: ['houses to rent Withington', 'flats to rent Withington M20', 'letting agents Withington', 'student houses Withington'],
    seoTitle: 'Letting Agents in Withington, Manchester (M20) | House of Lettings',
    seoDescription: 'Withington letting agents for shared houses, flats and family homes to rent across M20. HMO management, referencing and free rental valuations.',
    heroImage: hero(6),
  },
  {
    slug: 'sale',
    name: 'Sale',
    city: 'Manchester',
    postcodes: ['M33'],
    areaKeywords: ['sale', 'sale moor', 'brooklands', 'm33'],
    tagline: 'Leafy Trafford living on the tram',
    intro: 'Popular family houses and apartments with a fast Metrolink commute.',
    about: [
      'Sale is a firm favourite in the borough of Trafford, combining a busy town centre, the waterside walks of Sale Water Park and the Bridgewater Canal, strong schools and its own Metrolink line into Manchester. That mix of connectivity and green space keeps family and professional rental demand high right across M33.',
      'Our team lets semis, terraces and modern apartments to referenced, long-term tenants. Homes in the best school catchments and near the tram let quickly, and we help landlords price accurately and keep their properties compliant, occupied and well maintained.',
    ],
    highlights: [
      { label: 'Transport', text: 'Metrolink and the M60 for fast access across Greater Manchester.' },
      { label: 'Tenants', text: 'Families and professionals after schools and connectivity.' },
      { label: 'Property type', text: 'Semis, terraces and modern apartments.' },
    ],
    popularSearches: ['houses to rent Sale', 'flats to rent M33', 'letting agents Sale', 'family homes to rent Sale Manchester'],
    seoTitle: 'Letting Agents in Sale, Manchester (M33) | House of Lettings',
    seoDescription: 'Sale letting agents for family houses and apartments to rent across M33, including Sale Moor and Brooklands. Full management and free rental valuations.',
    heroImage: hero(7),
  },
  {
    slug: 'stretford',
    name: 'Stretford',
    city: 'Manchester',
    postcodes: ['M32'],
    areaKeywords: ['stretford', 'gorse hill', 'old trafford', 'm32'],
    tagline: 'Value renting beside Old Trafford',
    intro: 'Affordable terraces and flats close to the stadiums and the Metrolink.',
    about: [
      'Stretford offers excellent value on the doorstep of both Old Trafford stadiums, the Trafford Centre and the city centre, all served by the Metrolink. Ongoing regeneration around Stretford Mall and the King Street area is lifting the neighbourhood, and its affordable terraces continue to attract working tenants and families across M32.',
      'Our team lets and manages terraces, semis and apartments efficiently, with accurate pricing and thorough referencing. For landlords chasing solid yields close to the city, Stretford remains one of Trafford’s most dependable rental postcodes.',
    ],
    highlights: [
      { label: 'Location', text: 'Between Old Trafford, the Trafford Centre and the city on the tram.' },
      { label: 'Tenants', text: 'Working tenants and families after value and links.' },
      { label: 'Property type', text: 'Terraces, semis and low-rise apartments.' },
    ],
    popularSearches: ['houses to rent Stretford', 'flats to rent M32', 'letting agents Stretford', 'homes to rent Old Trafford'],
    seoTitle: 'Letting Agents in Stretford, Manchester (M32) | House of Lettings',
    seoDescription: 'Stretford letting agents for affordable houses and flats to rent across M32, near Old Trafford. Full property management and free rental valuations.',
    heroImage: hero(8),
  },
  {
    slug: 'whalley-range',
    name: 'Whalley Range',
    city: 'Manchester',
    postcodes: ['M16'],
    areaKeywords: ['whalley range', 'firswood', 'm16'],
    tagline: 'Grand Victorian villas near the city',
    intro: 'Characterful conversions and family homes close to Chorlton and the centre.',
    about: [
      'Whalley Range is known for its wide, tree-lined roads and grand Victorian villas, many now divided into spacious apartments. Sitting between Chorlton and Moss Side and only a couple of miles from the centre, it appeals to professionals, families and students who want space and character at a keener price than neighbouring Chorlton, keeping M16 demand steady.',
      'Our team lets and manages conversions, houses and apartments across Whalley Range and Firswood. We match tenants carefully to this varied stock, price to the local market and keep landlords compliant, let and hands-off throughout the tenancy.',
    ],
    highlights: [
      { label: 'Character', text: 'Tree-lined avenues of grand Victorian villas and conversions.' },
      { label: 'Tenants', text: 'Professionals, families and students wanting space.' },
      { label: 'Property type', text: 'Large villa conversions, houses and apartments.' },
    ],
    popularSearches: ['flats to rent Whalley Range', 'houses to rent M16', 'letting agents Whalley Range', 'apartments to rent Whalley Range'],
    seoTitle: 'Letting Agents in Whalley Range, Manchester (M16) | House of Lettings',
    seoDescription: 'Whalley Range letting agents for Victorian conversions, houses and flats to rent across M16. Full property management and free rental valuations.',
    heroImage: hero(9),
  },
];

export const BRANCHES: Branch[] = [...LEEDS, ...MANCHESTER];

export function getBranch(slug: string): Branch | undefined {
  return BRANCHES.find((b) => b.slug === slug);
}

export function branchesByCity(city: City): Branch[] {
  return BRANCHES.filter((b) => b.city === city);
}

// Does a free-text listing location belong to this branch's area?
// Matches on an area keyword or an outcode (e.g. "ls6", "m20") appearing in the
// listing's location string. Kept deliberately simple and case-insensitive.
export function listingMatchesBranch(location: string, branch: Branch): boolean {
  const loc = (location || '').toLowerCase();
  if (branch.areaKeywords.some((k) => loc.includes(k))) return true;
  return branch.postcodes.some((pc) => {
    const outcode = pc.toLowerCase();
    // word-ish boundary so "ls1" doesn't match "ls10"
    const re = new RegExp(`\\b${outcode}\\b|\\b${outcode}\\d`, 'i');
    return re.test(loc);
  });
}

// Broad city fallback used when an area has no live listings yet.
const LEEDS_AREAS = /\b(ls\d|wf\d|bd\d|hd\d|hx\d|hg\d|leeds|yorkshire)\b/i;
const MANCHESTER_AREAS = /\b(m\d|ol\d|bl\d|sk\d|wn\d|wa\d|manchester|salford|trafford)\b/i;

export function listingMatchesCity(location: string, city: City): boolean {
  const loc = (location || '').toLowerCase();
  return city === 'Leeds' ? LEEDS_AREAS.test(loc) : MANCHESTER_AREAS.test(loc);
}
