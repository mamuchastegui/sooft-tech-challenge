import { v4 as uuidv4, validate as uuidValidate, version as uuidVersion } from "uuid";

export interface CompanyDTO {
  id: string;
  cuit: string;
  businessName: string;
  type: "PYME" | "CORPORATE";
}

export class ValidationError extends Error {}

function isValidCuit(cuit: string): boolean {
  if (!/^\d{11}$/.test(cuit)) {
    return false;
  }
  const digits = cuit.split("").map(Number);
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = multipliers.reduce((acc, mult, idx) => acc + mult * digits[idx], 0);
  let check = 11 - (sum % 11);
  if (check === 11) check = 0;
  if (check === 10) check = 9;
  return check === digits[10];
}

export function validateCompanyRequest(input: any): asserts input is CompanyDTO {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("Invalid payload");
  }

  if (input.id == null) {
    input.id = uuidv4();
  } else if (!(typeof input.id === "string" && uuidValidate(input.id) && uuidVersion(input.id) === 4)) {
    throw new ValidationError("Invalid id");
  }

  if (typeof input.cuit !== "string" || !isValidCuit(input.cuit)) {
    throw new ValidationError("Invalid cuit");
  }

  if (
    typeof input.businessName !== "string" ||
    input.businessName.length < 2 ||
    input.businessName.length > 100
  ) {
    throw new ValidationError("Invalid businessName");
  }

  if (input.type !== "PYME" && input.type !== "CORPORATE") {
    throw new ValidationError("Invalid type");
  }
}

