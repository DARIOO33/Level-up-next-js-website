'use client';
import { useEffect, useState } from 'react';
import { GOVERNORATES } from '@/lib/constants';
import { useT } from '@/i18n/client';
import { Field } from './ui';

export type City = { name: string; postalCode: string };

const cache = new Map<string, City[]>();

/** Delegations of a governorate (with postal codes), via our /api/municipalities proxy. */
export async function loadCities(governorate: string): Promise<City[]> {
  if (!governorate) return [];
  const hit = cache.get(governorate);
  if (hit) return hit;
  try {
    const res = await fetch(`/api/municipalities?name=${encodeURIComponent(governorate)}`);
    const data = await res.json();
    const seen = new Set<string>();
    const cities: City[] = [];
    for (const c of data?.[0]?.Delegations ?? []) {
      const name = String(c?.Name ?? '').trim();
      const k = name.toLowerCase();
      if (!name || seen.has(k)) continue;
      seen.add(k);
      cities.push({ name, postalCode: String(c?.PostalCode ?? '') });
    }
    cities.sort((a, b) => a.name.localeCompare(b.name));
    cache.set(governorate, cities);
    return cities;
  } catch {
    return [];
  }
}

export type Place = { governorate: string; city: string; postalCode: string };

/** Governorate + city pickers. The city list follows the governorate. */
export function PlaceFields({ value, onChange, errors }: { value: Place; onChange: (next: Place) => void; errors?: { governorate?: string; city?: string } }) {
  const t = useT();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!value.governorate) {
      setCities([]);
      return;
    }
    setLoading(true);
    loadCities(value.governorate).then((list) => {
      if (!alive) return;
      setCities(list);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [value.governorate]);

  // A saved city that the API no longer lists is still offered, so nothing silently disappears.
  const options = value.city && !cities.some((c) => c.name === value.city) ? [{ name: value.city, postalCode: value.postalCode }, ...cities] : cities;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t.checkout.governorate} error={errors?.governorate}>
        <select className="input" value={value.governorate} onChange={(e) => onChange({ governorate: e.target.value, city: '', postalCode: '' })}>
          <option value="">{t.ui.checkout.select_governorate}</option>
          {GOVERNORATES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </Field>
      <Field label={t.checkout.city} error={errors?.city}>
        <select
          className="input"
          value={value.city}
          disabled={!value.governorate || loading}
          onChange={(e) => {
            const city = options.find((c) => c.name === e.target.value);
            onChange({ ...value, city: city?.name ?? '', postalCode: city?.postalCode ?? '' });
          }}
        >
          <option value="">{loading ? t.ui.checkout.loading_cities : t.ui.checkout.select_city}</option>
          {options.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}{c.postalCode ? ` (${c.postalCode})` : ''}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
