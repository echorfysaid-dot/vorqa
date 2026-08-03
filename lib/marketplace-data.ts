export const marketplaceCategories = [
  { name: "Contractors", count: 42, description: "Verified construction contractors for residential, commercial, and industrial delivery." },
  { name: "Engineering Firms", count: 31, description: "Civil, structural, MEP, and project engineering firms ready for execution support." },
  { name: "Architecture Studios", count: 28, description: "Design studios for concept, permit packages, BIM, and detailed architecture." },
  { name: "Material Suppliers", count: 56, description: "Concrete, steel, facade, finishes, and MEP material suppliers." },
  { name: "Logistics Companies", count: 24, description: "Construction logistics, site delivery, crane coordination, and transport partners." },
  { name: "Equipment Rental", count: 19, description: "Heavy equipment, cranes, tools, and site machinery rental providers." },
  { name: "Consultants", count: 34, description: "Cost, planning, geotechnical, legal, safety, and project advisory consultants." }
];

const commonReviews = [
  { name: "Nadia Benali", company: "Atlas Construction Group", rating: 5, text: "Professional delivery, clear documentation, and strong coordination throughout the engagement." },
  { name: "Karim Berrada", company: "Procurement Office", rating: 4.8, text: "Reliable response times and transparent commercial information for project teams." },
  { name: "Salma Idrissi", company: "Architecture Lead", rating: 4.7, text: "Excellent technical clarity and strong collaboration with design and site stakeholders." }
];

