export type PhoneRule = { prefix: string; min: number; max: number };

export const phoneRules: Record<string, PhoneRule> = {
  BR: { prefix: "+55", min: 10, max: 11 },
  US: { prefix: "+1", min: 10, max: 10 },
  GB: { prefix: "+44", min: 10, max: 10 },
  ES: { prefix: "+34", min: 9, max: 9 },
  FR: { prefix: "+33", min: 9, max: 9 },
  PT: { prefix: "+351", min: 9, max: 9 },
  MZ: { prefix: "+258", min: 8, max: 9 },
  AO: { prefix: "+244", min: 9, max: 9 },
  CA: { prefix: "+1", min: 10, max: 10 },
};

export function getRule(countryCode?: string): PhoneRule {
  if (!countryCode) return { prefix: "+", min: 8, max: 16 };
  return phoneRules[countryCode] || { prefix: "+", min: 8, max: 16 };
}

export function ensurePrefix(input: string, countryCode?: string): string {
  const rule = getRule(countryCode);
  const normalized = input.replace(/\s|-/g, "");
  if (!normalized.startsWith(rule.prefix)) return rule.prefix;
  return normalized;
}

export function isValidForCountry(input: string, countryCode?: string): boolean {
  const rule = getRule(countryCode);
  const normalized = input.replace(/\s|-/g, "");
  if (!normalized.startsWith(rule.prefix)) return false;
  const local = normalized.slice(rule.prefix.length).replace(/\D/g, "");
  return local.length >= rule.min && local.length <= rule.max;
}
