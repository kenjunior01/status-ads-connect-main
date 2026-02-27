import { useTranslation } from 'react-i18next';
import { Globe, DollarSign, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocalization } from '@/hooks/useLocalization';
import { regions, getCountriesByRegion } from '@/lib/currencies';

export const RegionCurrencySelector = () => {
  const { t, i18n } = useTranslation();
  const { 
    currency, 
    country, 
    setCurrency, 
    setCountry,
    getCurrentCurrency,
    getCurrentCountry,
    currencies 
  } = useLocalization();

  const currentCurrency = getCurrentCurrency();
  const currentCountry = getCurrentCountry();
  const isEnglish = i18n.language === 'en-US';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-xs">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentCountry ? (isEnglish ? currentCountry.nameEn : currentCountry.name) : country}
          </span>
          <span className="text-muted-foreground">
            ({currentCurrency?.symbol || currency})
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {t('localization.selectCountry')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {regions.map((region) => (
          <DropdownMenuSub key={region.code}>
            <DropdownMenuSubTrigger>
              {isEnglish ? region.nameEn : region.name}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {getCountriesByRegion(region.code).map((c) => (
                <DropdownMenuItem
                  key={c.code}
                  onClick={() => setCountry(c.code)}
                  className={country === c.code ? 'bg-primary/10' : ''}
                >
                  <span className="mr-2">{getFlagEmoji(c.code)}</span>
                  {isEnglish ? c.nameEn : c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          {t('localization.selectCurrency')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {currencies.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className={currency === c.code ? 'bg-primary/10' : ''}
          >
            <span className="font-mono mr-2 w-6">{c.symbol}</span>
            {c.code} - {c.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
