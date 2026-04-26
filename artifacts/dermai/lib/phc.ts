/**
 * NHA Health Facility Registry (HFR) — Mock
 *
 * Production endpoint:
 *   GET https://facility.abdm.gov.in/api/v1/facility/searchByName
 *   Headers: { "X-CM-ID": NHA_HFR_API_KEY }
 *
 * For now we deterministically map village names to the nearest PHC.
 */

export interface PHC {
  name: string;
  code: string;
  district: string;
  contact: string;
}

const SEED: PHC[] = [
  { name: "PHC Wardha Rural", code: "HFR-MH-44213", district: "Wardha, Maharashtra", contact: "+91 93725 41123" },
  { name: "PHC Karjat Block", code: "HFR-MH-31022", district: "Karjat, Maharashtra", contact: "+91 80552 18829" },
  { name: "PHC Bhilwara South", code: "HFR-RJ-11456", district: "Bhilwara, Rajasthan", contact: "+91 70124 90087" },
  { name: "PHC Salem Rural", code: "HFR-TN-66291", district: "Salem, Tamil Nadu", contact: "+91 84112 00451" },
  { name: "PHC Murshidabad East", code: "HFR-WB-90123", district: "Murshidabad, West Bengal", contact: "+91 91234 56119" },
  { name: "PHC Anand Block", code: "HFR-GJ-22013", district: "Anand, Gujarat", contact: "+91 99043 71288" },
];

export function findNearestPHC(village: string): PHC {
  if (!village) return SEED[0];
  let hash = 0;
  for (let i = 0; i < village.length; i++) hash = (hash * 31 + village.charCodeAt(i)) >>> 0;
  return SEED[hash % SEED.length];
}