export const marketplaceCompanies = [
  {
    slug: "atlas-construction",
    name: "Atlas Construction Group",
    logo: "ACG",
    category: "Contractors",
    verified: true,
    rating: 4.9,
    country: "Morocco",
    city: "Casablanca",
    activeProjects: 4,
    completedProjects: 86,
    employees: 248,
    partners: 34,
    responseRate: "96%",
    responseTime: "Under 2 hours",
    yearsInBusiness: 18,
    description: "Enterprise contractor delivering premium residential, commercial, and industrial projects across Morocco.",
    about: "Atlas Construction Group is a full-service construction partner for premium residential, commercial, and industrial programs. The company combines project controls, site execution, procurement governance, and executive reporting for complex build environments.",
    status: "Preferred partner",
    services: ["General contracting", "Project execution", "Site supervision", "Turnkey delivery"],
    industries: ["Residential", "Commercial", "Industrial", "Hospitality"],
    serviceAreas: ["Casablanca", "Rabat", "Tangier", "Marrakech"],
    languages: ["Arabic", "French", "English"],
    certifications: ["ISO 9001", "Site Safety Certified", "Premium Contractor Verification"],
    legalStatus: "Verified business registration and insurance profile",
    contact: { person: "Yassine El Mansouri", email: "partnerships@atlas.example", phone: "+212 522 410 100", website: "atlas.example", hours: "Mon-Fri, 08:00-18:00" },
    serviceCards: [
      { title: "Turnkey construction", description: "End-to-end delivery for villas, offices, and industrial buildings.", delivery: "12-48 weeks", availability: "Available" },
      { title: "Site execution team", description: "Dedicated site managers, engineers, safety, and quality supervision.", delivery: "1-2 weeks mobilization", availability: "Limited slots" },
      { title: "Executive reporting", description: "Weekly project health, budget, risk, and delivery reporting.", delivery: "48 hours", availability: "Available" }
    ],
    portfolio: [
      { title: "Luxury Villa Casablanca", location: "Casablanca", type: "Residential Villa", status: "Execution", budget: "MAD 24M-28M", date: "Nov 2026" },
      { title: "Residential Complex Rabat", location: "Rabat", type: "Residential Complex", status: "Design Review", budget: "MAD 150M-170M", date: "Jun 2027" },
      { title: "Industrial Warehouse Tangier", location: "Tangier", type: "Industrial", status: "Procurement", budget: "MAD 70M-82M", date: "Dec 2026" }
    ],
    team: [
      { name: "Yassine El Mansouri", role: "CEO", skills: "Executive governance, delivery strategy" },
      { name: "Nadia Benali", role: "Project Manager", skills: "Project controls, delivery planning" },
      { name: "Omar Haddad", role: "Site Engineer", skills: "Quality, inspections, site supervision" }
    ],
    documents: ["Company profile.pdf", "Insurance certificate.pdf", "Safety policy.pdf", "Technical capability statement.pdf"],
    reviews: commonReviews,
    insights: { fit: 94, reliability: "High", capacity: "Strong capacity for premium residential and industrial delivery.", risks: ["High workload on engineering team", "Procurement approvals need early alignment"], useCases: ["Turnkey construction", "Site execution", "Executive delivery reporting"], comparison: "Best fit when the buyer needs one accountable partner for planning, procurement, execution, and reporting." }
  },
  {
    slug: "northbuild-engineering",
    name: "NorthBuild Engineering",
    logo: "NBE",
    category: "Engineering Firms",
    verified: true,
    rating: 4.8,
    country: "Morocco",
    city: "Rabat",
    activeProjects: 7,
    completedProjects: 64,
    employees: 86,
    partners: 18,
    responseRate: "94%",
    responseTime: "Same business day",
    yearsInBusiness: 11,
    description: "Civil engineering consultancy specializing in structural review, infrastructure audits, and delivery controls.",
    about: "NorthBuild Engineering supports owners and contractors with civil engineering, structural validation, infrastructure audits, and technical project controls for complex construction programs.",
    status: "Verified",
    services: ["Structural review", "Civil engineering", "Infrastructure audits", "Technical project controls"],
    industries: ["Infrastructure", "Residential", "Industrial"],
    serviceAreas: ["Rabat", "Casablanca", "Fez", "Kenitra"],
    languages: ["Arabic", "French", "English"],
    certifications: ["Licensed Engineering Firm", "ISO 9001"],
    legalStatus: "Verified engineering license and insurance profile",
    contact: { person: "Amal Benjelloun", email: "contact@northbuild.example", phone: "+212 537 210 044", website: "northbuild.example", hours: "Mon-Fri, 08:30-17:30" },
    serviceCards: [
      { title: "Structural audit", description: "Independent structural review for design and construction stages.", delivery: "5-10 days", availability: "Available" },
      { title: "Infrastructure study", description: "Roads, drainage, utilities, and site infrastructure analysis.", delivery: "2-4 weeks", availability: "Available" },
      { title: "Project controls setup", description: "Engineering progress, quality, and risk control framework.", delivery: "1 week", availability: "Available" }
    ],
    portfolio: [
      { title: "Rabat Infrastructure Audit", location: "Rabat", type: "Infrastructure", status: "Completed", budget: "MAD 4M-6M", date: "Mar 2026" },
      { title: "Bridge Rehabilitation Fez", location: "Fez", type: "Civil Works", status: "Execution", budget: "MAD 18M-22M", date: "Sep 2026" }
    ],
    team: [
      { name: "Amal Benjelloun", role: "Managing Engineer", skills: "Civil engineering, project controls" },
      { name: "Rida El Fassi", role: "Structural Lead", skills: "Structural review, seismic design" }
    ],
    documents: ["Engineering license.pdf", "Professional insurance.pdf", "Structural capability sheet.pdf"],
    reviews: commonReviews,
    insights: { fit: 91, reliability: "High", capacity: "Strong engineering bench for audits and technical controls.", risks: ["Specialist availability should be booked early"], useCases: ["Structural review", "Infrastructure audit", "Technical controls"], comparison: "Best fit for technical validation before procurement or construction starts." }
  },
  {
    slug: "urbanform-architects",
    name: "UrbanForm Architects",
    logo: "UFA",
    category: "Architecture Studios",
    verified: true,
    rating: 4.7,
    country: "Morocco",
    city: "Marrakech",
    activeProjects: 9,
    completedProjects: 52,
    employees: 64,
    partners: 21,
    responseRate: "92%",
    responseTime: "Under 4 hours",
    yearsInBusiness: 9,
    description: "Architecture and urban design studio focused on premium hospitality, offices, and housing concepts.",
    about: "UrbanForm Architects creates premium architectural concepts, permit packages, BIM coordination, interiors, and urban design studies for high-end development teams.",
    status: "Verified",
    services: ["Concept design", "Permit packages", "BIM coordination", "Interior architecture"],
    industries: ["Hospitality", "Residential", "Commercial", "Urban design"],
    serviceAreas: ["Marrakech", "Agadir", "Casablanca", "Rabat"],
    languages: ["Arabic", "French", "English"],
    certifications: ["Licensed Architecture Studio", "BIM Coordination Certified"],
    legalStatus: "Verified professional registration",
    contact: { person: "Salma Idrissi", email: "studio@urbanform.example", phone: "+212 524 300 166", website: "urbanform.example", hours: "Mon-Fri, 09:00-18:00" },
    serviceCards: [
      { title: "Premium concept design", description: "Design direction, massing, mood, and investor-ready visuals.", delivery: "2-4 weeks", availability: "Available" },
      { title: "Permit package", description: "Technical drawings and submission documentation.", delivery: "4-8 weeks", availability: "Available" },
      { title: "BIM coordination", description: "Model setup, clash review, and coordination packages.", delivery: "Weekly cycles", availability: "Limited slots" }
    ],
    portfolio: [
      { title: "Office Tower Marrakech", location: "Marrakech", type: "Commercial Tower", status: "Planning", budget: "MAD 140M-160M", date: "Aug 2027" },
      { title: "Agadir Resort Concept", location: "Agadir", type: "Hospitality", status: "Completed", budget: "MAD 80M-95M", date: "Jan 2026" }
    ],
    team: [
      { name: "Salma Idrissi", role: "Design Director", skills: "Architecture, permits, client design" },
      { name: "Amine Tazi", role: "BIM Engineer", skills: "Revit, coordination, clash detection" }
    ],
    documents: ["Studio profile.pdf", "Architecture registration.pdf", "BIM standards.pdf"],
    reviews: commonReviews,
    insights: { fit: 88, reliability: "Strong", capacity: "Best capacity for concept and permit-stage projects.", risks: ["BIM capacity should be protected for complex MEP coordination"], useCases: ["Architecture concept", "Permit design", "BIM coordination"], comparison: "Best fit for clients that need premium visual and technical design quality." }
  },
  {
    slug: "maghreb-logistics",
    name: "Maghreb Logistics",
    logo: "MLG",
    category: "Logistics Companies",
    verified: false,
    rating: 4.4,
    country: "Morocco",
    city: "Tangier",
    activeProjects: 5,
    completedProjects: 38,
    employees: 132,
    partners: 27,
    responseRate: "89%",
    responseTime: "Under 6 hours",
    yearsInBusiness: 13,
    description: "Regional construction logistics partner for site delivery, fleet coordination, and port access planning.",
    about: "Maghreb Logistics coordinates construction deliveries, fleet planning, port access, crane slots, and site logistics across northern and central Morocco.",
    status: "Pending verification",
    services: ["Site logistics", "Fleet coordination", "Port access planning", "Crane scheduling"],
    industries: ["Industrial", "Infrastructure", "Commercial"],
    serviceAreas: ["Tangier", "Casablanca", "Rabat", "Tetouan"],
    languages: ["Arabic", "French", "Spanish"],
    certifications: ["Fleet Safety Program", "Port Access Compliance"],
    legalStatus: "Business registration verified; insurance review pending",
    contact: { person: "Hajar Amrani", email: "dispatch@maghreblogistics.example", phone: "+212 539 610 088", website: "maghreblogistics.example", hours: "Mon-Sat, 07:00-19:00" },
    serviceCards: [
      { title: "Delivery route planning", description: "Sequenced delivery plans for constrained project sites.", delivery: "48-72 hours", availability: "Available" },
      { title: "Fleet coordination", description: "Truck, operator, and delivery window management.", delivery: "Daily", availability: "Available" },
      { title: "Crane slot planning", description: "Crane calendar, access, and logistics coordination.", delivery: "1 week", availability: "Limited slots" }
    ],
    portfolio: [
      { title: "Tangier Port Materials Hub", location: "Tangier", type: "Logistics", status: "Execution", budget: "MAD 12M-18M", date: "Oct 2026" },
      { title: "Northern Crane Fleet", location: "Tetouan", type: "Equipment Logistics", status: "Completed", budget: "MAD 5M-8M", date: "Apr 2026" }
    ],
    team: [
      { name: "Hajar Amrani", role: "Operations Lead", skills: "Logistics, site access, fleet planning" },
      { name: "Mehdi Alaoui", role: "Fleet Coordinator", skills: "Dispatch, compliance, scheduling" }
    ],
    documents: ["Company profile.pdf", "Fleet safety policy.pdf", "Insurance pending.pdf"],
    reviews: commonReviews,
    insights: { fit: 82, reliability: "Moderate-high", capacity: "Good logistics coverage, pending final insurance verification.", risks: ["Insurance verification pending", "Crane slots require early booking"], useCases: ["Site logistics", "Fleet planning", "Crane coordination"], comparison: "Best fit for projects with constrained access or high delivery complexity." }
  },
  {
    slug: "betonpro-materials",
    name: "BetonPro Materials",
    logo: "BPM",
    category: "Material Suppliers",
    verified: true,
    rating: 4.6,
    country: "Morocco",
    city: "Casablanca",
    activeProjects: 12,
    completedProjects: 120,
    employees: 210,
    partners: 43,
    responseRate: "93%",
    responseTime: "Under 3 hours",
    yearsInBusiness: 16,
    description: "Ready-mix concrete, aggregates, and structural material supply for high-volume construction programs.",
    about: "BetonPro Materials supplies ready-mix concrete, aggregates, admixtures, and structural material packages with quality documentation and delivery coordination.",
    status: "Verified",
    services: ["Ready-mix concrete", "Aggregates", "Admixtures", "Quality documentation"],
    industries: ["Residential", "Commercial", "Industrial", "Infrastructure"],
    serviceAreas: ["Casablanca", "Rabat", "Mohammedia", "El Jadida"],
    languages: ["Arabic", "French"],
    certifications: ["Material Quality Certified", "ISO 9001"],
    legalStatus: "Verified supplier registration and quality documentation",
    contact: { person: "Rachid Kabbaj", email: "sales@betonpro.example", phone: "+212 522 800 222", website: "betonpro.example", hours: "Mon-Sat, 06:30-18:30" },
    serviceCards: [
      { title: "Ready-mix supply", description: "Concrete supply with mix design and delivery control.", delivery: "24-72 hours", availability: "Available" },
      { title: "Aggregate packages", description: "Certified aggregates for structural and infrastructure works.", delivery: "2-5 days", availability: "Available" },
      { title: "Quality documents", description: "Batch reports, testing sheets, and material compliance files.", delivery: "Same day", availability: "Available" }
    ],
    portfolio: [
      { title: "Casablanca Villa Concrete Package", location: "Casablanca", type: "Material Supply", status: "Execution", budget: "MAD 2M-4M", date: "Aug 2026" },
      { title: "Rabat Complex Concrete Works", location: "Rabat", type: "Material Supply", status: "Awarded", budget: "MAD 8M-12M", date: "May 2027" }
    ],
    team: [
      { name: "Rachid Kabbaj", role: "Commercial Lead", skills: "BOQ, pricing, supplier coordination" },
      { name: "Imane Lahlou", role: "Quality Manager", skills: "Material testing, compliance" }
    ],
    documents: ["Supplier profile.pdf", "Material certificates.pdf", "Insurance certificate.pdf", "Technical sheets.zip"],
    reviews: commonReviews,
    insights: { fit: 86, reliability: "Strong", capacity: "High-volume material capacity for Casablanca and Rabat corridors.", risks: ["Lead times must be locked before peak pour windows"], useCases: ["Ready-mix supply", "Material compliance", "High-volume concrete"], comparison: "Best fit for projects that need reliable concrete supply with clear documentation." }
  },
  {
    slug: "cranemax-equipment",
    name: "CraneMax Equipment",
    logo: "CME",
    category: "Equipment Rental",
    verified: true,
    rating: 4.5,
    country: "Morocco",
    city: "Tangier",
    activeProjects: 8,
    completedProjects: 76,
    employees: 118,
    partners: 22,
    responseRate: "91%",
    responseTime: "Under 4 hours",
    yearsInBusiness: 12,
    description: "Crane, lift, and heavy equipment rental provider with certified operators and site planning support.",
    about: "CraneMax Equipment provides cranes, lifts, machinery rental, certified operators, maintenance support, and site lifting studies for construction teams.",
    status: "Verified",
    services: ["Crane rental", "Lift equipment", "Certified operators", "Lifting plans"],
    industries: ["Industrial", "Commercial", "Infrastructure"],
    serviceAreas: ["Tangier", "Tetouan", "Rabat", "Casablanca"],
    languages: ["Arabic", "French", "Spanish"],
    certifications: ["Operator Safety Certified", "Equipment Inspection Program"],
    legalStatus: "Verified equipment and operator compliance",
    contact: { person: "Mehdi Alaoui", email: "rental@cranemax.example", phone: "+212 539 700 444", website: "cranemax.example", hours: "Mon-Sat, 07:00-18:00" },
    serviceCards: [
      { title: "Tower crane rental", description: "Crane supply, operator assignment, and lifting coordination.", delivery: "1-3 weeks", availability: "Limited slots" },
      { title: "Mobile lifting support", description: "Mobile cranes and lifts for site operations.", delivery: "3-5 days", availability: "Available" },
      { title: "Lifting plan review", description: "Safety, access, and sequencing study for lifting operations.", delivery: "3 days", availability: "Available" }
    ],
    portfolio: [
      { title: "Tangier Warehouse Steel Lifts", location: "Tangier", type: "Equipment Rental", status: "Booked", budget: "MAD 1M-2M", date: "Sep 2026" },
      { title: "Northern Crane Fleet", location: "Tetouan", type: "Equipment", status: "Completed", budget: "MAD 5M-8M", date: "Apr 2026" }
    ],
    team: [
      { name: "Mehdi Alaoui", role: "Rental Director", skills: "Equipment planning, operations" },
      { name: "Hajar Amrani", role: "Site Logistics", skills: "Access planning, delivery windows" }
    ],
    documents: ["Equipment list.pdf", "Operator certifications.pdf", "Insurance certificate.pdf"],
    reviews: commonReviews,
    insights: { fit: 84, reliability: "Strong", capacity: "Good availability for mobile cranes; tower crane slots require advance booking.", risks: ["Long-lead crane slots can affect execution timelines"], useCases: ["Crane rental", "Lifting planning", "Certified operators"], comparison: "Best fit when lifting plans and certified operations matter as much as equipment availability." }
  },
  {
    slug: "geoconsult-africa",
    name: "GeoConsult Africa",
    logo: "GCA",
    category: "Consultants",
    verified: true,
    rating: 4.8,
    country: "Morocco",
    city: "Agadir",
    activeProjects: 6,
    completedProjects: 58,
    employees: 44,
    partners: 16,
    responseRate: "95%",
    responseTime: "Under 1 business day",
    yearsInBusiness: 14,
    description: "Geotechnical, soil investigation, and construction risk advisory consultancy for complex sites.",
    about: "GeoConsult Africa provides geotechnical investigation, soil analysis, foundation recommendations, and site risk advisory for residential, commercial, and infrastructure projects.",
    status: "Verified",
    services: ["Geotechnical study", "Soil investigation", "Foundation recommendations", "Risk advisory"],
    industries: ["Residential", "Infrastructure", "Industrial", "Hospitality"],
    serviceAreas: ["Agadir", "Marrakech", "Casablanca", "Dakhla"],
    languages: ["Arabic", "French", "English"],
    certifications: ["Geotechnical Consultancy License", "Lab Testing Certified"],
    legalStatus: "Verified consultancy registration and professional insurance",
    contact: { person: "Driss Bennani", email: "studies@geoconsult.example", phone: "+212 528 900 310", website: "geoconsult.example", hours: "Mon-Fri, 08:30-17:30" },
    serviceCards: [
      { title: "Soil investigation", description: "Boreholes, lab testing, and technical reporting.", delivery: "2-4 weeks", availability: "Available" },
      { title: "Foundation advisory", description: "Foundation recommendations and risk mitigation measures.", delivery: "1 week after results", availability: "Available" },
      { title: "Site risk memo", description: "Executive summary of geotechnical risks and next actions.", delivery: "72 hours", availability: "Available" }
    ],
    portfolio: [
      { title: "Agadir Resort Soil Study", location: "Agadir", type: "Geotechnical", status: "Completed", budget: "MAD 600K-900K", date: "Feb 2026" },
      { title: "Marrakech Tower Foundation Review", location: "Marrakech", type: "Consulting", status: "Planning", budget: "MAD 800K-1.2M", date: "May 2026" }
    ],
    team: [
      { name: "Driss Bennani", role: "Geotechnical Director", skills: "Soil mechanics, foundation design" },
      { name: "Sara El Amrani", role: "Lab Manager", skills: "Testing, compliance, reporting" }
    ],
    documents: ["Consultancy profile.pdf", "Lab certification.pdf", "Professional insurance.pdf"],
    reviews: commonReviews,
    insights: { fit: 90, reliability: "High", capacity: "Strong technical capacity for early-stage site risk and foundation advisory.", risks: ["Field investigation scheduling depends on site access"], useCases: ["Soil study", "Foundation advisory", "Risk mitigation"], comparison: "Best fit before design freeze or whenever foundation assumptions affect budget and timeline." }
  }
];

export type MarketplaceCompany = (typeof marketplaceCompanies)[number];
