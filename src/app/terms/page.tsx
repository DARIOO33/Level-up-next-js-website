import type { Metadata } from 'next';
import Link from '@/components/Link';
import { LegalPage } from '@/components/content/LegalPage';
import { getT, localizedMetadata } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return localizedMetadata('/terms', {
    en: { title: 'Terms of Service', description: "The terms that govern your use of Level Up TN and any purchases you make." },
    fr: { title: "Conditions d'utilisation", description: "Les conditions qui régissent votre utilisation de Level Up TN et vos achats." },
  });
}

const link = 'font-semibold text-brand-600 hover:underline dark:text-brand-300';

export default async function TermsPage() {
  const t = await getT();
  const p = t.terms;
  return (
    <LegalPage
      tag={p.tag}
      title={p.title}
      updated={p.last_updated}
      intro={p.intro}
      sections={p.sections}
      footer={<>{p.questions} <Link href="/contact" className={link}>{p.contact_link}</Link> · {p.see_also} <Link href="/privacy-policy" className={link}>{p.privacy_policy_link}</Link></>}
    />
  );
}
