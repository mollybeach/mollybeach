// path: src/components/GiltDivider.tsx
import React from 'react';

/**
 * A gilded border between the sidebar and the page: a band of gold with a
 * running ornament of diamonds and pearls, a jewelled medallion at its middle,
 * and a finial at each end. Only on wide screens, where the sidebar sits
 * beside the page (on a phone it slides over it instead).
 */
const GiltDivider: React.FC = () => (
  <div aria-hidden className="gilt-divider hidden lg:block">
    <span className="gilt-divider__finial gilt-divider__finial--top" />
    <span className="gilt-divider__medallion" />
    <span className="gilt-divider__finial gilt-divider__finial--bottom" />
  </div>
);

export default GiltDivider;
