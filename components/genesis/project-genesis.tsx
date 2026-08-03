"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CircuitBoard, Loader2, Sparkles, X } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { vorqaOfficialAssets } from "@/lib/vorqa-assets";
import type { GenesisQuality } from "./genesis-canvas";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/components/i18n-provider";

const GenesisCanvas = dynamic(() => import("./genesis-canvas").then((mod) => mod.GenesisCanvas), {
  ssr: false,
  loading: () => <GenesisLoader />
});

type ScenePhase = "intro" | "world" | "departing";
type GenesisInfoSection = "overview" | "solutions" | "construction" | "intelligence";

const genesisSectionIds: readonly GenesisInfoSection[] = ["overview", "solutions", "construction", "intelligence"];

const genesisCopy = {
  en: {
    skipIntro: "Skip intro",
    welcome: "Welcome to the future of construction",
    navLabel: "Genesis navigation",
    startAria: "Start building in Vorqa AI",
    enteringAria: "Entering Vorqa workspace",
    nav: ["Overview", "Solutions", "Construction", "Intelligence"],
    enter: "Enter Vorqa AI",
    opening: "Opening sign in",
    platform: "Construction Intelligence Platform",
    headline: ["Build Smarter", "Manage Better", "Deliver with Confidence"],
    description: "VORQA AI brings project management, construction intelligence, document review, risk assessment and executive reporting into one focused workspace.",
    cards: [
      ["AI Planning", "Programme intelligence"],
      ["Risk Monitor", "Active risk control"],
      ["Contract Intelligence", "Document readiness"],
      ["Project Health", "Execution confidence"]
    ],
    assistant: ["Welcome back.", "Ready to build your next project?"]
  },
  fr: {
    skipIntro: "Passer l’introduction",
    welcome: "Bienvenue dans le futur de la construction",
    navLabel: "Navigation Genesis",
    startAria: "Commencer avec Vorqa AI",
    enteringAria: "Accès à l’espace Vorqa",
    nav: ["Aperçu", "Solutions", "Construction", "Intelligence"],
    enter: "Accéder à Vorqa AI",
    opening: "Ouverture de la connexion",
    platform: "Plateforme d’intelligence pour la construction",
    headline: ["Construisez mieux", "Gérez efficacement", "Livrez en confiance"],
    description: "VORQA AI réunit la gestion de projet, l’intelligence de construction, l’analyse documentaire, l’évaluation des risques et les rapports exécutifs dans un espace de travail unique.",
    cards: [
      ["Planification IA", "Intelligence du programme"],
      ["Suivi des risques", "Contrôle actif des risques"],
      ["Intelligence contractuelle", "Préparation documentaire"],
      ["Santé du projet", "Confiance d’exécution"]
    ],
    assistant: ["Bon retour parmi nous.", "Prêt à construire votre prochain projet ?"]
  },
  ar: {
    skipIntro: "تجاوز المقدمة",
    welcome: "مرحباً بك في مستقبل البناء",
    navLabel: "تصفح واجهة جينيسيس",
    startAria: "ابدأ البناء مع Vorqa AI",
    enteringAria: "جارٍ الدخول إلى مساحة Vorqa",
    nav: ["نظرة عامة", "الحلول", "البناء", "الذكاء"],
    enter: "الدخول إلى Vorqa AI",
    opening: "جارٍ فتح تسجيل الدخول",
    platform: "منصة ذكاء البناء",
    headline: ["ابنِ بذكاء", "أدِر بكفاءة", "سلّم بثقة"],
    description: "تجمع VORQA AI إدارة المشاريع وذكاء البناء ومراجعة الوثائق وتقييم المخاطر والتقارير التنفيذية داخل مساحة عمل واحدة ومركزة.",
    cards: [
      ["التخطيط الذكي", "ذكاء البرنامج"],
      ["مراقبة المخاطر", "تحكم نشط في المخاطر"],
      ["ذكاء العقود", "جاهزية الوثائق"],
      ["صحة المشروع", "ثقة التنفيذ"]
    ],
    assistant: ["مرحباً بعودتك.", "هل أنت مستعد لبناء مشروعك القادم؟"]
  }
} as const;

