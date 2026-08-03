import type { Contract, ContractFilters } from "@/lib/models";
import { demoContracts } from "@/lib/data";
import { buildContractSummary, filterContracts, mapDemoContractToDomain } from "./contractMapper";

function contracts(): Contract[] {
  return demoContracts.map(mapDemoContractToDomain);
}

export const contractDemoAdapter = {
  getContracts(filters: ContractFilters = {}) {
    return { data: filterContracts(contracts(), filters), source: "demo" as const, isFallback: false };
  },

  getContract(id: string) {
    return { data: contracts().find((contract) => contract.id === id), source: "demo" as const, isFallback: false };
  },

  getSummary() {
    return { data: buildContractSummary(contracts()), source: "demo" as const, isFallback: false };
  }
};
