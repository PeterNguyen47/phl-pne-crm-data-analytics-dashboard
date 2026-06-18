import { ChangeEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Database,
  Download,
  Eye,
  FileJson,
  FileSpreadsheet,
  FileText,
  Gauge,
  GitBranch,
  HeartHandshake,
  Landmark,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Users,
  Wrench,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  airportProfiles,
  capabilityMap,
  customerSegments,
  dataAssets,
  decisions,
  experienceMetricDefinitions,
  feedConnections,
  feedbackChannels,
  forecastSignals,
  guestPrograms,
  intelligenceCycle,
  insights,
  journeyTouchpoints,
  kpiMetrics,
  privacyControls,
  roadmap,
  serviceThemes,
  sourceQualityScores,
  sourceRefs,
  stakeholderWorkstreams,
} from "./data/dashboardData";
import type {
  AirportCode,
  CrmDataAsset,
  CrmFeedConnection,
  CustomerSegment,
  DecisionItem,
  ExperienceMetricDefinition,
  FeedbackChannel,
  ForecastSignal,
  GuestProgram,
  IntelligenceCycleStep,
  InsightItem,
  JourneyTouchpoint,
  KpiMetric,
  PrivacyControl,
  RoadmapItem,
  ServiceTheme,
  SourceKind,
  SourceQualityScore,
  StakeholderWorkstream,
  Status,
} from "./types/dashboard";

type TabId = "cockpit" | "journey" | "programs" | "governance";
type FilterLevel = "all" | "action" | "watch";
type ReportFormat = "csv" | "json" | "md";

interface ReportRow {
  section: string;
  name: string;
  [key: string]: string | number | undefined;
}

interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  scope: string;
  rows: ReportRow[];
}

interface TemplateFieldProfile {
  name: string;
  mapped: boolean;
  dataType: "Quantitative" | "Qualitative" | "Date/Time" | "Identifier" | "Unknown";
}

interface TemplateProfile {
  fileName: string;
  uploadedAt: string;
  rowCount: number;
  fields: TemplateFieldProfile[];
}

const tabs: Array<{ id: TabId; label: string; icon: typeof Gauge }> = [
  { id: "cockpit", label: "CRM Intelligence Cockpit", icon: Gauge },
  { id: "journey", label: "Passenger Journey & Feedback", icon: MessageSquareText },
  { id: "programs", label: "Experience Programs & Stakeholders", icon: HeartHandshake },
  { id: "governance", label: "CRM Data Strategy & Governance", icon: ShieldCheck },
];

const airportOptions: Array<{ value: AirportCode; label: string; description: string }> = [
  { value: "ALL", label: "PHL + PNE", description: "Portfolio view across passenger and relationship-management lenses." },
  { value: "PHL", label: "PHL", description: "Passenger journey, feedback, accessibility, operations, and digital touchpoints." },
  { value: "PNE", label: "PNE", description: "Reliever-airport relationship management for pilots, tenants, and corporate aviation." },
];

const statusText: Record<Status, string> = {
  normal: "On Track",
  warning: "Watch",
  critical: "Action",
};

const statusColor: Record<Status, string> = {
  normal: "#25805a",
  warning: "#b76500",
  critical: "#b42318",
};

const knownTemplateColumns = new Set([
  "case id",
  "feedback id",
  "survey id",
  "airport",
  "terminal",
  "journey stage",
  "theme",
  "sentiment",
  "owner",
  "response date",
  "created date",
  "closed date",
  "resolution",
  "program",
  "accessibility",
  "language",
  "contact type",
  "satisfaction",
  "sla",
]);

const maturityTrend = [
  { month: "Now", readiness: 48, privacy: 46, adoption: 42 },
  { month: "30d", readiness: 58, privacy: 56, adoption: 51 },
  { month: "60d", readiness: 69, privacy: 68, adoption: 63 },
  { month: "90d", readiness: 78, privacy: 76, adoption: 72 },
];

function scoreQuality(item: SourceQualityScore) {
  return Math.round((item.completeness + item.freshness + item.lineage + item.stewardship + item.privacyReadiness) / 5);
}

function sourceClass(source: SourceKind) {
  return source.toLowerCase().replace(/\s+/g, "-");
}

function scopedByAirport<T extends { airport: AirportCode }>(items: T[], airport: AirportCode) {
  return items.filter((item) => airport === "ALL" || item.airport === airport || item.airport === "ALL");
}

function matchesFilter(status: Status, filter: FilterLevel) {
  if (filter === "all") return true;
  if (filter === "action") return status === "critical";
  return status === "warning";
}

function matchesDecisionFilter(severity: DecisionItem["severity"], filter: FilterLevel) {
  if (filter === "all") return true;
  if (filter === "action") return severity === "Action";
  return severity === "Watch";
}

function toCsv(rows: ReportRow[]) {
  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set<string>()));
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

function toMarkdown(report: ReportDefinition) {
  const lines = [`# ${report.title}`, "", report.description, "", `Scope: ${report.scope}`, ""];
  report.rows.forEach((row, index) => {
    lines.push(`## ${index + 1}. ${row.name}`);
    Object.entries(row).forEach(([key, value]) => lines.push(`- ${key}: ${value}`));
    lines.push("");
  });
  return lines.join("\n");
}