const genesisInfoCopy = {
  en: {
    close: "Close",
    overview: {
      eyebrow: "VORQA AI Overview",
      title: "The construction operating system from planning to decision",
      description: "VORQA AI is a complete workspace for managing construction organizations, projects and operational decisions, supported by project-aware intelligence across the full delivery lifecycle.",
      items: ["Organizations, teams, projects, tasks, timelines and budgets", "Documents, knowledge and construction intelligence reviews", "Marketplace, RFQs, quotations, awards and contracts", "VORA copilot, risks, recommendations and executive reports", "Role-aware workspaces for owners, contractors and engineers"]
    },
    solutions: {
      eyebrow: "VORQA Solutions",
      title: "From project control to intelligent decisions",
      description: "Practical tools support the full operational journey without forcing teams to work across disconnected systems.",
      items: ["Project, task, timeline and budget control", "Contract, BOQ and document intelligence", "Risk, planning and site report reviews", "RFQs, quotations, contracts and marketplace workflows", "Executive reporting and project copilot"]
    },
    construction: {
      eyebrow: "Construction & Real Estate",
      title: "Intelligence across the project lifecycle",
      description: "VORQA helps owners, developers, contractors, engineers, architects and suppliers coordinate work from early planning through handover.",
      items: ["Improve visibility across design and execution", "Identify schedule, cost, quality and safety risks earlier", "Connect documents and approvals to real project context", "Keep teams aligned around the next required action"]
    },
    intelligence: {
      eyebrow: "VORA Intelligence",
      title: "A project-aware construction copilot",
      description: "VORA understands the active organization, project and workspace, then turns available evidence into structured support for better professional decisions.",
      items: ["Review contracts, BOQs, plans and site reports", "Surface risks, missing information and delayed actions", "Prepare summaries, reports and recommendations", "Answer questions using relevant project knowledge", "Support professional judgment without replacing it"]
    }
  },
  fr: {
    close: "Fermer",
    overview: {
      eyebrow: "Vue d’ensemble de VORQA AI",
      title: "Le système opérationnel de la construction, de la planification à la décision",
      description: "VORQA AI est un espace complet pour gérer les organisations, les projets et les décisions opérationnelles, soutenu par une intelligence consciente du contexte pendant tout le cycle de réalisation.",
      items: ["Organisations, équipes, projets, tâches, délais et budgets", "Documents, connaissances et analyses de construction", "Place de marché, RFQ, devis, attributions et contrats", "Copilote VORA, risques, recommandations et rapports exécutifs", "Espaces adaptés aux maîtres d’ouvrage, entreprises et ingénieurs"]
    },
    solutions: {
      eyebrow: "Solutions VORQA",
      title: "Du pilotage de projet aux décisions intelligentes",
      description: "Des outils pratiques accompagnent tout le parcours opérationnel sans disperser les équipes entre plusieurs systèmes.",
      items: ["Pilotage des projets, tâches, délais et budgets", "Intelligence des contrats, BOQ et documents", "Analyse des risques, plannings et rapports de chantier", "RFQ, devis, contrats et place de marché", "Rapports exécutifs et copilote projet"]
    },
    construction: {
      eyebrow: "Construction & Immobilier",
      title: "L’intelligence sur tout le cycle du projet",
      description: "VORQA aide maîtres d’ouvrage, promoteurs, entreprises, ingénieurs, architectes et fournisseurs à coordonner le travail jusqu’à la livraison.",
      items: ["Améliorer la visibilité entre conception et exécution", "Détecter plus tôt les risques de délai, coût, qualité et sécurité", "Relier documents et validations au contexte réel", "Aligner les équipes sur la prochaine action"]
    },
    intelligence: {
      eyebrow: "Intelligence VORA",
      title: "Un copilote qui comprend votre projet",
      description: "VORA comprend l’organisation, le projet et l’espace actifs, puis transforme les preuves disponibles en soutien structuré à la décision.",
      items: ["Examiner contrats, BOQ, plannings et rapports", "Signaler risques, informations manquantes et retards", "Préparer synthèses, rapports et recommandations", "Répondre avec les connaissances pertinentes du projet", "Soutenir le jugement professionnel sans le remplacer"]
    }
  },
  ar: {
    close: "إغلاق",
    overview: {
      eyebrow: "نظرة عامة على VORQA AI",
      title: "نظام تشغيل متكامل للبناء من التخطيط إلى القرار",
      description: "VORQA AI مساحة متكاملة لإدارة مؤسسات البناء والمشاريع والقرارات التشغيلية، مدعومة بذكاء يفهم سياق المشروع خلال دورة الإنجاز كاملة.",
      items: ["المؤسسات والفرق والمشاريع والمهام والجداول والميزانيات", "الوثائق والمعرفة ومراجعات ذكاء البناء", "السوق وطلبات الأسعار والعروض والترسية والعقود", "مساعد VORA والمخاطر والتوصيات والتقارير التنفيذية", "مساحات عمل مناسبة للملاك والمقاولين والمهندسين"]
    },
    solutions: {
      eyebrow: "حلول VORQA",
      title: "من إدارة المشروع إلى القرار الذكي",
      description: "تدعم أدوات عملية رحلة العمل كاملة دون تشتيت الفرق بين أنظمة منفصلة.",
      items: ["إدارة المشاريع والمهام والجداول والميزانيات", "ذكاء العقود وجداول الكميات والوثائق", "مراجعة المخاطر والتخطيط وتقارير الموقع", "طلبات الأسعار والعروض والعقود والسوق", "التقارير التنفيذية ومساعد المشروع"]
    },
    construction: {
      eyebrow: "البناء والعقار",
      title: "ذكاء يغطي دورة حياة المشروع",
      description: "تساعد VORQA الملاك والمطورين والمقاولين والمهندسين والمعماريين والموردين على تنسيق العمل من التخطيط إلى التسليم.",
      items: ["تحسين الرؤية بين التصميم والتنفيذ", "اكتشاف مخاطر الوقت والتكلفة والجودة والسلامة مبكراً", "ربط الوثائق والموافقات بسياق المشروع الحقيقي", "توحيد الفرق حول الإجراء التالي المطلوب"]
    },
    intelligence: {
      eyebrow: "ذكاء VORA",
      title: "مساعد ذكي يفهم سياق مشروعك",
      description: "تفهم VORA المؤسسة والمشروع ومساحة العمل الحالية، ثم تحول الأدلة المتاحة إلى دعم منظم لاتخاذ قرارات مهنية أفضل.",
      items: ["مراجعة العقود وجداول الكميات والخطط وتقارير الموقع", "إظهار المخاطر والمعلومات الناقصة والإجراءات المتأخرة", "إعداد الملخصات والتقارير والتوصيات", "الإجابة اعتماداً على معرفة المشروع ذات الصلة", "دعم القرار المهني دون أن تحل محله"]
    }
  }
} as const;

