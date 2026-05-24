import {
  UtensilsCrossed, Coffee, Croissant, Wine, Bike, IceCream, Pizza, Fish,
  Beef, Sandwich, Scissors, Sparkles, Dumbbell, Pill, Stethoscope,
  HeartPulse, ShoppingCart, Store, PawPrint, Shirt, Footprints, Flower2,
  Wrench, Car, WashingMachine, GraduationCap, Tag, type LucideIcon,
} from "lucide-react"

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  restaurantes: UtensilsCrossed,
  cafes: Coffee,
  padarias: Croissant,
  bares: Wine,
  delivery: Bike,
  sorveterias: IceCream,
  pizzarias: Pizza,
  japonesa: Fish,
  hamburguerias: Beef,
  "comida-brasileira": UtensilsCrossed,
  sanduiches: Sandwich,
  "saloes-de-beleza": Sparkles,
  cabelereiros: Scissors,
  barbearias: Scissors,
  manicure: Sparkles,
  spa: Flower2,
  academias: Dumbbell,
  farmacias: Pill,
  dentistas: Stethoscope,
  medicos: Stethoscope,
  fisioterapia: HeartPulse,
  supermercados: ShoppingCart,
  conveniencias: Store,
  "pet-shops": PawPrint,
  moda: Shirt,
  calcados: Footprints,
  floricultura: Flower2,
  mecanicas: Wrench,
  "lava-rapido": Car,
  lavanderias: WashingMachine,
  escolas: GraduationCap,
}

export function getCategoryIcon(slug: string): LucideIcon {
  return ICON_BY_SLUG[slug] ?? Tag
}
