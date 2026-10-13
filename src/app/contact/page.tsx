import type { Metadata } from 'next';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { ContactForm } from '@/components/content/ContactForm';
import { getT } from '@/i18n/server';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Questions about an order or need help choosing an IEM? Contact Level Up TN — we reply within 24 hours.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const t = await getT();
  const info = [
    { Icon: Mail, label: t.contact.email_label, value: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
    { Icon: Phone, label: t.contact.phone_label, value: SUPPORT_PHONE, href: `tel:${SUPPORT_PHONE.replace(/\s/g, '')}` },
    { Icon: MapPin, label: t.contact.location_label, value: 'Tunis, Tunisia', href: null },
  ];
  return (
    <div className="shell pb-10 pt-10 lg:pt-16">
      <p className="eyebrow">{t.contact.tag}</p>
      <h1 className="display mt-4 text-5xl uppercase sm:text-7xl">{t.contact.title}</h1>
      <p className="mt-3 text-soft">{t.contact.subtitle}</p>

      <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="grid h-fit gap-4">
          {info.map(({ Icon, label, value, href }) => (
            <div key={label} className="card flex items-center gap-4 p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/12 text-brand-500"><Icon size={20} /></span>
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-wider text-faint">{label}</p>
                {href ? <a href={href} className="block truncate font-medium hover:text-brand-500 dark:hover:text-brand-300">{value}</a> : <p className="font-medium">{value}</p>}
              </div>
            </div>
          ))}
          <div className="rounded-3xl border border-brand-500/30 bg-brand-500/[0.07] p-6">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-brand-600 dark:text-brand-300"><Clock size={13} /> {t.contact.response_time_tag}</p>
            <p className="mt-2 text-sm text-soft">{t.contact.response_time_text}</p>
          </div>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