export function ProjectGenesis() {
  const router = useRouter();
  const { locale } = useI18n();
  const copy = genesisCopy[locale];
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<ScenePhase>("intro");
  const [messageIndex, setMessageIndex] = useState(0);
  const [journeyActive, setJourneyActive] = useState(false);
  const [startHover, setStartHover] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [canvasTimedOut, setCanvasTimedOut] = useState(false);
  const [webglReady, setWebglReady] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [quality, setQuality] = useState<GenesisQuality>("medium");
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugCube, setDebugCube] = useState(false);
  const [missingAssetMode, setMissingAssetMode] = useState(false);
  const [villaVideoFailed, setVillaVideoFailed] = useState(false);
  const [activeInfoSection, setActiveInfoSection] = useState<GenesisInfoSection | null>(null);
  const introRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const debugRef = useRef(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const debug = url.searchParams.get("genesisDebug") === "1" || window.localStorage.getItem("vorqa-genesis-debug") === "1";
    const cube = url.searchParams.get("genesisCube") === "1" || window.localStorage.getItem("vorqa-genesis-cube") === "1";
    const missingAssets = url.searchParams.get("genesisMissingAsset") === "1";
    const webgl = url.searchParams.get("genesisNoWebGL") === "1" ? false : isWebGLAvailable();
    const resolvedQuality = resolveGenesisQuality();
    debugRef.current = debug;
    setDebugEnabled(debug);
    setDebugCube(cube);
    setMissingAssetMode(missingAssets);
    setWebglReady(webgl);
    setQuality(resolvedQuality);
    setIsVisible(document.visibilityState === "visible");
    genesisDebug(debug, "bootstrap", {
      webglReady: webgl,
      quality: resolvedQuality,
      reducedMotion,
      debugCube: cube,
      missingAssets,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    });

    const handleResize = () => {
      const nextQuality = resolveGenesisQuality();
      setQuality(nextQuality);
      genesisDebug(debug, "quality changed", { quality: nextQuality, viewport: `${window.innerWidth}x${window.innerHeight}` });
    };
    const handleVisibility = () => {
      const visible = document.visibilityState === "visible";
      setIsVisible(visible);
      genesisDebug(debug, "visibility changed", { isVisible: visible });
    };
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      genesisDebug(debugRef.current, "reduced motion active; skipping intro");
      setPhase("world");
      return;
    }

    if (window.sessionStorage.getItem("vorqa-genesis-seen") === "true") {
      genesisDebug(debugRef.current, "intro skipped; session already seen");
      setPhase("world");
      return;
    }

    const timeline = gsap.timeline();
    const phaseTimer = window.setTimeout(() => {
      window.sessionStorage.setItem("vorqa-genesis-seen", "true");
      genesisDebug(debugRef.current, "intro timer complete; switching to world");
      setPhase("world");
    }, 3450);

    genesisDebug(debugRef.current, "intro timeline started", { introRefReady: Boolean(introRef.current) });
    timeline
      .fromTo(introRef.current, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 1.15, ease: "power3.out" })
      .to(introRef.current, { opacity: 1, duration: 1.8 })
      .to(introRef.current, {
        opacity: 0,
        scale: 1.03,
        duration: 0.9,
        ease: "power2.inOut"
      });

    return () => {
      genesisDebug(debugRef.current, "intro timeline cleanup");
      window.clearTimeout(phaseTimer);
      timeline.kill();
    };
  }, [reducedMotion]);

  useEffect(() => {
    genesisDebug(debugEnabled, "phase changed", { phase, journeyActive, worldVisible: phase !== "intro" });
  }, [debugEnabled, journeyActive, phase]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % copy.assistant.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [copy.assistant.length]);

  useEffect(() => {
    if (phase !== "world") return;
    genesisDebug(debugEnabled, "world visible", { worldRefReady: Boolean(worldRef.current), reducedMotion });
  }, [debugEnabled, phase, reducedMotion]);

  useEffect(() => {
    if (phase === "intro" || canvasReady) return undefined;
    const timeout = window.setTimeout(() => {
      genesisDebug(debugEnabled, "canvas readiness timeout; showing fallback", { canvasReady, webglReady });
      setCanvasTimedOut(true);
    }, 9000);
    return () => window.clearTimeout(timeout);
  }, [canvasReady, debugEnabled, phase, webglReady]);

  function startBuilding() {
    if (journeyActive) return;
    genesisDebug(debugEnabled, "start building clicked", { phase, quality, webglReady });
    setJourneyActive(true);
    setPhase("departing");

    if (reducedMotion) {
      router.push("/login?next=%2Fdashboard");
      return;
    }

    const navigationFallback = window.setTimeout(() => {
      genesisDebug(debugEnabled, "transition fallback navigation");
      router.push("/login?next=%2Fdashboard");
    }, 2600);

    gsap
      .timeline({
        onComplete: () => {
          window.clearTimeout(navigationFallback);
          router.push("/login?next=%2Fdashboard");
        }
      })
      .to(overlayRef.current, { opacity: 1, duration: 0.55, ease: "power2.out" })
      .to(worldRef.current, { scale: 1.045, filter: "brightness(1.18)", duration: 1.35, ease: "power2.inOut" }, "<")
      .to(worldRef.current, { opacity: 0, duration: 0.42, ease: "power2.in", delay: 0.28 });
  }

  function skipIntro() {
    window.sessionStorage.setItem("vorqa-genesis-seen", "true");
    genesisDebug(debugEnabled, "intro skipped by user");
    setPhase("world");
  }

  return (<AutoLocalizedContent>
    <main className="relative min-h-screen overflow-hidden bg-[#08090A] text-[#F8FAFC]">
      {phase === "intro" ? (
          <motion.section key="intro" className="grid min-h-screen place-items-center bg-[#08090A] px-6">
            <button
              type="button"
              onClick={skipIntro}
              className="absolute left-5 top-5 z-20 rounded-full border border-white/12 bg-white/[0.055] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/72 backdrop-blur-xl transition hover:border-[#D6B36A]/35 hover:text-[#D6B36A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#38BDF8]/35"
            >
              {copy.skipIntro}
            </button>
            <div ref={introRef} className="relative text-center opacity-0">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D6B36A]/10 blur-[72px] sm:h-80 sm:w-80" />
              <div className="relative">
                <VorqaMark />
                <p className="mt-7 text-base font-semibold text-white/78 sm:text-lg">{copy.welcome}</p>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="world"
            ref={worldRef}
            className="relative min-h-screen bg-[#08090A] opacity-100"
            initial={false}
          >
            <WorldErrorBoundary fallback={<WorldFallback onStart={startBuilding} journeyActive={journeyActive} missingAssets={missingAssetMode} />}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(56,189,248,.18),transparent_31%),radial-gradient(circle_at_24%_28%,rgba(214,179,106,.18),transparent_28%),linear-gradient(135deg,#08090A,#0b1018_52%,#08090A)]" />
              {!villaVideoFailed ? (
                <GenesisVillaVideo
                  journeyActive={journeyActive}
                  onReady={() => {
                    setCanvasReady(true);
                    setCanvasTimedOut(false);
                    genesisDebug(debugEnabled, "villa video ready");
                  }}
                  onError={() => {
                    setVillaVideoFailed(true);
                    genesisDebug(debugEnabled, "villa video unavailable; using 3D fallback");
                  }}
                />
              ) : webglReady && !canvasTimedOut ? (
                <GenesisErrorBoundary fallback={<CanvasFallback missingAssets={missingAssetMode} />}>
                  <div className="absolute inset-0 min-h-screen" aria-hidden="true">
                    <GenesisCanvas
                      journeyActive={journeyActive}
                      startHover={startHover}
                      quality={quality}
                      isVisible={isVisible}
                      debugEnabled={debugEnabled}
                      debugCube={debugCube}
                      onReady={() => {
                        setCanvasReady(true);
                        setCanvasTimedOut(false);
                        genesisDebug(debugEnabled, "canvas ready");
                      }}
                    />
                  </div>
                </GenesisErrorBoundary>
              ) : (
                <CanvasFallback missingAssets={missingAssetMode} />
              )}
              <WorldAtmosphere journeyActive={journeyActive} overlayRef={overlayRef} quality={quality} missingAssets={missingAssetMode} />
              <TopBrand
                onStart={startBuilding}
                journeyActive={journeyActive}
                activeSection={activeInfoSection}
                onSectionChange={(section) => setActiveInfoSection((current) => current === section ? null : section)}
              />
              <GenesisInfoPanel section={activeInfoSection} onClose={() => setActiveInfoSection(null)} />
              <FloatingIntelligence quality={quality} />
              <StartPanel onStart={startBuilding} journeyActive={journeyActive} onHoverChange={setStartHover} />
              <VoraAssistant message={copy.assistant[messageIndex]} journeyActive={journeyActive} missingAssets={missingAssetMode} />
            </WorldErrorBoundary>
          </motion.section>
        )}
    </main>
  </AutoLocalizedContent>);
}

