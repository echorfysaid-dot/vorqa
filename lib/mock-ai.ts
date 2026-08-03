import type { ToolSlug } from "@/lib/tools";

type Payload = Record<string, string>;

const field = (payload: Payload, key: string, fallback: string) => payload[key]?.trim() || fallback;

export function createMockOutput(tool: ToolSlug, payload: Payload) {
  const language = field(payload, "language", "العربية");

  switch (tool) {
    case "document":
      return [
        `# ${field(payload, "documentType", "وثيقة احترافية")}: ${field(payload, "topic", "موضوع جديد")}`,
        "",
        "## Executive Brief",
        `أعدّت VORA هذه المسودة بلغة ${language} وبنبرة ${field(payload, "tone", "احترافية")} لتقديم تصور واضح وقابل للتنفيذ.`,
        "",
        "## المحاور",
        "- السياق والهدف التجاري.",
        "- النقاط الرئيسية والفرص.",
        "- توصيات تنفيذية بخطوات واضحة.",
        "",
        "## Next Actions",
        "حوّل هذه المسودة إلى مشروع محفوظ، ثم أضف الملاحظات النهائية قبل التصدير."
      ].join("\n");
    case "contract-review":
      return [
        "# Contract Review",
        "",
        "## Executive Summary",
        "VORA prepared a structured construction contract review using the available text and metadata only.",
        "",
        "## Contract Overview",
        field(payload, "documentName", "Uploaded construction contract"),
        "",
        "## Key Clauses",
        "- Clauses are not invented in mock mode. Verify against the original contract.",
        "",
        "## Potential Risks",
        "- Confirm payment terms, delay penalties, warranties, scope boundaries, and attachment references.",
        "",
        "## Missing Information",
        "- Validate parties, dates, governing terms, deliverables, and approval workflow.",
        "",
        "## Recommended Actions",
        "- Request qualified legal review before signature.",
        "- Compare the contract against project scope, budget, and timeline.",
        "- Attach missing schedules, drawings, and specifications before approval."
      ].join("\n");
    case "boq-review":
      return [
        "# BOQ Review",
        "",
        "## Executive Summary",
        "VORA prepared a structured BOQ review using deterministic structure checks and available submitted content.",
        "",
        "## Detected Structure",
        "- Review item descriptions, quantities, units, rates, and amounts where available.",
        "",
        "## Potential Issues",
        "- Missing descriptions, quantities, units, rates, or amounts require manual review.",
        "- Zero or negative values should be verified before tender or award decisions.",
        "- Quantity x rate mismatches should be reconciled against the source BOQ.",
        "",
        "## Cost Risks",
        "- Market price validation was not performed.",
        "- Quantity-surveying certification was not performed.",
        "",
        "## Recommended Actions",
        "- Review flagged rows with the cost controller or quantity surveyor.",
        "- Confirm totals against the original BOQ.",
        "- Resolve duplicated references or descriptions before issuing the package."
      ].join("\n");
    case "risk-assessment":
      return [
        "# Construction Risk Assessment",
        "",
        "## Executive Summary",
        "VORA prepared a structured risk assessment from supplied contract review results, BOQ review results, and project notes.",
        "",
        "## Overall Risk Level",
        "Medium, unless supplied evidence contains high or critical deterministic findings.",
        "",
        "## Risk Matrix",
        "- Probability and impact are derived only from supplied evidence and deterministic validation.",
        "",
        "## Detected Risks",
        "- No unsupported risks are invented in mock mode.",
        "- Review payment, delay, missing information, BOQ completeness, and documentation evidence where supplied.",
        "",
        "## Mitigation Actions",
        "- Assign each high-priority risk to the responsible project owner.",
        "- Validate evidence against the original contract, BOQ, and project notes.",
        "- Escalate urgent risks before approval, tender, or award decisions."
      ].join("\n");
    case "planning-review":
      return [
        "# Planning Review",
        "",
        "## Executive Summary",
        "VORA prepared a structured planning review using only supplied planning text, activities, and metadata.",
        "",
        "## Planning Overview",
        "- This is not a scheduling engine.",
        "- Dates were not calculated and schedules were not optimized.",
        "",
        "## Potential Planning Issues",
        "- Missing milestones require manual review.",
        "- Activities without dependencies or owners require clarification.",
        "- Duplicate activities and incomplete phase grouping should be checked.",
        "",
        "## Recommended Actions",
        "- Confirm phases, milestones, dependencies, owners, and activity descriptions.",
        "- Ask the planning manager to validate the sequence before execution decisions."
      ].join("\n");
    case "site-report-review":
      return [
        "# Site Report Review",
        "",
        "## Executive Summary",
        "VORA prepared a structured site report review using only supplied observations, notes, and metadata.",
        "",
        "## Site Report Overview",
        "- Field observations are not invented in mock mode.",
        "- Accident, delay, and incident claims must be verified against source evidence.",
        "",
        "## Findings",
        "- Review missing dates, responsible persons, attachments, and follow-up status.",
        "- Safety and quality observations are flagged only when supplied text includes those signals.",
        "",
        "## Recommended Actions",
        "- Assign follow-up owners for open observations.",
        "- Attach photos, inspection records, approvals, or site diary evidence where missing.",
        "- Confirm progress notes with the site manager before making execution decisions."
      ].join("\n");
    case "executive-summary":
      return [
        "# Executive Summary",
        "",
        "## Executive Overview",
        "VORA prepared an executive project summary using only supplied Construction Intelligence analyses.",
        "",
        "## Project Health",
        "Project health is derived from available analyses only and should be refreshed when new reviews are completed.",
        "",
        "## Analysis Coverage",
        "- Coverage reflects completed analyses only.",
        "- Missing analyses are listed as evidence gaps, not inferred findings.",
        "",
        "## Priority Actions",
        "- Review high-priority risks already found in completed analyses.",
        "- Complete missing analyses before final investment, award, or execution decisions.",
        "- Refresh the executive summary when new evidence is available."
      ].join("\n");
    case "cv":
      return [
        `# ${field(payload, "fullName", "الاسم الكامل")}`,
        `**${field(payload, "jobTitle", "المسمى الوظيفي")}**`,
        "",
        "## Profile",
        "محترف منظم يركز على النتائج، يمتلك قدرة عالية على حل المشاكل وتحويل الأهداف إلى مخرجات قابلة للقياس.",
        "",
        "## Experience",
        field(payload, "experience", "أضف خبراتك وإنجازاتك الرئيسية هنا."),
        "",
        "## Education",
        field(payload, "education", "أضف الشهادات والتكوينات ذات الصلة."),
        "",
        "## Skills",
        field(payload, "skills", "التواصل، التنظيم، التفكير التحليلي، أدوات رقمية."),
        "",
        `## Languages\n${field(payload, "languages", "العربية، الفرنسية، الإنجليزية")}`
      ].join("\n");
    case "landing-page":
      return [
        `# ${field(payload, "productName", "منتجك")} يجعل النتائج أسرع وأكثر وضوحا`,
        "",
        "## الوعد",
        field(payload, "productDescription", "حل عملي مصمم لتبسيط تجربة العميل وتحسين القرار."),
        "",
        "## الجمهور",
        field(payload, "targetAudience", "رواد الأعمال، المستقلون، والفرق الصغيرة."),
        "",
        "## الفوائد",
        field(payload, "mainBenefits", "- توفير الوقت\n- رفع جودة المخرجات\n- زيادة الثقة عند العملاء"),
        "",
        `## السعر\n${field(payload, "price", "خطة مرنة حسب الحاجة")}`,
        "",
        `**${field(payload, "ctaText", "ابدأ الآن")}**`
      ].join("\n");
    case "business-idea":
      return [
        `# فكرة مشروع في مجال ${field(payload, "industry", "الخدمات الرقمية")}`,
        "",
        "## الفكرة",
        `خدمة متخصصة في سوق ${field(payload, "country", "المغرب")} تستفيد من مهارات: ${field(payload, "skills", "التواصل والتسويق والتنفيذ")}.`,
        "",
        "## نموذج الربح",
        "- اشتراك شهري.",
        "- باقات تنفيذ حسب الطلب.",
        "- خدمات استشارية عالية القيمة.",
        "",
        `## الانطلاق\nابدأ بميزانية ${field(payload, "budget", "محدودة")} عبر صفحة هبوط واختبار عرض أولي.`,
        "",
        `## الهدف\n${field(payload, "goal", "بناء مصدر دخل قابل للنمو خلال 90 يوما.")}`
      ].join("\n");
    case "marketing":
      return [
        `# حملة تسويقية لـ ${field(payload, "brand", "علامتك التجارية")}`,
        "",
        "## Core Message",
        field(payload, "offer", "عرض واضح يساعد العميل على حل مشكلة محددة بسرعة وثقة."),
        "",
        `## Channel\n${field(payload, "channel", "Instagram")}`,
        "",
        "## Copy",
        "حوّل اهتمام العملاء إلى قرارات. جرّب العرض اليوم واحصل على تجربة أبسط وأكثر احترافية.",
        "",
        "## CTA",
        "راسلنا الآن وابدأ بخطوتك الأولى."
      ].join("\n");
  }
}
