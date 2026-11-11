import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { isConfigured } from '../../lib/config';
import OceanBackdrop from '../Ocean/OceanBackdrop';
import SetupNotice from './SetupNotice';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { status, signOut } = useAuth();
  const loc = useLocation();

  if (!isConfigured) return <SetupNotice />;

  if (status === 'loading') {
    return (
      <OceanBackdrop horizon={0.5} calm>
        <div className="center-screen" role="status">
          <Loader2 className="spin" size={28} aria-hidden="true" />
          <p>Finding the tide…</p>
        </div>
      </OceanBackdrop>
    );
  }

  if (status === 'signedOut') return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  if (status === 'denied') {
    return (
      <OceanBackdrop horizon={0.5} calm>
        <div className="center-screen">
          <div className="glass-card narrow">
            <h1 className="display small">This ocean is private</h1>
            <p>This account isn’t one of the two people who belong here.</p>
            <button type="button" className="btn primary" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </OceanBackdrop>
    );
  }

  return <>{children}</>;
}