function GenesisVillaVideo({
  journeyActive,
  onReady,
  onError
}: {
  journeyActive: boolean;
  onReady: () => void;
  onError: () => void;
}) {
  const onReadyRef = useRef(onReady);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (!frameLoaded) return;
    const revealTimer = window.setTimeout(() => {
      setVideoVisible(true);
      onReadyRef.current();
    }, 7000);
    return () => window.clearTimeout(revealTimer);
  }, [frameLoaded]);

  return (
    <div className="absolute inset-0 min-h-screen overflow-hidden bg-[#08090A]" aria-hidden="true">
      <iframe
        className={`pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0 transition-[filter,transform,opacity] duration-[1400ms] ease-out ${videoVisible ? "opacity-100" : "opacity-0"} ${journeyActive ? "scale-[1.055] brightness-75" : "scale-100 brightness-[0.72]"}`}
        src="https://www.youtube-nocookie.com/embed/KKBqaiA2yH0?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&loop=1&playlist=KKBqaiA2yH0&playsinline=1&rel=0&modestbranding=1&start=20"
        title="Modern Luxury Pool House in California"
        allow="autoplay; encrypted-media"
        tabIndex={-1}
        onLoad={() => setFrameLoaded(true)}
        onError={onError}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,9,10,.88),rgba(8,9,10,.26)_48%,rgba(8,9,10,.46)),linear-gradient(0deg,rgba(8,9,10,.72),transparent_46%)]" />
    </div>
  );
}

