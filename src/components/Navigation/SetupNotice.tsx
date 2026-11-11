import OceanBackdrop from '../Ocean/OceanBackdrop';

/** Friendly screen shown when the Supabase env vars were not provided at build time. */
export default function SetupNotice() {
  return (
    <OceanBackdrop horizon={0.5} calm>
      <div className="center-screen">
        <div className="glass-card">
          <h1 className="display small">Almost there ♡</h1>
          <p>The ocean isn’t connected to its database yet.</p>
          <ol className="setup-list">
            <li>
              Create a Supabase project and run <code>supabase/schema.sql</code> then <code>supabase/policies.sql</code>.
            </li>
            <li>
              Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code> (or to your GitHub
              repository secrets for deployment).
            </li>
            <li>Restart the dev server / re-run the deploy workflow.</li>
          </ol>
          <p className="muted">The README walks through every step.</p>
        </div>
      </div>
    </OceanBackdrop>
  );
}