function safeFilename(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function downloadReport(report: ReportDefinition, format: ReportFormat) {
  const body =
    format === "csv"
      ? toCsv(report.rows)
      : format === "json"
        ? JSON.stringify({ title: report.title, scope: report.scope, rows: report.rows }, null, 2)
        : toMarkdown(report);
  const mime =
    format === "csv" ? "text/csv;charset=utf-8" : format === "json" ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8";
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFilename(report.title)}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function reportRow(section: string, name: string, values: Omit<ReportRow, "section" | "name">): ReportRow {
  return { section, name, ...values };
}

function parseCsv(text: string) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.replace(/^"|"$/g, "").trim()));
  return { headers: rows[0] ?? [], rows: rows.slice(1) };
}

function inferFieldType(values: string[]): TemplateFieldProfile["dataType"] {
  const samples = values.filter(Boolean).slice(0, 20);
  if (!samples.length) return "Unknown";
  if (samples.every((value) => /^\d+(\.\d+)?$/.test(value))) return "Quantitative";
  if (samples.every((value) => !Number.isNaN(Date.parse(value)))) return "Date/Time";
  if (samples.some((value) => /^[A-Z0-9_-]{5,}$/i.test(value)) && samples.length <= 8) return "Identifier";
  return "Qualitative";
}

function profileTemplate(fileName: string, headers: string[], rows: string[][]): TemplateProfile {
  const fields = headers.map((header, index) => {
    const normalized = header.toLowerCase().trim();
    return {
      name: header,
      mapped: knownTemplateColumns.has(normalized),
      dataType: inferFieldType(rows.map((row) => row[index] ?? "")),
    };
  });
  return {
    fileName,
    uploadedAt: new Date().toLocaleString(),
    rowCount: rows.length,
    fields,
  };
}

function parseTemplate(fileName: string, text: string): TemplateProfile {
  if (fileName.toLowerCase().endsWith(".json")) {
    const parsed = JSON.parse(text) as unknown;
    const records = Array.isArray(parsed) ? parsed : Array.isArray((parsed as { rows?: unknown[] }).rows) ? (parsed as { rows: unknown[] }).rows : [];
    const objectRows = records.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null);
    const headers = Array.from(objectRows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()));
    const rows = objectRows.map((row) => headers.map((header) => String(row[header] ?? "")));
    return profileTemplate(fileName, headers, rows);
  }
  const { headers, rows } = parseCsv(text);
  return profileTemplate(fileName, headers, rows);
}

function predictReadiness(template?: TemplateProfile) {
  if (!template) {
    return {
      score: 58,
      confidence: 44,
      risk: "No uploaded CRM template yet; forecast uses fixture coverage only.",
      action: "Upload a survey, CRM, accessibility, or PNE service template to classify fields and privacy risk.",
    };
  }
  const fieldCount = Math.max(template.fields.length, 1);
  const mapped = template.fields.filter((field) => field.mapped).length;
  const quantitative = template.fields.filter((field) => field.dataType === "Quantitative").length;
  const identifiers = template.fields.filter((field) => field.dataType === "Identifier").length;
  const mappedCoverage = mapped / fieldCount;
  const score = Math.min(94, Math.round(48 + mappedCoverage * 34 + Math.min(template.rowCount, 20) + quantitative * 2 - identifiers * 3));
  const confidence = Math.min(92, Math.round(38 + mappedCoverage * 32 + Math.min(template.rowCount, 25)));
  return {
    score,
    confidence,
    risk:
      identifiers > 1
        ? "Potential identifier fields require privacy review before executive reporting."
        : mappedCoverage < 0.5
          ? "Template contains many custom fields; map them to journey stage, theme, owner, and response outcomes."
          : "Template aligns well to the CRM reporting model; next risk is cadence and source ownership.",
    action:
      mappedCoverage < 0.5
        ? "Create a field crosswalk and classify custom fields as qualitative, quantitative, date, or restricted."
        : "Approve as a candidate recurring CRM reporting feed after owner and privacy review.",
  };
}

