export const countryToLanguage: Record<string, string> = {
  BR: 'pt-BR',
  PT: 'pt-BR',
  MZ: 'pt-BR',
  AO: 'pt-BR',
  US: 'en-US',
  GB: 'en-US',
  CA: 'en-US',
  ES: 'es-ES',
  AR: 'es-ES',
  MX: 'es-ES',
  CO: 'es-ES',
  PE: 'es-ES',
  CL: 'es-ES',
  FR: 'fr-FR',
};

export function languageForCountry(code?: string | null): string | null {
  if (!code) return null;
  return countryToLanguage[code] || null;
}
