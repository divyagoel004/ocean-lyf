import type { ReactNode } from 'react';
import OceanCanvas from './OceanCanvas';
import Clouds from './Clouds';

interface Props {
  horizon?: number;
  calm?: boolean;
  children?: ReactNode;
  className?: string;
}

/** Sky gradient + clouds + animated sea. Everything else floats on top of it. */
export default function OceanBackdrop({ horizon = 0.42, calm, children, className = '' }: Props) {
  return (
    <div className={`ocean-backdrop ${className}`}>
      <Clouds />
      <OceanCanvas horizon={horizon} calm={calm} />
      {children}
    </div>
  );
}
