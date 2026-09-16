// path: src/components/GiltDivider.tsx
import React from 'react';

/**
 * A plain gilded rule between the sidebar and the page: a slim band of gold
 * with rounded ends. Only on wide screens, where the sidebar sits beside the
 * page (on a phone it slides over it instead).
 */
const GiltDivider: React.FC = () => <div aria-hidden className="gilt-divider hidden lg:block" />;

export default GiltDivider;
