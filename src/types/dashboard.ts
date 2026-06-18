export type AirportCode = "ALL" | "PHL" | "PNE";
export type SourceKind = "Public Source" | "Illustrative Model" | "Derived From Public";
export type Status = "normal" | "warning" | "critical";
export type DecisionStatus = "Monitor" | "Watch" | "Action";

export interface SourceRef {
  id: string;
  label: string;
  url: string;
  kind: SourceKind;
  roleUse: string;
}

export interface AirportProfile {
  code: AirportCode;
  name: string;
  passengerLens: string;
  publicFacts: string[];
  source: SourceKind;
}

export interface KpiMetric {
  label: string;
  value: string;
  target: string;
  delta: string;
  trend: number;
  status: Status;
  source: SourceKind;
  description: string;
}

export interface CapabilityMapItem {
  responsibility: string;
  dashboardModule: string;
  evidence: string;
  source: SourceKind;
}

export interface FeedbackChannel {
  id: string;
  airport: AirportCode;
  channel: string;
  owner: string;
  volume: number;
  responseRate: number;
  medianResponseHours: number;
  sentiment: number;
  topTheme: string;
  status: Status;
  source: SourceKind;
}

export interface JourneyTouchpoint {
  id: string;
  airport: AirportCode;
  stage: string;
  publicSignal: string;
  internalDataNeeded: string;
  insight: string;
  experienceRisk: Status;
  source: SourceKind;
}

export interface ServiceTheme {
  id: string;
  airport: AirportCode;
  theme: string;
  journeyStage: string;
  cases: number;
  sentiment: number;
  affectedAudience: string;
  operationalPartner: string;
  recommendedAction: string;
  status: Status;
  source: SourceKind;
}

export interface GuestProgram {
  id: string;
  airport: AirportCode;
  program: string;
  publicBasis: string;
  kpiQuestion: string;
  internalMeasureNeeded: string;
  owner: string;
  status: Status;
  source: SourceKind;
}

export interface StakeholderWorkstream {
  id: string;
  airport: AirportCode;
  stakeholder: string;
  roleInJourney: string;
  sharedMetric: string;
  cadence: string;
  adoptionNeed: string;
  status: Status;
  source: SourceKind;
}

export interface CrmDataAsset {
  id: string;
  airport: AirportCode;
  sourceName: string;
  owner: string;
  refreshCadence: string;
  accessStatus: string;
  qualityStatus: Status;
  privacyRisk: Status;
  roleUseCase: string;
  source: SourceKind;
}

export interface CrmFeedConnection {
  id: string;
  airport: AirportCode;
  feedName: string;
  accountableOwner: string;
  currentState: string;
  refreshTarget: string;
  firstMetrics: string[];
  qualityGate: string;
  privacyControl: string;
  executiveUse: string;
  status: Status;
  source: SourceKind;
}

export interface SourceQualityScore {
  id: string;
  airport: AirportCode;
  sourceName: string;
  owner: string;
  completeness: number;
  freshness: number;
  lineage: number;
  stewardship: number;
  privacyReadiness: number;
  nextControl: string;
  escalationRule: string;
  status: Status;
  source: SourceKind;
}

export interface PrivacyControl {
  id: string;
  control: string;
  purpose: string;
  executiveQuestion: string;
  owner: string;
  status: Status;
  source: SourceKind;
}

export interface InsightItem {
  id: string;
  postingRequirement: string;
  publicObservation: string;
  citationLabel: string;
  citationUrl: string;
  trendSignal: string;
  businessQuestion: string;
  internalDataNeeded: string;
  dashboardArtifact: string;
  decisionSupported: string;
  source: SourceKind;
}

export interface DecisionItem {
  id: string;
  title: string;
  domain: string;
  severity: DecisionStatus;
  owner: string;
  dueDate: string;
  impact: string;
  recommendation: string;
  status: string;
  source: SourceKind;
}

export interface RoadmapItem {
  id: string;
  phase: string;
  timing: string;
  title: string;
  outcome: string;
  executiveDecision: string;
  owner: string;
  status: Status;
  source: SourceKind;
}
