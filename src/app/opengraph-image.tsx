import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'Level Up TN — Premium IEMs & Audio Gear in Tunisia';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const mark = `data:image/png;base64,${(await readFile(join(process.cwd(), 'public/brand-mark.png'))).toString('base64')}`;
  // A frequency-response curve as the backdrop, echoing the site's hero.
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: 'linear-gradient(135deg, #1a0d3a 0%, #08070d 60%)', color: '#f3f0fc', fontFamily: 'sans-serif' }}>
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', left: 0, top: 0 }}>
          <path d="M0 330 C 150 300, 250 300, 400 400 S 620 520, 760 430 S 980 250, 1200 300 L1200 630 L0 630 Z" fill="rgba(124,58,237,0.22)" />
          <path d="M0 330 C 150 300, 250 300, 400 400 S 620 520, 760 430 S 980 250, 1200 300" fill="none" stroke="#a855f7" strokeWidth="5" />
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} width={46} height={65} alt="" />
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, letterSpacing: 10, color: '#f3f0fc' }}>LEVEL UP</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 118, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>HEAR EVERY</div>
          <div style={{ display: 'flex', fontSize: 118, fontWeight: 800, lineHeight: 1, letterSpacing: -3, color: '#a855f7' }}>DETAIL</div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 30, color: '#8d87a8' }}>Premium IEMs & audio gear · Free delivery across Tunisia</div>
        </div>
      </div>
    ),
    size,
  );
}
