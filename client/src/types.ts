export interface DistrictIndices {
  pipedWaterCoveragePct: number;
  allWeatherRoadConnectivityPct: number;
  phcBedDeficitPct: number;
  powerReliabilityHrs: number;
  broadbandConnectivityPct: number;
  floodVulnerabilityIndex: number;
}

export interface District {
  id: string;
  name: string;
  state: string;
  region: string;
  lat: number;
  lng: number;
  population: number;
  ruralPct: number;
  tribalPct: number;
  isAspirational: boolean;
  nitiAayogRank: number;
  indices: DistrictIndices;
  sanctionedBudgetCr: number;
  spentBudgetCr: number;
  topGrievanceCategory: string;
  activeComplaintsCount: number;
  calculatedIDUS: number; // 0 to 100 Infrastructure Deficit & Urgency Score
}

export interface Scheme {
  code: string;
  name: string;
  ministry: string;
  focus: string;
  targetMetric: string;
  nationalBudgetCr: number;
  matchKeywords: string[];
  dprTemplate: string;
}

export interface DetailedProjectReport {
  source?: string;
  dprNumber: string;
  projectTitle: string;
  sponsoringMinistry: string;
  sanctioningScheme: string;
  estimatedBudgetInrCr: number;
  executionDurationMonths: number;
  beneficiaryDemographics: {
    totalHouseholds: number;
    marginalizedBeneficiaryPct: number;
    gramPanchayatsCovered: number;
  };
  technicalScope: string[];
  economicRoiAndMultiplier: string;
  riskAndMitigation: Array<{ risk: string; mitigation: string }>;
  implementationMilestones: Array<{ phase: string; durationDays: number; deliverable: string }>;
  sdgGoalsAligned: string[];
}

export interface CitizenRequest {
  id: string;
  timestamp: string;
  channel: "voice" | "whatsapp" | "web" | "sms";
  language: string;
  languageName: string;
  originalText: string;
  translatedEnglish: string;
  category: string;
  urgencyLevel: number;
  sentimentScore: number;
  populationAffected: number;
  state: string;
  district: string;
  districtId: string;
  block: string;
  panchayat: string;
  lat: number;
  lng: number;
  status: "Reported" | "AI_Triangulated" | "Hotspot_Clustered" | "DPR_Generated" | "Sanctioned" | "Under_Execution" | "Resolved";
  matchedSchemeCode: string;
  photoUrl?: string;
  audioDurationSec?: number;
  aiMetadata?: {
    urgencyReasoning?: string;
    recommendedAction?: string;
    keyEntities?: any;
    source?: string;
  };
  generatedDPR?: DetailedProjectReport;
}

export interface NationalMetrics {
  totalRequests: number;
  totalPopulationImpact: number;
  highUrgencyCount: number;
  aspirationalDistrictsCount: number;
  languagesTracked: number;
  nationalBudgetUtilizationPct: number;
  categoryCounts: Record<string, number>;
  dpiResolutionIndex: number;
}