function WorldAtmosphere({
  journeyActive,
  overlayRef,
  quality,
  missingAssets
}: {
  journeyActive: boolean;
  overlayRef: React.MutableRefObject<HTMLDivElement | null>;
  quality: GenesisQuality;
  missingAssets: boolean;
}) {
  const particleCount = quality === "high" ? 34 : quality === "medium" ? 18 : 8;
  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }, (_, index) => ({
        id: index,
        top: `${8 + ((index * 19) % 76)}%`,
        left: `${4 + ((index * 29) % 90)}%`,
        delay: `${(index % 9) * 0.3}s`,
        size: index % 5 === 0 ? "h-1.5 w-1.5" : "h-1 w-1"
      })),
    [particleCount]
  );

  return (<AutoLocalizedContent>
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(214,179,106,.20),transparent_26%),radial-gradient(circle_at_76%_28%,rgba(56,189,248,.18),transparent_28%),linear-gradient(90deg,rgba(8,9,10,.94),rgba(8,9,10,.32)_45%,rgba(8,9,10,.72))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.11] [background-image:linear-gradient(rgba(248,250,252,.58)_1px,transparent_1px),linear-gradient(90deg,rgba(248,250,252,.58)_1px,transparent_1px)] [background-size:88px_88px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#08090A] via-[#08090A]/55 to-transparent" />
      <div className="pointer-events-none absolute -left-32 top-12 h-96 w-96 rounded-full bg-[#D6B36A]/16 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-20 h-[28rem] w-[28rem] rounded-full bg-[#38BDF8]/14 blur-3xl" />
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={`pointer-events-none absolute rounded-full bg-[#38BDF8]/70 shadow-[0_0_16px_rgba(56,189,248,.8)] ${particle.size} animate-pulse`}
          style={{ top: particle.top, left: particle.left, animationDelay: particle.delay }}
        />
      ))}
      <div ref={overlayRef} className="pointer-events-none absolute inset-0 opacity-0" aria-hidden>
        {!missingAssets ? <Image src={vorqaOfficialAssets.blueprints.overlay.src} alt="" fill sizes="100vw" className="object-cover opacity-55 mix-blend-screen" /> : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(56,189,248,.22),transparent_32%)]" />
      </div>
      {journeyActive ? <div className="pointer-events-none absolute inset-0 bg-[#38BDF8]/[0.035]" /> : null}
    </>
  </AutoLocalizedContent>);
}

