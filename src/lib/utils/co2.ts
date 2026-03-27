import {
  SIC_EMISSION_FACTOR_TCO2_PER_MWH,
  KG_CO2_PER_TREE_PER_YEAR,
  TONNES_CO2_PER_CAR_PER_YEAR,
} from "@/lib/constants";

/**
 * Calculate tonnes of CO2 avoided based on kWh generated.
 * Formula: co2_avoided = (kWh / 1000) * SIC_emission_factor
 */
export function calculateCO2Avoided(kwhGenerated: number): number {
  return (kwhGenerated / 1000) * SIC_EMISSION_FACTOR_TCO2_PER_MWH;
}

/**
 * Calculate equivalent number of trees needed to absorb the same CO2.
 */
export function calculateEquivalentTrees(co2Tonnes: number): number {
  return Math.round((co2Tonnes * 1000) / KG_CO2_PER_TREE_PER_YEAR);
}

/**
 * Calculate equivalent number of cars removed from roads.
 */
export function calculateEquivalentCars(co2Tonnes: number): number {
  return Math.round((co2Tonnes / TONNES_CO2_PER_CAR_PER_YEAR) * 10) / 10;
}