function buildReports(scope: AirportCode): ReportDefinition[] {
  const kpiRows = (kpiMetrics[scope] ?? kpiMetrics.ALL).map((metric) =>
    reportRow("KPI", metric.label, {
      value: metric.value,
      target: metric.target,
      delta: metric.delta,
      status: statusText[metric.status],
      source: metric.source,
      description: metric.description,
    }),
  );
  const experienceMetricRows = experienceMetricDefinitions.map((metric) =>
    reportRow("Experience metric", metric.metric, {
      currentValue: metric.currentValue,
      target: metric.target,
      executiveQuestion: metric.executiveQuestion,
      dataInputs: metric.dataInputs.join(" | "),
      decisionUse: metric.decisionUse,
      status: statusText[metric.status],
      source: metric.source,
    }),
  );
  const segmentRows = scopedByAirport(customerSegments, scope).map((segment) =>
    reportRow("Passenger segment", segment.segment, {
      airport: segment.airport,
      behavioralSignal: segment.behavioralSignal,
      crmDataNeeded: segment.crmDataNeeded,
      insightUse: segment.insightUse,
      source: segment.source,
    }),
  );
  const forecastRows = scopedByAirport(forecastSignals, scope).map((forecast) =>
    reportRow("Forecast signal", forecast.forecastArea, {
      airport: forecast.airport,
      leadingIndicators: forecast.leadingIndicators.join(" | "),
      predictedRisk: forecast.predictedRisk,
      executiveMove: forecast.executiveMove,
      confidence: forecast.confidence,
      status: statusText[forecast.status],
      source: forecast.source,
    }),
  );
  const cycleRows = scopedByAirport(intelligenceCycle, scope).map((step) =>
    reportRow("Customer intelligence cycle", step.step, {
      purpose: step.purpose,
      dashboardSignal: step.dashboardSignal,
      owner: step.owner,
      output: step.output,
      source: step.source,
    }),
  );
  const feedbackRows = scopedByAirport(feedbackChannels, scope).map((channel) =>
    reportRow("Feedback channel", channel.channel, {
      owner: channel.owner,
      volume: channel.volume,
      responseRate: channel.responseRate,
      medianResponseHours: channel.medianResponseHours,
      sentiment: channel.sentiment,
      theme: channel.topTheme,
      status: statusText[channel.status],
      source: channel.source,
    }),
  );
  const journeyRows = scopedByAirport(journeyTouchpoints, scope).map((touchpoint) =>
    reportRow("Journey touchpoint", touchpoint.stage, {
      publicSignal: touchpoint.publicSignal,
      internalDataNeeded: touchpoint.internalDataNeeded,
      insight: touchpoint.insight,
      risk: statusText[touchpoint.experienceRisk],
      source: touchpoint.source,
    }),
  );
  const programRows = scopedByAirport(guestPrograms, scope).map((program) =>
    reportRow("Guest program", program.program, {
      owner: program.owner,
      publicBasis: program.publicBasis,
      kpiQuestion: program.kpiQuestion,
      internalMeasureNeeded: program.internalMeasureNeeded,
      status: statusText[program.status],
      source: program.source,
    }),
  );
  const qualityRows = scopedByAirport(sourceQualityScores, scope).map((score) =>
    reportRow("Source quality", score.sourceName, {
      owner: score.owner,
      score: scoreQuality(score),
      completeness: score.completeness,
      freshness: score.freshness,
      lineage: score.lineage,
      stewardship: score.stewardship,
      privacyReadiness: score.privacyReadiness,
      nextControl: score.nextControl,
      escalationRule: score.escalationRule,
      source: score.source,
    }),
  );
  const feedRows = scopedByAirport(feedConnections, scope).map((feed) =>
    reportRow("CRM feed", feed.feedName, {
      owner: feed.accountableOwner,
      currentState: feed.currentState,
      refreshTarget: feed.refreshTarget,
      firstMetrics: feed.firstMetrics.join(" | "),
      qualityGate: feed.qualityGate,
      privacyControl: feed.privacyControl,
      executiveUse: feed.executiveUse,
      status: statusText[feed.status],
      source: feed.source,
    }),
  );
  const decisionRows = decisions.map((decision) =>
    reportRow("Decision", decision.title, {
      domain: decision.domain,
      severity: decision.severity,
      owner: decision.owner,
      dueDate: decision.dueDate,
      impact: decision.impact,
      recommendation: decision.recommendation,
      source: decision.source,
    }),
  );
  const sourceRows = sourceRefs.map((source) =>
    reportRow("Citation", source.label, {
      url: source.url,
      provenance: source.kind,
      roleUse: source.roleUse,
    }),
  );

  return [
    {
      id: "cockpit",
      title: `${scope} CRM Intelligence Cockpit Report`,
      description: "CRM readiness, passenger insight KPIs, source quality, and executive decision signals.",
      scope,
      rows: [...kpiRows, ...experienceMetricRows, ...cycleRows, ...qualityRows, ...decisionRows],
    },
    {
      id: "journey",
      title: `${scope} Passenger Journey And Feedback Report`,
      description: "Feedback channels, journey touchpoints, service themes, response SLA, and internal data needs.",
      scope,
      rows: [...feedbackRows, ...journeyRows, ...segmentRows, ...forecastRows],
    },
    {
      id: "programs",
      title: `${scope} Experience Programs And Stakeholders Report`,
      description: "Guest programs, stakeholder workstreams, shared metrics, adoption needs, and program questions.",
      scope,
      rows: [...programRows],
    },
    {
      id: "governance",
      title: `${scope} CRM Data Governance And Feed Readiness Report`,
      description: "CRM data assets, feed connections, source quality, privacy controls, and first controls.",
      scope,
      rows: [...feedRows, ...cycleRows, ...qualityRows],
    },
    {
      id: "evidence",
      title: `${scope} Evidence Chain Citation Report`,
      description: "Public facts, capability requirements, CRM questions, internal data requests, and decisions supported.",
      scope,
      rows: [
        ...insights.map((insight) =>
          reportRow("Evidence chain", insight.postingRequirement, {
            publicObservation: insight.publicObservation,
            citation: insight.citationLabel,
            citationUrl: insight.citationUrl,
            businessQuestion: insight.businessQuestion,
            internalDataNeeded: insight.internalDataNeeded,
            decisionSupported: insight.decisionSupported,
            source: insight.source,
          }),
        ),
        ...sourceRows,
      ],
    },
  ];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("cockpit");
  const [airport, setAirport] = useState<AirportCode>("ALL");
  const [filter, setFilter] = useState<FilterLevel>("all");
  const [selectedAssetId, setSelectedAssetId] = useState(dataAssets[0].id);
  const [template, setTemplate] = useState<TemplateProfile>();
  const [templateError, setTemplateError] = useState("");

  const scopedKpis = kpiMetrics[airport] ?? kpiMetrics.ALL;
  const scopedFeedback = useMemo(() => scopedByAirport(feedbackChannels, airport).filter((item) => matchesFilter(item.status, filter)), [airport, filter]);
  const scopedJourney = useMemo(() => scopedByAirport(journeyTouchpoints, airport).filter((item) => matchesFilter(item.experienceRisk, filter)), [airport, filter]);
  const scopedThemes = useMemo(() => scopedByAirport(serviceThemes, airport).filter((item) => matchesFilter(item.status, filter)), [airport, filter]);
  const scopedSegments = useMemo(() => scopedByAirport(customerSegments, airport), [airport]);
  const scopedForecasts = useMemo(() => scopedByAirport(forecastSignals, airport).filter((item) => matchesFilter(item.status, filter)), [airport, filter]);
  const scopedPrograms = useMemo(() => scopedByAirport(guestPrograms, airport).filter((item) => matchesFilter(item.status, filter)), [airport, filter]);
  const scopedStakeholders = useMemo(() => scopedByAirport(stakeholderWorkstreams, airport).filter((item) => matchesFilter(item.status, filter)), [airport, filter]);
  const scopedAssets = useMemo(() => scopedByAirport(dataAssets, airport).filter((item) => matchesFilter(item.qualityStatus, filter)), [airport, filter]);
  const scopedFeeds = useMemo(() => scopedByAirport(feedConnections, airport).filter((item) => matchesFilter(item.status, filter)), [airport, filter]);
  const scopedQuality = useMemo(() => scopedByAirport(sourceQualityScores, airport).filter((item) => matchesFilter(item.status, filter)), [airport, filter]);
  const scopedDecisions = useMemo(() => decisions.filter((item) => matchesDecisionFilter(item.severity, filter)), [filter]);
  const scopedProfile = airportProfiles.find((profile) => profile.code === airport) ?? airportProfiles[0];
  const reports = useMemo(() => buildReports(airport), [airport]);
  const selectedAsset = scopedAssets.find((asset) => asset.id === selectedAssetId) ?? scopedAssets[0] ?? dataAssets[0];
  const prediction = useMemo(() => predictReadiness(template), [template]);

  async function handleTemplateUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setTemplate(parseTemplate(file.name, text));
      setTemplateError("");
    } catch (error) {
      setTemplate(undefined);
      setTemplateError(error instanceof Error ? error.message : "Unable to read uploaded template.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="app-shell">
      <header className="service-bar">
        <span>City of Philadelphia / Department of Aviation</span>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">CRM and passenger analytics prototype</span>
          <h1>PHL + PNE CRM & Passenger Insights Dashboard</h1>
          <p>
            Public-source dashboard prototype showing how airport CRM, engagement channels, passenger feedback,
            accessibility signals, digital touchpoints, and governed data platforms can convert isolated experiences
            into executive decisions without overstating private data access.
          </p>
        </div>
        <div className="hero-summary">
          <MetricMini label="Mission" value="Insight to action" source="Derived From Public" />
          <MetricMini label="Core CX KPIs" value={String(experienceMetricDefinitions.length)} source="Illustrative Model" />
          <MetricMini label="Privacy lane" value="Required" source="Illustrative Model" />
        </div>
      </section>

      <section className="control-strip" aria-label="Dashboard filters">
        <div>
          <h2>Filtered Scope</h2>
          <p>Airport and severity filters update KPIs, journeys, reports, feeds, quality controls, and decisions.</p>
        </div>
        <div className="segmented" role="group" aria-label="Airport filter">
          {airportOptions.map((option) => (
            <button key={option.value} className={airport === option.value ? "active" : ""} onClick={() => setAirport(option.value)} title={option.description}>
              {option.label}
            </button>
          ))}
        </div>
        <div className="segmented severity" role="group" aria-label="Severity filter">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
            All
          </button>
          <button className={filter === "action" ? "active action" : "action"} onClick={() => setFilter("action")}>
            <AlertTriangle size={15} /> Action
          </button>
          <button className={filter === "watch" ? "active watch" : "watch"} onClick={() => setFilter("watch")}>
            <Eye size={15} /> Watch
          </button>
        </div>
      </section>

      <ReportHub reports={reports} onTemplateUpload={handleTemplateUpload} template={template} templateError={templateError} prediction={prediction} />
      <ProvenanceExplainer />

      <nav className="tabs" aria-label="Dashboard views">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === "cockpit" && (
        <CockpitView
          profile={scopedProfile}
          kpis={scopedKpis}
          quality={scopedQuality}
          feeds={scopedFeeds}
          insights={insights}
          experienceMetrics={experienceMetricDefinitions}
          cycle={intelligenceCycle}
          decisions={scopedDecisions}
        />
      )}
      {activeTab === "journey" && (
        <JourneyView
          feedback={scopedFeedback}
          journey={scopedJourney}
          themes={scopedThemes}
          segments={scopedSegments}
          forecasts={scopedForecasts}
        />
      )}
      {activeTab === "programs" && <ProgramsView programs={scopedPrograms} stakeholders={scopedStakeholders} />}
      {activeTab === "governance" && (
        <GovernanceView
          assets={scopedAssets}
          selectedAsset={selectedAsset}
          onSelectAsset={setSelectedAssetId}
          feeds={scopedFeeds}
          quality={scopedQuality}
          controls={privacyControls}
          roadmap={roadmap}
          cycle={intelligenceCycle}
          template={template}
          prediction={prediction}
          onTemplateUpload={handleTemplateUpload}
        />
      )}

      <footer className="footer">
        <div className="source-links">
          {sourceRefs.map((source) => (
            <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
              {source.label}
            </a>
          ))}
        </div>
        <p>
          UI/UX direction references <a href="https://ui.phila.gov/" target="_blank" rel="noreferrer">PhilaUI</a> and City of Philadelphia civic interface patterns.
        </p>
      </footer>
    </main>
  );
}

