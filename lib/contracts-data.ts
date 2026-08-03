export const demoContracts = [
  {
    id: "CON-1001",
    title: "Luxury Villa Casablanca execution contract",
    linkedRfq: "RFQ-1001",
    winningCompany: "Atlas Construction Group",
    project: "Luxury Villa Casablanca",
    value: "MAD 10.8M",
    status: "Active",
    startDate: "05 August 2026",
    endDate: "30 January 2027",
    category: "Construction execution",
    expiringIn: "196 days",
    summary: "Execution contract for structural works, site management, reporting, and coordinated delivery following RFQ award preview.",
    milestones: [
      { title: "Contract signature", date: "05 August 2026", status: "Complete", progress: 100 },
      { title: "Project kickoff", date: "12 August 2026", status: "Scheduled", progress: 35 },
      { title: "Structural frame", date: "30 October 2026", status: "Pending", progress: 0 },
      { title: "MEP coordination", date: "20 November 2026", status: "Pending", progress: 0 },
      { title: "Completion handover", date: "30 January 2027", status: "Pending", progress: 0 }
    ],
    payments: [
      { label: "Advance payment", amount: "MAD 2.16M", due: "05 August 2026", status: "Pending approval" },
      { label: "Structural milestone", amount: "MAD 3.24M", due: "30 October 2026", status: "Planned" },
      { label: "MEP coordination", amount: "MAD 2.16M", due: "20 November 2026", status: "Planned" },
      { label: "Final handover", amount: "MAD 3.24M", due: "30 January 2027", status: "Planned" }
    ],
    deliverables: ["Execution schedule", "Weekly progress reports", "Quality inspection logs", "Safety compliance register", "Handover documentation"],
    parties: {
      client: { name: "Atlas Development Office", contact: "Yassine El Mansouri", responsibilities: ["Approval governance", "Payment authorization", "Scope decisions"] },
      contractor: { name: "Atlas Construction Group", contact: "Nadia Benali", responsibilities: ["Site execution", "Reporting", "Quality and safety compliance"] }
    },
    timeline: [
      { title: "Signature", date: "05 August 2026", text: "Contract signature and initial approval package." },
      { title: "Kickoff", date: "12 August 2026", text: "Kickoff meeting, reporting cadence, and site mobilization." },
      { title: "Milestone 1", date: "30 October 2026", text: "Structural frame milestone and first major payment event." },
      { title: "Completion", date: "30 January 2027", text: "Handover, final documentation, and closeout." },
      { title: "Warranty period", date: "Feb 2027 - Feb 2029", text: "Warranty monitoring and defect liability period." }
    ],
    activity: ["Contract generated from RFQ-1001 award preview", "VORA flagged payment checkpoint wording", "Draft attachments placeholder prepared", "Milestone schedule reviewed"],
    insights: {
      missingClauses: ["Liquidated damages wording", "Variation approval thresholds", "Dispute escalation timeline"],
      deliveryRisks: ["Long-lead materials may affect structural milestone", "Weekly reporting must be enforced early"],
      budgetRisks: ["Logistics cost exposure needs a cap", "Variation approval should be linked to budget owner"],
      checkpoints: ["Kickoff checklist", "Monthly budget review", "Milestone acceptance meeting", "Warranty closeout review"],
      compliance: "Core party, value, timeline, payment, and deliverable fields are present. Legal review remains required before real signature."
    }
  },
  {
    id: "CON-1002",
    title: "Rabat engineering review agreement",
    linkedRfq: "RFQ-1002",
    winningCompany: "NorthBuild Engineering",
    project: "Residential Complex Rabat",
    value: "MAD 1.6M",
    status: "Draft",
    startDate: "10 August 2026",
    endDate: "30 September 2026",
    category: "Engineering services",
    expiringIn: "Draft",
    summary: "Draft agreement for engineering validation and permit package review.",
    milestones: [],
    payments: [],
    deliverables: ["Engineering review memo", "Permit blocker register", "Submission checklist"],
    parties: {
      client: { name: "Atlas Development Office", contact: "Nadia Benali", responsibilities: ["Project inputs", "Review approvals"] },
      contractor: { name: "NorthBuild Engineering", contact: "Amal Benjelloun", responsibilities: ["Engineering review", "Technical reporting"] }
    },
    timeline: [],
    activity: ["Draft created", "Scope pending validation"],
    insights: {
      missingClauses: ["Review acceptance criteria"],
      deliveryRisks: ["Permit deadline compression"],
      budgetRisks: ["Additional review cycles not priced"],
      checkpoints: ["Scope freeze", "Draft report review"],
      compliance: "Draft contract requires final scope validation."
    }
  },
  {
    id: "CON-1003",
    title: "Tangier materials supply contract",
    linkedRfq: "RFQ-1003",
    winningCompany: "BetonPro Materials",
    project: "Industrial Warehouse Tangier",
    value: "MAD 3.2M",
    status: "Completed",
    startDate: "01 May 2026",
    endDate: "20 July 2026",
    category: "Material supply",
    expiringIn: "Completed",
    summary: "Completed material supply agreement for warehouse execution package.",
    milestones: [],
    payments: [],
    deliverables: ["Material certificates", "Delivery notes", "Final compliance package"],
    parties: {
      client: { name: "Atlas Development Office", contact: "Karim Berrada", responsibilities: ["Supplier coordination", "Payment approval"] },
      contractor: { name: "BetonPro Materials", contact: "Rachid Kabbaj", responsibilities: ["Supply delivery", "Quality documents"] }
    },
    timeline: [],
    activity: ["Contract completed", "Final compliance package received"],
    insights: {
      missingClauses: [],
      deliveryRisks: [],
      budgetRisks: [],
      checkpoints: ["Archive closeout package"],
      compliance: "Completed contract archive is ready for internal review."
    }
  },
  {
    id: "CON-1004",
    title: "GeoConsult advisory contract",
    linkedRfq: "RFQ-1004",
    winningCompany: "GeoConsult Africa",
    project: "Office Tower Marrakech",
    value: "MAD 820K",
    status: "Expiring",
    startDate: "01 July 2026",
    endDate: "25 July 2026",
    category: "Consulting",
    expiringIn: "8 days",
    summary: "Geotechnical advisory contract nearing closeout.",
    milestones: [],
    payments: [],
    deliverables: ["Soil report", "Foundation advisory memo", "Risk summary"],
    parties: {
      client: { name: "Atlas Development Office", contact: "Salma Idrissi", responsibilities: ["Design coordination", "Report review"] },
      contractor: { name: "GeoConsult Africa", contact: "Driss Bennani", responsibilities: ["Technical advisory", "Risk reporting"] }
    },
    timeline: [],
    activity: ["Final report pending", "Warranty terms under review"],
    insights: {
      missingClauses: ["Report reliance limitation"],
      deliveryRisks: ["Final advisory memo due soon"],
      budgetRisks: ["Additional borehole work not covered"],
      checkpoints: ["Final report acceptance", "Closeout review"],
      compliance: "Contract requires closeout confirmation before expiry."
    }
  }
];

export type DemoContract = (typeof demoContracts)[number];