function TopBrand({
  onStart,
  journeyActive,
  activeSection,
  onSectionChange
}: {
  onStart: () => void;
  journeyActive: boolean;
  activeSection: GenesisInfoSection | null;
  onSectionChange: (section: GenesisInfoSection) => void;
}) {
  const { locale } = useI18n();
  const copy = genesisCopy[locale];

  return (
    <header className="absolute inset-x-0 top-0 z-40 border-b border-white/10 bg-[#08090A]/72 px-5 py-4 backdrop-blur-2xl sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <VorqaMark compact />
          <div>
            <p className="text-base font-black tracking-[0.16em] text-white sm:text-xl">VORQA <span className="text-[#D6B36A]">AI</span></p>
            <p className="mt-1 hidden text-[10px] font-bold uppercase tracking-[0.2em] text-[#D6B36A]/80 sm:block">{copy.welcome}</p>
          </div>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-white/62 lg:flex" aria-label={copy.navLabel}>
          {copy.nav.map((item, index) => {
            const section = genesisSectionIds[index];
            const active = activeSection === section;
            return (
              <button
                key={section}
                type="button"
                onClick={() => onSectionChange(section)}
                aria-expanded={active}
                className={`relative rounded-lg px-1 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-[#38BDF8]/55 ${active ? "text-[#D6B36A]" : "text-white/68 hover:text-white"}`}
              >
                {item}
                <span className={`absolute inset-x-1 -bottom-0.5 h-0.5 bg-[#D6B36A] transition-transform ${active ? "scale-x-100" : "scale-x-0"}`} />
              </button>
            );
          })}
        </nav>
        <div className="hidden sm:block">
          <LanguageSelector compact />
        </div>
        <button type="button" onClick={onStart} disabled={journeyActive} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#D6B36A] px-4 text-sm font-black text-[#08090A] shadow-[0_10px_35px_rgba(214,179,106,.24)] transition hover:bg-[#ecd083] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#38BDF8]/40 disabled:opacity-70 sm:px-5">
          {journeyActive ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {copy.enter} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>
    </header>
  );
}

function GenesisInfoPanel({ section, onClose }: { section: GenesisInfoSection | null; onClose: () => void }) {
  const { locale } = useI18n();
  const copy = genesisInfoCopy[locale];

  return (
    <AnimatePresence>
      {section ? (
        <motion.aside
          key={section}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`genesis-${section}-title`}
          className="absolute inset-x-4 top-28 z-50 mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/14 bg-[#080b0f]/92 p-6 shadow-[0_30px_100px_rgba(0,0,0,.65),0_0_45px_rgba(56,189,248,.08)] backdrop-blur-2xl sm:p-8"
          initial={{ opacity: 0, y: -14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.985 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[#D6B36A]/75 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            title={copy.close}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/62 outline-none transition hover:border-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-[#38BDF8]/55 rtl:left-4 rtl:right-auto"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="pr-12 rtl:pl-12 rtl:pr-0">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#D6B36A]">{copy[section].eyebrow}</p>
            <h2 id={`genesis-${section}-title`} className="mt-3 text-2xl font-black leading-tight text-white sm:text-4xl">{copy[section].title}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/66 sm:text-base">{copy[section].description}</p>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {copy[section].items.map((item) => (
              <li key={item} className="flex min-h-14 items-start gap-3 rounded-xl border border-white/9 bg-white/[0.035] px-4 py-3 text-sm font-semibold leading-6 text-white/78">
                <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[#38BDF8]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

function FloatingIntelligence({ quality }: { quality: GenesisQuality }) {
  const { locale } = useI18n();
  const copy = genesisCopy[locale];
  if (quality === "low") return null;

  const cards = [
    { title: copy.cards[0][0], value: "92%", text: copy.cards[0][1], className: "right-[23%] top-[17%]" },
    { title: copy.cards[1][0], value: "78%", text: copy.cards[1][1], className: "right-[7%] top-[22%]" },
    { title: copy.cards[2][0], value: "96%", text: copy.cards[2][1], className: "right-[24%] top-[35%]" },
    { title: copy.cards[3][0], value: "96%", text: copy.cards[3][1], className: "right-[6%] bottom-[27%]" }
  ];

  return (<AutoLocalizedContent>
    <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          className={`group absolute w-56 overflow-hidden rounded-xl border border-[#38BDF8]/25 bg-[#0b1119]/72 p-4 shadow-[0_20px_70px_rgba(0,0,0,.42),0_0_28px_rgba(56,189,248,.09)] backdrop-blur-2xl ${card.className}`}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
          whileHover={{ y: -10, scale: 1.025 }}
          transition={{ opacity: { delay: 0.45 + index * 0.16, duration: 0.75 }, y: { delay: index * 0.2, duration: 5.5, repeat: Infinity, ease: "easeInOut" } }}
        >
          <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#D6B36A]/70 to-transparent opacity-60" />
          <span className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#38BDF8]/12 blur-2xl transition group-hover:bg-[#D6B36A]/16" />
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#38BDF8]/24 bg-[#38BDF8]/10 text-[#38BDF8]">
            <CircuitBoard className="h-5 w-5" />
          </div>
          <div className="flex items-end justify-between gap-3">
            <p className="text-sm font-black text-white">{card.title}</p>
            <motion.span
              className="text-lg font-black text-[#D6B36A]"
              animate={{ opacity: [0.72, 1, 0.72] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.25 }}
            >
              {card.value}
            </motion.span>
          </div>
          <p className="mt-1 text-xs leading-5 text-white/58">{card.text}</p>
        </motion.div>
      ))}
    </div>
  </AutoLocalizedContent>);
}

function StartPanel({
  onStart,
  journeyActive,
  onHoverChange
}: {
  onStart: () => void;
  journeyActive: boolean;
  onHoverChange: (hovered: boolean) => void;
}) {
  const { locale } = useI18n();
  const copy = genesisCopy[locale];
  const isArabic = locale === "ar";

  return (<AutoLocalizedContent>
    <motion.div
      className={`absolute left-5 top-[10%] z-30 w-[min(760px,calc(100vw-2.5rem))] sm:left-8 sm:top-[14%] lg:left-[7%] lg:top-[16%] ${isArabic ? "lg:w-[min(780px,62vw)]" : "lg:w-[min(860px,46vw)]"}`}
      initial={{ opacity: 0, y: 26, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.75, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-[#D6B36A] sm:text-sm">{copy.platform}</p>
      <h1 className={`max-w-[860px] font-black text-white ${isArabic ? "text-[clamp(3rem,6vw,5.5rem)] leading-[1.08]" : "text-[clamp(2.35rem,4.8vw,4.75rem)] leading-[0.98]"}`}>
        {copy.headline[0]}<br />
        <span className="text-[#D6B36A]">{copy.headline[1]}</span><br />
        {copy.headline[2]}
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-white/68 sm:text-lg">
        {copy.description}
      </p>
      <button
        type="button"
        onClick={onStart}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        onFocus={() => onHoverChange(true)}
        onBlur={() => onHoverChange(false)}
        disabled={journeyActive}
        aria-label={journeyActive ? copy.enteringAria : copy.startAria}
        className="group relative mt-7 flex h-14 min-w-52 items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-[#F4D990] via-[#D6B36A] to-[#b78a3d] px-7 text-base font-black text-[#08090A] shadow-[0_0_70px_rgba(214,179,106,.28)] outline-none transition hover:-translate-y-0.5 hover:shadow-[0_0_90px_rgba(214,179,106,.4)] focus-visible:ring-4 focus-visible:ring-[#38BDF8]/45 active:translate-y-px disabled:cursor-wait disabled:opacity-80 sm:text-lg"
      >
        <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
        {journeyActive ? <Loader2 className="relative h-5 w-5 animate-spin" /> : <Sparkles className="relative h-5 w-5" />}
        <span className="relative">{journeyActive ? copy.opening : copy.enter}</span>
        <ArrowRight className="relative h-5 w-5 transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
      </button>
    </motion.div>
  </AutoLocalizedContent>);
}

function VoraAssistant({ message, journeyActive, missingAssets }: { message: string; journeyActive: boolean; missingAssets: boolean }) {
  return (<AutoLocalizedContent>
    <motion.aside
      className="absolute bottom-28 right-4 z-20 hidden w-[min(370px,calc(100vw-2rem))] overflow-hidden rounded-[2rem] border border-[#38BDF8]/20 bg-black/38 p-3 shadow-[0_0_70px_rgba(56,189,248,.16),0_24px_90px_rgba(0,0,0,.42)] backdrop-blur-2xl sm:bottom-32 sm:right-8 sm:block sm:p-4 lg:bottom-10"
      aria-live="polite"
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: journeyActive ? 0.7 : 1, x: 0, scale: 1, y: [0, -6, 0] }}
      transition={{ opacity: { delay: 0.95, duration: 0.7 }, x: { delay: 0.95, duration: 0.7 }, y: { duration: 5.2, repeat: Infinity, ease: "easeInOut" } }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(81,216,255,.7)_1px,transparent_1px)] [background-size:100%_7px]" />
      <motion.span
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-[#38BDF8]/18 to-transparent"
        animate={{ x: ["0%", "320%"] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-3xl border border-[#38BDF8]/30 bg-[#38BDF8]/10 shadow-[0_0_34px_rgba(56,189,248,.2)]">
          <motion.span
            className="absolute inset-1 rounded-3xl border border-[#38BDF8]/30"
            animate={{ opacity: [0.25, 0.8, 0.25], scale: [0.95, 1.06, 0.95] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
          {!missingAssets ? (
            <Image src={vorqaOfficialAssets.vora.avatar.src} alt="VORA assistant" fill sizes="64px" className="object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm font-black text-[#38BDF8]">VORA</div>
          )}
          <span className="absolute bottom-2 right-2 h-3 w-3 rounded-full bg-[#22C783] shadow-[0_0_16px_rgba(34,199,131,.8)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#D6B36A]">VORA</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={message}
              className="mt-1 text-base font-semibold text-white"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              {message}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  </AutoLocalizedContent>);
}

function VorqaMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "relative h-12 w-12" : "mx-auto flex flex-col items-center"}>
      <div className={`${compact ? "h-12 w-12" : "h-32 w-32 sm:h-40 sm:w-40"} relative`}>
        <div className="absolute inset-[-12%] rounded-[28%] bg-[#D6B36A]/20 blur-3xl" />
        <svg viewBox="0 0 100 100" className="relative h-full w-full drop-shadow-[0_0_28px_rgba(214,179,106,.48)]" aria-hidden="true">
          <defs>
            <linearGradient id="genesisGold" x1="18" x2="86" y1="10" y2="90">
              <stop stopColor="#FFF0B8" />
              <stop offset="0.46" stopColor="#D6B36A" />
              <stop offset="1" stopColor="#8C6727" />
            </linearGradient>
          </defs>
          <path d="M14 12h14l22 54 22-54h14L56 88H44L14 12Z" fill="none" stroke="url(#genesisGold)" strokeWidth="7" strokeLinejoin="round" />
          <path d="M35 12h13l10 26 10-26h13L58 68h-8L35 12Z" fill="none" stroke="url(#genesisGold)" strokeWidth="5" strokeLinejoin="round" opacity=".82" />
        </svg>
      </div>
      {!compact ? <h1 className="mt-7 text-4xl font-black tracking-[0.28em] text-white drop-shadow-[0_10px_34px_rgba(214,179,106,.24)] sm:text-6xl">VORQA AI</h1> : null}
    </div>
  );
}

function GenesisLoader() {
  return (<AutoLocalizedContent>
    <div className="absolute inset-0 grid place-items-center bg-[#08090A]">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] px-6 py-5 text-center shadow-[0_28px_90px_rgba(0,0,0,.42)] backdrop-blur-xl">
        <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(214,179,106,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,.7)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative mx-auto h-10 w-10 rounded-2xl border border-[#D6B36A]/30 bg-[#D6B36A]/10 shadow-[0_0_40px_rgba(214,179,106,.24)]" />
        <p className="relative mt-4 text-sm font-black uppercase tracking-[0.24em] text-[#D6B36A]">Vorqa Genesis</p>
        <p className="relative mt-2 text-sm font-bold text-white/68">Preparing cinematic construction scene</p>
        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#D6B36A]" animate={{ x: ["-70%", "105%"] }} transition={{ duration: 1.35, repeat: Infinity, ease: "easeInOut" }} />
        </div>
      </div>
    </div>
  </AutoLocalizedContent>);
}

function CanvasFallback({ missingAssets }: { missingAssets: boolean }) {
  return (<AutoLocalizedContent>
    <div className="absolute inset-0 overflow-hidden bg-[#08090A]" aria-hidden="true">
      {!missingAssets ? <Image src={vorqaOfficialAssets.backgrounds.hero.src} alt="" fill sizes="100vw" className="object-cover opacity-45" /> : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(56,189,248,.22),transparent_30%),radial-gradient(circle_at_20%_25%,rgba(214,179,106,.20),transparent_26%),linear-gradient(90deg,rgba(8,9,10,.94),rgba(8,9,10,.62),rgba(8,9,10,.9))]" />
      {!missingAssets ? <Image src={vorqaOfficialAssets.blueprints.overlay.src} alt="" fill sizes="100vw" className="object-cover opacity-24 mix-blend-screen" /> : null}
    </div>
  </AutoLocalizedContent>);
}

function WorldFallback({ onStart, journeyActive, missingAssets }: { onStart: () => void; journeyActive: boolean; missingAssets: boolean }) {
  return (<AutoLocalizedContent>
    <div className="absolute inset-0 overflow-hidden bg-[#08090A]">
      {!missingAssets ? <Image src={vorqaOfficialAssets.backgrounds.hero.src} alt="" fill sizes="100vw" className="object-cover opacity-70" priority /> : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(56,189,248,.22),transparent_30%),radial-gradient(circle_at_20%_25%,rgba(214,179,106,.20),transparent_26%),linear-gradient(90deg,rgba(8,9,10,.94),rgba(8,9,10,.62),rgba(8,9,10,.9))]" />
      {!missingAssets ? <Image src={vorqaOfficialAssets.blueprints.overlay.src} alt="" fill sizes="100vw" className="object-cover opacity-30 mix-blend-screen" /> : null}
      <div className="relative z-10 flex min-h-screen items-center px-6 py-32 sm:px-10">
        <div className="max-w-xl rounded-[2rem] border border-white/12 bg-black/36 p-6 shadow-[0_30px_90px_rgba(0,0,0,.44)] backdrop-blur-2xl sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#D6B36A]">Project Genesis</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-6xl">From Vision to Reality</h1>
          <p className="mt-5 text-base leading-8 text-white/68">VORA is ready. Your premium construction workspace can start even when advanced 3D rendering is unavailable.</p>
          <div className="mt-7">
            <button
              type="button"
              onClick={onStart}
              disabled={journeyActive}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#F4D990] via-[#D6B36A] to-[#9E7631] px-7 font-black text-[#08090A] outline-none transition hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[#38BDF8]/45 disabled:opacity-75"
            >
              {journeyActive ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              Start Building
            </button>
          </div>
        </div>
      </div>
    </div>
  </AutoLocalizedContent>);
}

class GenesisErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Project Genesis] 3D experience failed", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

class WorldErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Project Genesis] world experience failed", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

function resolveGenesisQuality(): GenesisQuality {
  const width = window.innerWidth;
  const deviceMemory = "deviceMemory" in navigator ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory) : 8;
  const cores = navigator.hardwareConcurrency || 4;
  if (width <= 480 || deviceMemory <= 4 || cores <= 4) return "low";
  if (width <= 1024 || deviceMemory <= 6 || cores <= 6) return "medium";
  return "high";
}

function genesisDebug(enabled: boolean, label: string, payload?: Record<string, unknown>) {
  if (!enabled) return;
  console.debug(`[Project Genesis] ${label}`, payload || {});
}