function MetricMini({ label, value, source }: { label: string; value: string; source: SourceKind }) {
  return (
    <article className="metric-mini">
      <span>{label}</span>
      <strong>{value}</strong>
      <SourceBadge source={source} />
    </article>
  );
}

function SourceBadge({ source }: { source: SourceKind }) {
  return <span className={`source-badge ${sourceClass(source)}`}>{source}</span>;
}

function StatusPill({ status }: { status: Status }) {
  return (
    <span className={`status-pill ${status}`}>
      <span />
      {statusText[status]}
    </span>
  );
}

function ReportHub({
  reports,
  onTemplateUpload,
  template,
  templateError,
  prediction,
}: {
  reports: ReportDefinition[];
  onTemplateUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  template?: TemplateProfile;
  templateError: string;
  prediction: ReturnType<typeof predictReadiness>;
}) {
  return (
    <section className="panel report-hub">
      <PanelHeading icon={Download} title="Executive reports and CRM template intake" meta="CSV, JSON, Markdown, and upload-based readiness scoring" />
      <div className="report-grid">
        {reports.map((report) => (
          <article className="report-card" key={report.id}>
            <div>
              <h3>{report.title}</h3>
              <p>{report.description}</p>
            </div>
            <div className="report-actions">
              {(["csv", "json", "md"] as ReportFormat[]).map((format) => (
                <button key={format} onClick={() => downloadReport(report, format)}>
                  {format === "csv" ? <FileSpreadsheet size={15} /> : format === "json" ? <FileJson size={15} /> : <FileText size={15} />}
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="template-row">
        <label className="upload-box">
          <Upload size={18} />
          Upload CRM workstream template
          <input type="file" accept=".csv,.json,text/csv,application/json" onChange={onTemplateUpload} />
        </label>
        <article className="prediction-card">
          <span>Illustrative readiness prediction</span>
          <strong>{prediction.score}/100</strong>
          <p>{prediction.risk}</p>
          <small>{prediction.action}</small>
        </article>
        <article className="template-card">
          <span>{template ? template.fileName : "No template uploaded"}</span>
          {templateError && <p className="error-text">{templateError}</p>}
          {template ? (
            <p>
              {template.rowCount} rows | {template.fields.length} fields | {template.fields.filter((field) => field.mapped).length} mapped
            </p>
          ) : (
            <p>Teams can keep current templates; added fields become mapped/custom and qualitative/quantitative metadata.</p>
          )}
        </article>
      </div>
    </section>
  );
}

function ProvenanceExplainer() {
  return (
    <section className="provenance">
      <article>
        <SourceBadge source="Public Source" />
        <h3>Public Source</h3>
        <p>Posting, PHL/PNE pages, public accessibility content, FAA, and BTS. These anchor context and citations.</p>
      </article>
      <article>
        <SourceBadge source="Illustrative Model" />
        <h3>Illustrative Model</h3>
        <p>CRM cases, surveys, sentiment, response SLAs, passenger segments, adoption, and feed readiness that require approved internal systems.</p>
      </article>
      <article>
        <SourceBadge source="Derived From Public" />
        <h3>Derived From Public</h3>
        <p>Analytical questions inferred from public facts, such as turning passenger scale into feedback and service-recovery requirements.</p>
      </article>
    </section>
  );
}

function CockpitView({
  profile,
  kpis,
  quality,
  feeds,
  insights,
  experienceMetrics,
  cycle,
  decisions,
}: {
  profile: { name: string; passengerLens: string; publicFacts: string[]; source: SourceKind };
  kpis: KpiMetric[];
  quality: SourceQualityScore[];
  feeds: CrmFeedConnection[];
  insights: InsightItem[];
  experienceMetrics: ExperienceMetricDefinition[];
  cycle: IntelligenceCycleStep[];
  decisions: DecisionItem[];
}) {
  return (
    <section className="view-grid">
      <section className="panel span-12 profile-card">
        <PanelHeading icon={Landmark} title={profile.name} meta={profile.passengerLens} />
        <div className="fact-list">
          {profile.publicFacts.map((fact) => (
            <p key={fact}>{fact}</p>
          ))}
        </div>
        <SourceBadge source={profile.source} />
      </section>

      <section className="kpi-grid span-12">
        {kpis.map((metric) => (
          <article className={`kpi-card ${metric.status}`} key={metric.label}>
            <div>
              <span>{metric.label}</span>
              <StatusPill status={metric.status} />
            </div>
            <strong>{metric.value}</strong>
            <p>{metric.description}</p>
            <footer>
              <small>Target: {metric.target}</small>
              <SourceBadge source={metric.source} />
            </footer>
          </article>
        ))}
      </section>

      <ExperienceMetricPanel metrics={experienceMetrics} />
      <IntelligenceCyclePanel cycle={cycle} />

      <section className="panel span-7">
        <PanelHeading icon={BrainCircuit} title="CRM Maturity Path" meta="Readiness, privacy, and adoption forecast" />
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={maturityTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ec" />
            <XAxis dataKey="month" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="readiness" stroke="#0f4d90" strokeWidth={3} isAnimationActive={false} />
            <Line type="monotone" dataKey="privacy" stroke="#25805a" strokeWidth={3} isAnimationActive={false} />
            <Line type="monotone" dataKey="adoption" stroke="#b76500" strokeWidth={3} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        <p className="narrative">The path sequences source inventory, privacy controls, taxonomy, dashboard adoption, then governed AI-assisted theme detection.</p>
      </section>

      <section className="panel span-5">
        <PanelHeading icon={Target} title="Role Capability Map" meta="Posting responsibilities translated into dashboard modules" />
        <div className="capability-list">
          {capabilityMap.map((item) => (
            <article key={item.responsibility}>
              <strong>{item.dashboardModule}</strong>
              <p>{item.responsibility}</p>
              <small>{item.evidence}</small>
            </article>
          ))}
        </div>
      </section>

      <SourceQualityPanel quality={quality} />
      <FeedPanel feeds={feeds} />
      <EvidencePanel insights={insights} />
      <DecisionPanel decisions={decisions} />
    </section>
  );
}

function ExperienceMetricPanel({ metrics }: { metrics: ExperienceMetricDefinition[] }) {
  return (
    <section className="panel span-7">
      <PanelHeading icon={Gauge} title="Passenger Experience KPI Framework" meta="Executive measures for satisfaction, loyalty, effort, complaints, service speed, and quality" />
      <div className="metric-definition-grid">
        {metrics.map((metric) => (
          <article key={metric.id} className={metric.status}>
            <div>
              <h3>{metric.metric}</h3>
              <StatusPill status={metric.status} />
            </div>
            <strong>{metric.currentValue}</strong>
            <p>{metric.executiveQuestion}</p>
            <small>{metric.decisionUse}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function IntelligenceCyclePanel({ cycle }: { cycle: IntelligenceCycleStep[] }) {
  return (
    <section className="panel span-5">
      <PanelHeading icon={GitBranch} title="Customer Intelligence Cycle" meta="CRM captures memory; engagement creates signals; analytics turns both into accountable action" />
      <div className="cycle-list">
        {cycle.map((step) => (
          <article key={step.id}>
            <span>{step.step}</span>
            <h3>{step.output}</h3>
            <p>{step.purpose}</p>
            <small>{step.owner}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function JourneyView({
  feedback,
  journey,
  themes,
  segments,
  forecasts,
}: {
  feedback: FeedbackChannel[];
  journey: JourneyTouchpoint[];
  themes: ServiceTheme[];
  segments: CustomerSegment[];
  forecasts: ForecastSignal[];
}) {
  return (
    <section className="view-grid">
      <section className="panel span-7">
        <PanelHeading icon={MessageSquareText} title="Feedback Channel Health" meta="Illustrative CRM, survey, digital, accessibility, and PNE intake coverage" />
        <div className="channel-list">
          {feedback.map((channel) => (
            <article key={channel.id}>
              <div>
                <h3>{channel.channel}</h3>
                <StatusPill status={channel.status} />
              </div>
              <dl>
                <dt>Owner</dt>
                <dd>{channel.owner}</dd>
                <dt>Volume</dt>
                <dd>{channel.volume.toLocaleString()}</dd>
                <dt>Response rate</dt>
                <dd>{channel.responseRate}%</dd>
                <dt>Median response</dt>
                <dd>{channel.medianResponseHours}h</dd>
                <dt>Top theme</dt>
                <dd>{channel.topTheme}</dd>
              </dl>
              <SourceBadge source={channel.source} />
            </article>
          ))}
        </div>
      </section>

      <section className="panel span-5">
        <PanelHeading icon={BarChart3} title="Service Theme Load" meta="Cases and sentiment by journey friction" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={themes}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ec" />
            <XAxis dataKey="theme" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="cases" isAnimationActive={false}>
              {themes.map((theme) => (
                <Cell key={theme.id} fill={statusColor[theme.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="legend-list">
          {themes.map((theme) => (
            <span key={theme.id}>
              <i style={{ background: statusColor[theme.status] }} />
              {theme.theme}
            </span>
          ))}
        </div>
      </section>

      <section className="panel span-12">
        <PanelHeading icon={GitBranch} title="Passenger Journey Evidence Chain" meta="Public signal to internal CRM data request to executive decision" />
        <div className="journey-grid">
          {journey.map((touchpoint) => (
            <article className={`journey-card ${touchpoint.experienceRisk}`} key={touchpoint.id}>
              <div>
                <span className="airport-code">{touchpoint.airport}</span>
                <StatusPill status={touchpoint.experienceRisk} />
              </div>
              <h3>{touchpoint.stage}</h3>
              <p>{touchpoint.publicSignal}</p>
              <dl>
                <dt>Internal data needed</dt>
                <dd>{touchpoint.internalDataNeeded}</dd>
                <dt>Executive insight</dt>
                <dd>{touchpoint.insight}</dd>
              </dl>
              <SourceBadge source={touchpoint.source} />
            </article>
          ))}
        </div>
      </section>

      <section className="panel span-5">
        <PanelHeading icon={Users} title="Passenger Segmentation Lens" meta="Averages can hide service gaps; segment views expose who is affected" />
        <div className="segment-list">
          {segments.map((segment) => (
            <article key={segment.id}>
              <span className="airport-code">{segment.airport}</span>
              <h3>{segment.segment}</h3>
              <p>{segment.behavioralSignal}</p>
              <small>{segment.insightUse}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel span-7">
        <PanelHeading icon={BrainCircuit} title="Forecast Signals" meta="Uses leading indicators so leaders can move from reactive response to proactive service recovery" />
        <div className="forecast-grid">
          {forecasts.map((forecast) => (
            <article key={forecast.id} className={forecast.status}>
              <div>
                <h3>{forecast.forecastArea}</h3>
                <StatusPill status={forecast.status} />
              </div>
              <p>{forecast.predictedRisk}</p>
              <dl>
                <dt>Indicators</dt>
                <dd>{forecast.leadingIndicators.join(", ")}</dd>
                <dt>Executive move</dt>
                <dd>{forecast.executiveMove}</dd>
                <dt>Confidence</dt>
                <dd>{forecast.confidence}/100</dd>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="panel span-12">
        <PanelHeading icon={ClipboardList} title="Service Recovery Worklist" meta="Every alert ties to an owner and action" />
        <div className="theme-list">
          {themes.map((theme) => (
            <article key={theme.id}>
              <StatusPill status={theme.status} />
              <h3>{theme.theme}</h3>
              <p>{theme.recommendedAction}</p>
              <dl>
                <dt>Audience</dt>
                <dd>{theme.affectedAudience}</dd>
                <dt>Partner</dt>
                <dd>{theme.operationalPartner}</dd>
                <dt>Sentiment</dt>
                <dd>{theme.sentiment}/100</dd>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function ProgramsView({ programs, stakeholders }: { programs: GuestProgram[]; stakeholders: StakeholderWorkstream[] }) {
  return (
    <section className="view-grid">
      <section className="panel span-6">
        <PanelHeading icon={HeartHandshake} title="Guest Program Effectiveness" meta="Public program basis connected to internal measures needed" />
        <div className="program-list">
          {programs.map((program) => (
            <article key={program.id}>
              <div>
                <h3>{program.program}</h3>
                <StatusPill status={program.status} />
              </div>
              <p>{program.publicBasis}</p>
              <dl>
                <dt>KPI question</dt>
                <dd>{program.kpiQuestion}</dd>
                <dt>Internal measure needed</dt>
                <dd>{program.internalMeasureNeeded}</dd>
                <dt>Owner</dt>
                <dd>{program.owner}</dd>
              </dl>
              <SourceBadge source={program.source} />
            </article>
          ))}
        </div>
      </section>

      <section className="panel span-6">
        <PanelHeading icon={Users} title="Stakeholder Adoption Map" meta="Shared metrics, cadence, and adoption needs" />
        <div className="stakeholder-list">
          {stakeholders.map((workstream) => (
            <article key={workstream.id}>
              <div>
                <h3>{workstream.stakeholder}</h3>
                <StatusPill status={workstream.status} />
              </div>
              <p>{workstream.roleInJourney}</p>
              <dl>
                <dt>Shared metric</dt>
                <dd>{workstream.sharedMetric}</dd>
                <dt>Cadence</dt>
                <dd>{workstream.cadence}</dd>
                <dt>Adoption need</dt>
                <dd>{workstream.adoptionNeed}</dd>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function GovernanceView({
  assets,
  selectedAsset,
  onSelectAsset,
  feeds,
  quality,
  controls,
  roadmap,
  cycle,
  template,
  prediction,
  onTemplateUpload,
}: {
  assets: CrmDataAsset[];
  selectedAsset: CrmDataAsset;
  onSelectAsset: (id: string) => void;
  feeds: CrmFeedConnection[];
  quality: SourceQualityScore[];
  controls: PrivacyControl[];
  roadmap: RoadmapItem[];
  cycle: IntelligenceCycleStep[];
  template?: TemplateProfile;
  prediction: ReturnType<typeof predictReadiness>;
  onTemplateUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <section className="view-grid">
      <section className="panel span-5">
        <PanelHeading icon={Database} title="CRM Data Asset Drilldown" meta="Select a data asset to inspect access, quality, privacy, and use case" />
        <div className="asset-list">
          {assets.map((asset) => (
            <button key={asset.id} className={asset.id === selectedAsset.id ? "active" : ""} onClick={() => onSelectAsset(asset.id)}>
              <span>{asset.sourceName}</span>
              <StatusPill status={asset.qualityStatus} />
            </button>
          ))}
        </div>
      </section>
      <section className="panel span-7 asset-detail">
        <PanelHeading icon={Eye} title={selectedAsset.sourceName} meta={selectedAsset.roleUseCase} />
        <dl className="detail-grid">
          <dt>Owner</dt>
          <dd>{selectedAsset.owner}</dd>
          <dt>Refresh</dt>
          <dd>{selectedAsset.refreshCadence}</dd>
          <dt>Access</dt>
          <dd>{selectedAsset.accessStatus}</dd>
          <dt>Privacy risk</dt>
          <dd><StatusPill status={selectedAsset.privacyRisk} /></dd>
        </dl>
        <SourceBadge source={selectedAsset.source} />
      </section>

      <FeedPanel feeds={feeds} />
      <SourceQualityPanel quality={quality} />

      <section className="panel span-12">
        <PanelHeading icon={GitBranch} title="Data Journey Operating Controls" meta="Collection through action, with owner accountability at each step" />
        <div className="cycle-grid">
          {cycle.map((step) => (
            <article key={step.id}>
              <span>{step.step}</span>
              <h3>{step.dashboardSignal}</h3>
              <p>{step.purpose}</p>
              <small>{step.output}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel span-6">
        <PanelHeading icon={LockKeyhole} title="Privacy And Security Controls" meta="Controls required before CRM analytics becomes executive reporting" />
        <div className="privacy-list">
          {controls.map((control) => (
            <article key={control.id}>
              <div>
                <h3>{control.control}</h3>
                <StatusPill status={control.status} />
              </div>
              <p>{control.purpose}</p>
              <small>{control.executiveQuestion}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel span-6">
        <PanelHeading icon={Sparkles} title="Template Refresh Prediction" meta="Illustrative ML readiness scoring after upload or refresh" />
        <div className="ml-card">
          <strong>{prediction.score}/100</strong>
          <p>{prediction.risk}</p>
          <small>{prediction.action}</small>
          <label className="upload-box compact">
            <Upload size={16} />
            Upload template
            <input type="file" accept=".csv,.json,text/csv,application/json" onChange={onTemplateUpload} />
          </label>
          {template && (
            <div className="field-chips">
              {template.fields.slice(0, 12).map((field) => (
                <span key={field.name} className={field.mapped ? "mapped" : "custom"}>
                  {field.name}: {field.dataType}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="panel span-12">
        <PanelHeading icon={Wrench} title="First 90 Days CRM Data Roadmap" meta="Visual sequence for source trust, adoption, and automation" />
        <div className="roadmap">
          {roadmap.map((item) => (
            <article key={item.id} className={item.status}>
              <span>{item.phase}</span>
              <h3>{item.title}</h3>
              <p>{item.outcome}</p>
              <small>{item.executiveDecision}</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function SourceQualityPanel({ quality }: { quality: SourceQualityScore[] }) {
  return (
    <section className="panel span-6">
      <PanelHeading icon={ShieldCheck} title="Source Quality Scorecard" meta="Completeness, freshness, lineage, stewardship, and privacy readiness" />
      <div className="quality-list">
        {quality.map((item) => (
          <article key={item.id}>
            <div className="quality-score">
              <span>Score</span>
              <strong>{scoreQuality(item)}/100</strong>
            </div>
            <div>
              <h3>{item.sourceName}</h3>
              <p>{item.nextControl}</p>
              <small>{item.escalationRule}</small>
            </div>
            <StatusPill status={item.status} />
          </article>
        ))}
      </div>
    </section>
  );
}

function FeedPanel({ feeds }: { feeds: CrmFeedConnection[] }) {
  return (
    <section className="panel span-6">
      <PanelHeading icon={Database} title="CRM Feed Connection Blueprint" meta="Owner, cadence, first metrics, quality gate, privacy control, and executive use" />
      <div className="feed-list">
        {feeds.map((feed) => (
          <article key={feed.id} className={feed.status}>
            <div>
              <span className="airport-code">{feed.airport}</span>
              <StatusPill status={feed.status} />
            </div>
            <h3>{feed.feedName}</h3>
            <p>{feed.currentState}</p>
            <dl>
              <dt>Owner</dt>
              <dd>{feed.accountableOwner}</dd>
              <dt>Refresh</dt>
              <dd>{feed.refreshTarget}</dd>
              <dt>Metrics</dt>
              <dd>{feed.firstMetrics.join(", ")}</dd>
              <dt>Privacy</dt>
              <dd>{feed.privacyControl}</dd>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function EvidencePanel({ insights }: { insights: InsightItem[] }) {
  return (
    <section className="panel span-6">
      <PanelHeading icon={GitBranch} title="Interview-Ready Evidence Chain" meta="Requirement to citation to decision" />
      <div className="evidence-list">
        {insights.map((insight) => (
          <article key={insight.id}>
            <h3>{insight.businessQuestion}</h3>
            <p>{insight.publicObservation}</p>
            <dl>
              <dt>Internal data needed</dt>
              <dd>{insight.internalDataNeeded}</dd>
              <dt>Decision supported</dt>
              <dd>{insight.decisionSupported}</dd>
            </dl>
            <a href={insight.citationUrl} target="_blank" rel="noreferrer">
              {insight.citationLabel} <ChevronRight size={14} />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function DecisionPanel({ decisions }: { decisions: DecisionItem[] }) {
  return (
    <section className="panel span-6">
      <PanelHeading icon={ClipboardList} title="CRM Strategy Decisions" meta="Ranked action queue for executive review" />
      <div className="decision-list">
        {decisions.map((decision) => (
          <article key={decision.id} className={decision.severity.toLowerCase()}>
            <div>
              <span className={`decision-icon ${decision.severity.toLowerCase()}`}>{decision.severity === "Action" ? <AlertTriangle size={16} /> : <Eye size={16} />}</span>
              <strong>{decision.severity}</strong>
              <small>{decision.dueDate}</small>
            </div>
            <h3>{decision.title}</h3>
            <p>{decision.impact}</p>
            <small>{decision.recommendation}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function PanelHeading({ icon: Icon, title, meta }: { icon: typeof Gauge; title: string; meta: string }) {
  return (
    <div className="panel-heading">
      <div>
        <Icon size={19} />
        <h2>{title}</h2>
      </div>
      <p>{meta}</p>
    </div>
  );
}
