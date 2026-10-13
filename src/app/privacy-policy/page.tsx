import type { Metadata } from 'next';
import Link from '@/components/Link';
import { LegalPage } from '@/components/content/LegalPage';
import { getT, localizedMetadata } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return localizedMetadata('/privacy-policy', {
    en: { title: 'Privacy Policy', description: "How Level Up TN collects, uses and protects your personal data." },
    fr: { title: "Politique de confidentialité", description: "Comment Level Up TN collecte, utilise et protège vos données personnelles." },
  });
}

const link = 'font-semibold text-brand-600 hover:underline dark:text-brand-300';

export default async function PrivacyPolicyPage() {
  const t = await getT();
  const p = t.privacy_policy;
  return (
    <LegalPage
      tag={p.tag}
      title={p.title}
      updated={p.last_updated}
      intro={p.intro}
      sections={p.sections}
      footer={<>{p.questions} <Link href="/contact" className={link}>{p.contact_link}</Link> · {p.see_also} <Link href="/return-policy" className={link}>{p.return_policy_link}</Link></>}
    />
  );
}
