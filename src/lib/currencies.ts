export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export interface Country {
  code: string;
  name: string;
  nameEn: string;
  currency: string;
  region: string;
  flag: string;
}

export const currencies: Currency[] = [
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro', locale: 'pt-BR' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'MZN', symbol: 'MT', name: 'Metical Moçambicano', locale: 'pt-MZ' },
  { code: 'AOA', symbol: 'Kz', name: 'Kwanza Angolano', locale: 'pt-AO' },
  { code: 'ARS', symbol: '$', name: 'Peso Argentino', locale: 'es-AR' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano', locale: 'es-MX' },
  { code: 'COP', symbol: '$', name: 'Peso Colombiano', locale: 'es-CO' },
  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano', locale: 'es-PE' },
  { code: 'CLP', symbol: '$', name: 'Peso Chileno', locale: 'es-CL' },
  // Global expansion
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', locale: 'en-PK' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', locale: 'bn-BD' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', locale: 'ru-RU' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'en-PH' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', locale: 'vi-VN' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', locale: 'tr-TR' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', locale: 'ar-EG' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
];

export const countries: Country[] = [
  // América do Sul
  { code: 'BR', name: 'Brasil', nameEn: 'Brazil', currency: 'BRL', region: 'south_america', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', nameEn: 'Argentina', currency: 'ARS', region: 'south_america', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', nameEn: 'Chile', currency: 'CLP', region: 'south_america', flag: '🇨🇱' },
  { code: 'CO', name: 'Colômbia', nameEn: 'Colombia', currency: 'COP', region: 'south_america', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', nameEn: 'Peru', currency: 'PEN', region: 'south_america', flag: '🇵🇪' },
  { code: 'UY', name: 'Uruguai', nameEn: 'Uruguay', currency: 'USD', region: 'south_america', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguai', nameEn: 'Paraguay', currency: 'USD', region: 'south_america', flag: '🇵🇾' },
  { code: 'BO', name: 'Bolívia', nameEn: 'Bolivia', currency: 'USD', region: 'south_america', flag: '🇧🇴' },
  { code: 'EC', name: 'Equador', nameEn: 'Ecuador', currency: 'USD', region: 'south_america', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela', nameEn: 'Venezuela', currency: 'USD', region: 'south_america', flag: '🇻🇪' },
  
  // América do Norte e Central
  { code: 'US', name: 'Estados Unidos', nameEn: 'United States', currency: 'USD', region: 'north_america', flag: '🇺🇸' },
  { code: 'MX', name: 'México', nameEn: 'Mexico', currency: 'MXN', region: 'north_america', flag: '🇲🇽' },
  { code: 'CA', name: 'Canadá', nameEn: 'Canada', currency: 'CAD', region: 'north_america', flag: '🇨🇦' },
  
  // Europa
  { code: 'PT', name: 'Portugal', nameEn: 'Portugal', currency: 'EUR', region: 'europe', flag: '🇵🇹' },
  { code: 'ES', name: 'Espanha', nameEn: 'Spain', currency: 'EUR', region: 'europe', flag: '🇪🇸' },
  { code: 'FR', name: 'França', nameEn: 'France', currency: 'EUR', region: 'europe', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemanha', nameEn: 'Germany', currency: 'EUR', region: 'europe', flag: '🇩🇪' },
  { code: 'IT', name: 'Itália', nameEn: 'Italy', currency: 'EUR', region: 'europe', flag: '🇮🇹' },
  { code: 'GB', name: 'Reino Unido', nameEn: 'United Kingdom', currency: 'GBP', region: 'europe', flag: '🇬🇧' },
  
  // África
  { code: 'MZ', name: 'Moçambique', nameEn: 'Mozambique', currency: 'MZN', region: 'africa', flag: '🇲🇿' },
  { code: 'AO', name: 'Angola', nameEn: 'Angola', currency: 'AOA', region: 'africa', flag: '🇦🇴' },
  { code: 'CV', name: 'Cabo Verde', nameEn: 'Cape Verde', currency: 'EUR', region: 'africa', flag: '🇨🇻' },
  { code: 'GW', name: 'Guiné-Bissau', nameEn: 'Guinea-Bissau', currency: 'EUR', region: 'africa', flag: '🇬🇼' },
  { code: 'ST', name: 'São Tomé e Príncipe', nameEn: 'São Tomé and Príncipe', currency: 'EUR', region: 'africa', flag: '🇸🇹' },
  { code: 'NG', name: 'Nigéria', nameEn: 'Nigeria', currency: 'NGN', region: 'africa', flag: '🇳🇬' },
  { code: 'ZA', name: 'África do Sul', nameEn: 'South Africa', currency: 'ZAR', region: 'africa', flag: '🇿🇦' },
  { code: 'EG', name: 'Egito', nameEn: 'Egypt', currency: 'EGP', region: 'africa', flag: '🇪🇬' },

  // Ásia e Oceania
  { code: 'IN', name: 'Índia', nameEn: 'India', currency: 'INR', region: 'asia', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonésia', nameEn: 'Indonesia', currency: 'IDR', region: 'asia', flag: '🇮🇩' },
  { code: 'PH', name: 'Filipinas', nameEn: 'Philippines', currency: 'PHP', region: 'asia', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnã', nameEn: 'Vietnam', currency: 'VND', region: 'asia', flag: '🇻🇳' },
  { code: 'JP', name: 'Japão', nameEn: 'Japan', currency: 'JPY', region: 'asia', flag: '🇯🇵' },
  { code: 'KR', name: 'Coreia do Sul', nameEn: 'South Korea', currency: 'KRW', region: 'asia', flag: '🇰🇷' },
  { code: 'CN', name: 'China', nameEn: 'China', currency: 'CNY', region: 'asia', flag: '🇨🇳' },
  { code: 'AU', name: 'Austrália', nameEn: 'Australia', currency: 'AUD', region: 'oceania', flag: '🇦🇺' },
  { code: 'PK', name: 'Paquistão', nameEn: 'Pakistan', currency: 'PKR', region: 'asia', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', nameEn: 'Bangladesh', currency: 'BDT', region: 'asia', flag: '🇧🇩' },
  { code: 'RU', name: 'Rússia', nameEn: 'Russia', currency: 'RUB', region: 'asia', flag: '🇷🇺' },

  // CPLP adicional
  { code: 'TL', name: 'Timor-Leste', nameEn: 'Timor-Leste', currency: 'USD', region: 'asia', flag: '🇹🇱' },
];

export const regions = [
  { code: 'south_america', name: 'América do Sul', nameEn: 'South America' },
  { code: 'north_america', name: 'América do Norte', nameEn: 'North America' },
  { code: 'europe', name: 'Europa', nameEn: 'Europe' },
  { code: 'africa', name: 'África', nameEn: 'Africa' },
  { code: 'asia', name: 'Ásia', nameEn: 'Asia' },
  { code: 'oceania', name: 'Oceania', nameEn: 'Oceania' },
];

export const formatCurrency = (
  amount: number,
  currencyCode: string = 'BRL',
  locale: string = 'pt-BR'
): string => {
  const currency = currencies.find(c => c.code === currencyCode);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return currencies.find(c => c.code === code);
};

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(c => c.code === code);
};

export const getCountriesByRegion = (regionCode: string): Country[] => {
  return countries.filter(c => c.region === regionCode);
};
