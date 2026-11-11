import { memo } from 'react';

/** Soft clouds drifting slowly across the night sky (pure CSS, GPU transforms). */
function CloudsInner() {
  return (
    <div className="clouds" aria-hidden="true">
      <span className="cloud c1" />
      <span className="cloud c2" />
      <span className="cloud c3" />
    </div>
  );
}

export default memo(CloudsInner);
