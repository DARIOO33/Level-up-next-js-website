'use client';

/** Last-resort boundary (the root layout itself failed, e.g. the database is unreachable). */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#08070d', color: '#f3f0fc', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: '#b6b0cd' }}>The site could not be loaded. Please try again in a moment.</p>
          <button onClick={reset} style={{ marginTop: 16, height: 44, padding: '0 24px', borderRadius: 999, border: 0, background: '#7c3aed', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
