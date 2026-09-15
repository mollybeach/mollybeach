// path: src/components/CertBadge.tsx
import React from 'react';

/**
 * A small drawn badge for each certification, standing in for the issuers'
 * logos (the LinkedIn image links they used to point at have expired). The
 * picture is about what the certificate covers; the colours are the issuer's.
 */

export type BadgeKind =
  | 'privacy-incident'
  | 'privacy-notice'
  | 'privacy-vendor'
  | 'privacy-assessment'
  | 'privacy-consent'
  | 'aws-network'
  | 'aws-database'
  | 'eth-mining'
  | 'solidity-functions'
  | 'hyperledger'
  | 'blockchain'
  | 'backend-api'
  | 'machine-learning'
  | 'feature-engineering'
  | 'auth'
  | 'nourish'
  | 'mind'
  | 'together';

/* the issuers' colours: tile background, tile border, and the drawing */
const ISSUER: Record<string, { bg: string; ring: string; ink: string }> = {
  Securiti: { bg: '#e8f1ff', ring: '#9cc2ff', ink: '#1554c0' },
  Skillsoft: { bg: '#e9f7f0', ring: '#9ad8b8', ink: '#0b7a4b' },
  AWS: { bg: '#232f3e', ring: '#ff9900', ink: '#ff9900' },
  freeCodeCamp: { bg: '#0a0a23', ring: '#3b3b4f', ink: '#f5f6f7' },
  Codecademy: { bg: '#fff0e5', ring: '#ffb57a', ink: '#3a10e5' },
  'Thrive Global': { bg: '#fdf0f3', ring: '#f5b5c4', ink: '#c2375b' },
};

