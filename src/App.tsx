import { Suspense, lazy } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Welcome from './pages/Welcome/Welcome';
import Login from './pages/Login/Login';
import OceanPage from './pages/Ocean/OceanPage';
import AppShell from './components/Navigation/AppShell';
import RequireAuth from './components/Navigation/RequireAuth';

const CollectionPage = lazy(() => import('./pages/Collection/CollectionPage'));

/**
 * HashRouter keeps every route working on GitHub Pages (which has no server-side
 * rewrites) and under any repository base path.
 */
export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/ocean" element={<OceanPage />} />
            <Route
              path="/collection"
              element={
                <Suspense fallback={null}>
                  <CollectionPage />
                </Suspense>
              }
            />
          </Route>
          {/* also catches the magic-link return (#access_token=…) and sends signed-in users to the ocean */}
          <Route path="*" element={<Navigate to="/ocean" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
