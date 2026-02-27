import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInfluenceCategory(avgViews: number) {
  if (avgViews < 50) return { key: 'below', label: 'Abaixo do limiar' }
  if (avgViews <= 200) return { key: 'nano', label: 'Nano-Status' }
  if (avgViews <= 500) return { key: 'micro', label: 'Micro-Status' }
  if (avgViews <= 1500) return { key: 'mid', label: 'Mid-Status' }
  if (avgViews <= 3000) return { key: 'power', label: 'Power-Status' }
  return { key: 'elite', label: 'Elite-Status' }
}

export function getSuggestedPriceRange(avgViews: number) {
  if (avgViews < 50) return { min: 0, max: 0 }
  if (avgViews <= 200) return { min: 2, max: 5 }
  if (avgViews <= 500) return { min: 6, max: 15 }
  if (avgViews <= 1500) return { min: 16, max: 35 }
  if (avgViews <= 3000) return { min: 36, max: 70 }
  return { min: 71, max: 150 }
}

export function computePlatformFee(amount: number, percent = 18) {
  return Math.round((amount * percent) / 100)
}

export function getAdjustedPriceRange(
  avgViews: number,
  opts?: {
    nicheMultiplier?: number
    trustScore?: number
    interactiveExtra?: number
    packageCount?: number
  }
) {
  const base = getSuggestedPriceRange(avgViews)
  const nicheMultiplier = opts?.nicheMultiplier ?? 1
  const trustScore = opts?.trustScore ?? 0
  const interactiveExtra = opts?.interactiveExtra ?? 0
  const packageCount = opts?.packageCount ?? 1
  const premium = trustScore >= 90 ? 0.15 : trustScore >= 80 ? 0.08 : 0
  const discount = packageCount >= 5 ? 0.15 : packageCount >= 3 ? 0.1 : 0
  const apply = (v: number) => {
    const withMult = v * nicheMultiplier
    const withPremium = withMult * (1 + premium)
    const withExtra = withPremium + interactiveExtra
    const withDiscount = withExtra * (1 - discount)
    return Math.round(withDiscount)
  }
  const min = apply(base.min)
  const max = apply(base.max)
  const recommended = Math.round((min + max) / 2)
  return { min, max, recommended }
}