const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const ICONS: Record<BadgeKind, React.ReactNode> = {
  // a shield with a warning mark: incidents and breaches
  'privacy-incident': (
    <>
      <path {...common} d="M12 3 5 6v5c0 4.4 3 8.3 7 10 4-1.7 7-5.6 7-10V6Z" />
      <path {...common} d="M12 8.5v4.5" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </>
  ),
  // a notice page with a small shield on it
  'privacy-notice': (
    <>
      <path {...common} d="M7 3h7l4 4v14H7Z" />
      <path {...common} d="M14 3v4h4" />
      <path {...common} d="M9.5 10.5h5M9.5 13h3" />
      <path {...common} d="M14.5 15.2 12.5 16v1.4c0 1.3.9 2.3 2 2.8 1.1-.5 2-1.5 2-2.8V16Z" />
    </>
  ),
  // a vendor's shopfront, ticked off
  'privacy-vendor': (
    <>
      <path {...common} d="M4 9 5.5 4h13L20 9" />
      <path {...common} d="M4 9c0 1.4 1.1 2.5 2.7 2.5S9.3 10.4 9.3 9c0 1.4 1.2 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1.1 2.5 2.6 2.5S20 10.4 20 9" />
      <path {...common} d="M5.5 11.5V20h13v-8.5" />
      <path {...common} d="m9.5 16 2 2 3.5-3.5" />
    </>
  ),
  // a clipboard with a checklist
  'privacy-assessment': (
    <>
      <rect {...common} x="6" y="4.5" width="12" height="16" rx="2" />
      <path {...common} d="M9.5 4.5V3h5v1.5" />
      <path {...common} d="m8.8 10 1.2 1.2 2-2M8.8 15l1.2 1.2 2-2" />
      <path {...common} d="M14 10.2h2M14 15.2h2" />
    </>
  ),
  // a person and a consent switch
  'privacy-consent': (
    <>
      <circle {...common} cx="8" cy="7.5" r="2.5" />
      <path {...common} d="M3.5 17c.6-2.8 2.3-4.2 4.5-4.2s3.9 1.4 4.5 4.2" />
      <rect {...common} x="13" y="12.5" width="8" height="4.5" rx="2.25" />
      <circle cx="18.7" cy="14.75" r="1.4" fill="currentColor" />
    </>
  ),
  // the cloud, locked: network security
  'aws-network': (
    <>
      <path {...common} d="M7 17.5h10a3.5 3.5 0 0 0 .4-7A5 5 0 0 0 7.8 9.3 4 4 0 0 0 7 17.5Z" />
      <rect {...common} x="10" y="12.5" width="4.5" height="3.5" rx=".6" />
      <path {...common} d="M11 12.5v-1a1.25 1.25 0 0 1 2.5 0v1" />
      <path {...common} d="M5 21h14" />
    </>
  ),
  // a database, stacked like volumes
  'aws-database': (
    <>
      <ellipse {...common} cx="12" cy="5.5" rx="6.5" ry="2.5" />
      <path {...common} d="M5.5 5.5v13c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-13" />
      <path {...common} d="M5.5 10c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5M5.5 14.5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5" />
    </>
  ),
  // the Ether diamond over a pickaxe: mining
  'eth-mining': (
    <>
      <path {...common} d="m12 2.5 5 8.2-5 3-5-3Z" />
      <path {...common} d="m7 12.2 5 3 5-3-5 7Z" />
      <path {...common} d="M3.5 21 9 15.5M3 17.5c1.5-.9 3.4-1.1 5-.5" />
    </>
  ),
  // f( ) in braces: functions in Solidity
  'solidity-functions': (
    <>
      <path {...common} d="M7.5 4.5c-1.7 0-2.5.8-2.5 2.3v2.4c0 1.3-.7 2-2 2.3 1.3.3 2 1 2 2.3v2.4c0 1.5.8 2.3 2.5 2.3" />
      <path {...common} d="M16.5 4.5c1.7 0 2.5.8 2.5 2.3v2.4c0 1.3.7 2 2 2.3-1.3.3-2 1-2 2.3v2.4c0 1.5-.8 2.3-2.5 2.3" />
      <path {...common} d="M13.2 7.5c-1.4-.4-2.4.3-2.6 1.8L9.7 15c-.3 1.6-1.2 2.2-2.4 1.8M9 11h4" />
      <path {...common} d="M14 10.5c-.8 1-.8 3.4 0 4.5M16 10.5c.8 1 .8 3.4 0 4.5" />
    </>
  ),
  // linked ledger blocks: Hyperledger Fabric
  hyperledger: (
    <>
      <rect {...common} x="3" y="3.5" width="7" height="7" rx="1.5" />
      <rect {...common} x="14" y="3.5" width="7" height="7" rx="1.5" />
      <rect {...common} x="8.5" y="13.5" width="7" height="7" rx="1.5" />
      <path {...common} d="M10 7h4M7.5 10.5l2.2 3M16.5 10.5l-2.2 3" />
    </>
  ),
  // a cube of blocks: blockchain and smart contracts
  blockchain: (
    <>
      <path {...common} d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" />
      <path {...common} d="m4 7.5 8 4.5 8-4.5M12 12v9" />
      <path {...common} d="m8 5.3 8 4.5" />
    </>
  ),
  // a server answering an API call
  'backend-api': (
    <>
      <rect {...common} x="3.5" y="4" width="11" height="6" rx="1.5" />
      <rect {...common} x="3.5" y="14" width="11" height="6" rx="1.5" />
      <circle cx="6.5" cy="7" r=".9" fill="currentColor" />
      <circle cx="6.5" cy="17" r=".9" fill="currentColor" />
      <path {...common} d="m17.5 9-2.5 3 2.5 3M20 9l1.5 3-1.5 3" />
    </>
  ),
  // a small neural network
  'machine-learning': (
    <>
      <circle {...common} cx="5" cy="6" r="2" />
      <circle {...common} cx="5" cy="18" r="2" />
      <circle {...common} cx="12" cy="12" r="2" />
      <circle {...common} cx="19" cy="6" r="2" />
      <circle {...common} cx="19" cy="18" r="2" />
      <path {...common} d="m6.7 7.1 3.6 3.8M6.7 16.9l3.6-3.8M13.7 10.9l3.6-3.8M13.7 13.1l3.6 3.8M5 8v8M19 8v8" />
    </>
  ),
  // sliders: shaping features
  'feature-engineering': (
    <>
      <path {...common} d="M5 4v16M12 4v16M19 4v16" />
      <circle cx="5" cy="15" r="2.2" fill="#fff" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="8" r="2.2" fill="#fff" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="19" cy="13" r="2.2" fill="#fff" stroke="currentColor" strokeWidth="1.8" />
    </>
  ),
  // a key: signing in, and what you're allowed to do
  auth: (
    <>
      <circle {...common} cx="8" cy="12" r="4.5" />
      <circle cx="8" cy="12" r="1.3" fill="currentColor" />
      <path {...common} d="M12.5 12H21M17 12v3M20 12v2.5" />
    </>
  ),
  // an apple with a leaf: nourishment
  nourish: (
    <>
      <path {...common} d="M12 8c-1.6-1.4-4.6-1.4-6 .8-1.8 2.8-.6 7.6 1.8 10 1.3 1.3 2.6 1.4 4.2.6 1.6.8 2.9.7 4.2-.6 2.4-2.4 3.6-7.2 1.8-10-1.4-2.2-4.4-2.2-6-.8Z" />
      <path {...common} d="M12 8c0-2 .6-3.5 2-4.5" />
      <path {...common} d="M13.5 5.2c1.4-1.4 3.4-1.4 4.5-.7-.4 1.5-2.4 2.6-4.5.7Z" />
    </>
  ),
  // a lotus: a calm mind
  mind: (
    <>
      <path {...common} d="M12 5c1.8 2 2.6 4.3 2.6 6.4S13.6 15.6 12 17c-1.6-1.4-2.6-3.5-2.6-5.6S10.2 7 12 5Z" />
      <path {...common} d="M9.6 9.5C7.4 8.8 5.2 9 3.5 10c.4 3.6 3.6 6.6 8.5 7M14.4 9.5c2.2-.7 4.4-.5 6.1.5-.4 3.6-3.6 6.6-8.5 7" />
      <path {...common} d="M5 20h14" />
    </>
  ),
  // two hearts together
  together: (
    <>
      <path {...common} d="M9 18.5s-5.5-3.3-5.5-7.4A3 3 0 0 1 9 9.3a3 3 0 0 1 5.5 1.8c0 4.1-5.5 7.4-5.5 7.4Z" />
      <path {...common} d="M15.2 7.6a2.6 2.6 0 0 1 5.3 1.6c0 2.9-3.2 5.3-4.6 6.2" />
    </>
  ),
};

export default function CertBadge({ kind, issuer, title }: { kind: BadgeKind; issuer: string; title: string }) {
  // the AWS courses wear AWS's colours, whoever taught them
  const c = (kind.startsWith('aws') ? ISSUER.AWS : ISSUER[issuer === 'CodeAcademy' ? 'Codecademy' : issuer]) ?? { bg: '#f3f4f6', ring: '#d1d5db', ink: '#374151' };
  return (
    <div
      role="img"
      aria-label={`${issuer}: ${title}`}
      className="h-14 w-14 rounded-xl grid place-items-center shrink-0"
      style={{ background: c.bg, boxShadow: `inset 0 0 0 2px ${c.ring}`, color: c.ink }}
    >
      <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
        {ICONS[kind]}
      </svg>
    </div>
  );
}
