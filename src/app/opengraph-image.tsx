import { ImageResponse } from 'next/og';

export const alt = 'Level Up TN — Premium IEMs & Audio Gear in Tunisia';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  // A frequency-response curve as the backdrop, echoing the site's hero.
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: 'linear-gradient(135deg, #1a0d3a 0%, #08070d 60%)', color: '#f3f0fc', fontFamily: 'sans-serif' }}>
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', left: 0, top: 0 }}>
          <path d="M0 330 C 150 300, 250 300, 400 400 S 620 520, 760 430 S 980 250, 1200 300 L1200 630 L0 630 Z" fill="rgba(124,58,255,0.22)" />
          <path d="M0 330 C 150 300, 250 300, 400 400 S 620 520, 760 430 S 980 250, 1200 300" fill="none" stroke="#9c6aff" strokeWidth="5" />
        </svg>
        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, color: '#bc9dff', textTransform: 'uppercase' }}>Level Up TN</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 118, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>HEAR EVERY</div>
          <div style={{ display: 'flex', fontSize: 118, fontWeight: 800, lineHeight: 1, letterSpacing: -3, color: '#9c6aff' }}>DETAIL</div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 30, color: '#b6b0cd' }}>Premium IEMs & audio gear · Free delivery across Tunisia</div>
        </div>
      </div>
    ),
    size,
  );
}
