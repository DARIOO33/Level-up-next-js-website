import type { Locale } from '@/i18n/config';
import type { Product } from './types';

/**
 * French names for the spec names the shop uses most, so a spec shows in French
 * even when the admin left its French name empty. Matched case-insensitively.
 */
const SPEC_NAMES_FR: Record<string, string> = {
  driver: 'Transducteur',
  drivers: 'Transducteurs',
  'driver type': 'Type de transducteur',
  'driver configuration': 'Configuration des transducteurs',
  configuration: 'Configuration',
  impedance: 'Impédance',
  sensitivity: 'Sensibilité',
  'frequency response': 'Réponse en fréquence',
  'frequency range': 'Plage de fréquences',
  thd: 'DHT',
  cable: 'Câble',
  'cable length': 'Longueur du câble',
  'cable material': 'Matériau du câble',
  connector: 'Connecteur',
  connectors: 'Connecteurs',
  plug: 'Prise',
  jack: 'Prise jack',
  'pin type': 'Type de connecteur',
  microphone: 'Microphone',
  mic: 'Micro',
  weight: 'Poids',
  color: 'Couleur',
  colour: 'Couleur',
  colors: 'Couleurs',
  material: 'Matériau',
  'shell material': 'Matériau de la coque',
  'faceplate material': 'Matériau de la façade',
  'in the box': 'Contenu de la boîte',
  'package contents': 'Contenu de la boîte',
  warranty: 'Garantie',
  compatibility: 'Compatibilité',
  'noise isolation': 'Isolation phonique',
  'sound signature': 'Signature sonore',
  'output power': 'Puissance de sortie',
  'sample rate': "Fréquence d'échantillonnage",
  'bit depth': 'Profondeur de bits',
  chip: 'Puce',
  dac: 'DAC',
  size: 'Taille',
  dimensions: 'Dimensions',
  length: 'Longueur',
  type: 'Type',
};

/** Description and spec rows in the visitor's language; anything not written in French falls back to the English text. */
export function productCopy(product: Pick<Product, 'description' | 'descriptionFr' | 'specifications' | 'specificationsFr'>, locale: Locale) {
  const fr = locale === 'fr';
  return {
    description: (fr && product.descriptionFr) || product.description,
    /** `[key, label, value]` — `key` is the English name, stable across languages (used to line up the compare table). */
    specs: Object.entries(product.specifications).map(([key, value]) => {
      if (!fr) return [key, key, value] as const;
      const t = product.specificationsFr[key];
      return [key, t?.name || SPEC_NAMES_FR[key.trim().toLowerCase()] || key, t?.value || value] as const;
    }),
  };
}

/** The French label for an English spec name, from the built-in list (used for hints in the admin form). */
export const defaultSpecNameFr = (key: string) => SPEC_NAMES_FR[key.trim().toLowerCase()] ?? '';
