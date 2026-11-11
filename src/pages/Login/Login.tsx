import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Loader2, Mail } from 'lucide-react';
import OceanBackdrop from '../../components/Ocean/OceanBackdrop';
import SetupNotice from '../../components/Navigation/SetupNotice';
import { useAuth } from '../../hooks/useAuth';
import { isConfigured, redirectUrl } from '../../lib/config';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const { status } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'link' | 'password'>('link');
  const [phase, setPhase] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  if (!isConfigured) return <SetupNotice />;
  if (status === 'ready') return <Navigate to="/ocean" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'password') {
      if (phase === 'sending') return;
      setPhase('sending');
      setError(null);
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (err) {
        setPhase('idle');
        setError(/invalid login/i.test(err.message) ? 'Wrong email or password.' : err.message);
      }
      return; // on success the auth listener signs us in and we redirect to the ocean
    }
    if (phase === 'sending' || cooldown > 0) return;
    setPhase('sending');
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: redirectUrl(),
        data: name.trim() ? { display_name: name.trim() } : undefined,
      },
    });
    if (err) {
      setPhase('idle');
      // The database trigger rejects anyone who isn't one of the two allowed people.
      setError(
        /private|not allowed|database error/i.test(err.message)
          ? 'This ocean belongs to two people only — that email isn’t one of them.'
          : err.message,
      );
      return;
    }
    setPhase('sent');
    setCooldown(45);
  };

  return (
    <OceanBackdrop horizon={0.55} calm>
      <div className="center-screen">
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="display small">
            Hii Mikku <span className="heart-glyph">♡</span>
          </h1>
          {phase === 'sent' ? (
            <div role="status">
              <p className="lead">A little message is on its way to your inbox.</p>
              <p className="muted">
                Open the link in the email to step into our ocean. It can take a minute — check spam if it’s shy.
              </p>
              <button type="button" className="btn ghost" disabled={cooldown > 0} onClick={() => setPhase('idle')}>
                {cooldown > 0 ? `Send another in ${cooldown}s` : 'Use a different email'}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate={false}>
              <p className="muted">Only the two of us can come in. Sign in with a magic link — no password needed.</p>
              <label className="field">
                <span>Your email</span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              {mode === 'password' ? (
                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                  />
                </label>
              ) : (
                <label className="field">
                  <span>
                    What should we call you? <small>(first time only)</small>
                  </span>
                  <input
                    type="text"
                    autoComplete="nickname"
                    maxLength={40}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </label>
              )}
              {error && (
                <p className="form-msg error" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn primary wide"
                disabled={phase === 'sending' || !email || (mode === 'password' && !password)}
              >
                {phase === 'sending' ? (
                  <Loader2 size={16} className="spin" />
                ) : mode === 'password' ? (
                  <KeyRound size={16} />
                ) : (
                  <Mail size={16} />
                )}{' '}
                {mode === 'password' ? 'Sign in' : 'Send me a magic link'}
              </button>
              <button
                type="button"
                className="btn ghost wide"
                onClick={() => {
                  setMode(mode === 'link' ? 'password' : 'link');
                  setError(null);
                }}
              >
                {mode === 'link' ? 'Use a password instead' : 'Use a magic link instead'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </OceanBackdrop>
  );
}
