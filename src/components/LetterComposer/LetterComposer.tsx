import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, Feather, Loader2, PenLine, Save, Send, X } from 'lucide-react';
import Paper from '../Letter/Paper';
import { CATEGORIES } from '../../lib/categories';
import { formatFull } from '../../lib/format';
import { deleteDraft, fetchDraft, saveDraft } from '../../services/letters';
import type { Category, Letter, NewLetterInput, Profile } from '../../types';

interface Props {
  me: Profile;
  partner: Profile | null;
  replyTo: Letter | null;
  replyToName: string | null;
  onClose: () => void;
  onRelease: (input: NewLetterInput) => Promise<unknown>;
}

interface LocalDraft {
  title: string;
  content: string;
  category: Category;
  at: number;
}

const BOTH = '__both__';

export default function LetterComposer({ me, partner, replyTo, replyToName, onClose, onRelease }: Props) {
  const replyId = replyTo?.id ?? null;
  const localKey = `hii-mikku:draft:${me.id}:${replyId ?? 'new'}`;

  // default recipient: the other person (or whoever the original letter was from)
  const defaultTo = useMemo(() => {
    if (replyTo) return replyTo.sender_id === me.id ? replyTo.recipient_id ?? BOTH : replyTo.sender_id;
    return partner?.id ?? BOTH;
  }, [replyTo, partner, me.id]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>(replyTo ? 'just_because' : 'missing_you');
  const [to, setTo] = useState<string>(defaultTo);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [note, setNote] = useState<string>('');
  const [busy, setBusy] = useState<'release' | 'draft' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'write' | 'preview'>('write');
  const [fullPreview, setFullPreview] = useState(false);
  const [now] = useState(() => new Date().toISOString());
  const dirty = useRef(false);
  const loaded = useRef(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // restore a draft (server first, local backup if newer / offline)
  useEffect(() => {
    let alive = true;
    (async () => {
      let local: LocalDraft | null = null;
      try {
        const raw = localStorage.getItem(localKey);
        if (raw) local = JSON.parse(raw) as LocalDraft;
      } catch {
        /* ignore */
      }
      let remoteAt = 0;
      try {
        const d = await fetchDraft(me.id, replyId);
        if (alive && d) {
          remoteAt = new Date(d.updated_at).getTime();
          setDraftId(d.id);
          setTitle(d.title);
          setContent(d.content);
          setCategory(d.category);
          setNote('Draft restored');
        }
      } catch {
        /* offline — fall back to local */
      }
      if (alive && local && local.at > remoteAt && (local.content || local.title)) {
        setTitle(local.title);
        setContent(local.content);
        setCategory(local.category);
        setNote('Draft restored');
      }
      if (alive) {
        loaded.current = true;
        textRef.current?.focus();
      }
    })();
    return () => {
      alive = false;
    };
  }, [me.id, replyId, localKey]);

  // local backup on every change (debounced) — survives refreshes and bad connections
  useEffect(() => {
    if (!loaded.current || !dirty.current) return;
    const id = window.setTimeout(() => {
      try {
        if (!title && !content) localStorage.removeItem(localKey);
        else localStorage.setItem(localKey, JSON.stringify({ title, content, category, at: Date.now() } satisfies LocalDraft));
      } catch {
        /* storage full / blocked */
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [title, content, category, localKey]);

  const touch = () => {
    dirty.current = true;
    setNote('');
    setError(null);
  };

  const toName = to === BOTH ? 'Both of us' : to === partner?.id ? partner.display_name : to === me.id ? me.display_name : replyToName ?? 'Mikku';

  const clearLocal = useCallback(() => {
    try {
      localStorage.removeItem(localKey);
    } catch {
      /* ignore */
    }
  }, [localKey]);

  const handleSaveDraft = async () => {
    if (!title.trim() && !content.trim()) return;
    setBusy('draft');
    setError(null);
    try {
      const d = await saveDraft({ id: draftId, user_id: me.id, title, content, category, reply_to_id: replyId });
      setDraftId(d.id);
      setNote('Draft saved ♡');
    } catch {
      setNote('Saved on this device — will sync when you’re back online');
    } finally {
      setBusy(null);
    }
  };

  const handleRelease = async () => {
    if (!content.trim()) {
      setError('Write a few words first — even a tiny one.');
      textRef.current?.focus();
      return;
    }
    setBusy('release');
    setError(null);
    try {
      await onRelease({
        title,
        content: content.trim(),
        sender_id: me.id,
        recipient_id: to === BOTH ? null : to,
        category,
        reply_to_id: replyId,
      });
      clearLocal();
      if (draftId) deleteDraft(draftId).catch(() => undefined);
    } catch (e) {
      setBusy(null);
      setError(
        navigator.onLine
          ? `The bottle couldn’t be released: ${e instanceof Error ? e.message : 'unknown error'}. Your words are safe — try again.`
          : 'You seem to be offline. Your words are safe here — try again when the connection returns.',
      );
    }
  };

  // Esc closes (drafts are kept locally)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (fullPreview) setFullPreview(false);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullPreview, onClose]);

  const paper = (
    <Paper
      title={title}
      from={me.display_name}
      to={toName}
      date={formatFull(now)}
      content={content}
      category={category}
      placeholder="Your words will appear here, just like they’ll look in the bottle…"
    />
  );

  return (
    <motion.div
      className="composer-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      role="dialog"
      aria-modal="true"
      aria-label={replyTo ? 'Write a reply' : 'Write a letter'}
    >
      <div className="reader-scrim" onClick={onClose} />
      <motion.div
        className="composer-panel"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="composer-head">
          <h2>
            <PenLine size={18} /> {replyTo ? 'Write a reply' : 'Write a letter'}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close composer">
            <X size={18} />
          </button>
        </header>

        {replyTo && (
          <p className="composer-replying">
            Replying to <em>“{replyTo.title.trim() || 'A letter without a name'}”</em>
            {replyToName ? ` from ${replyToName}` : ''}
          </p>
        )}

        <div className="composer-tabs" role="tablist" aria-label="Composer view">
          <button type="button" role="tab" aria-selected={mobileTab === 'write'} className={mobileTab === 'write' ? 'on' : ''} onClick={() => setMobileTab('write')}>
            Write
          </button>
          <button type="button" role="tab" aria-selected={mobileTab === 'preview'} className={mobileTab === 'preview' ? 'on' : ''} onClick={() => setMobileTab('preview')}>
            Paper
          </button>
        </div>

        <div className="composer-body">
          <form
            className={`composer-form ${mobileTab === 'write' ? '' : 'hide-mobile'}`}
            onSubmit={(e) => {
              e.preventDefault();
              void handleRelease();
            }}
          >
            <label className="field">
              <span>Letter title <small>(optional)</small></span>
              <input
                value={title}
                maxLength={140}
                placeholder="A name for this little bottle"
                onChange={(e) => {
                  setTitle(e.target.value);
                  touch();
                }}
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span>From</span>
                <input value={me.display_name} readOnly aria-readonly="true" className="readonly" />
              </label>
              <label className="field">
                <span>To</span>
                <select
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    touch();
                  }}
                >
                  {partner && <option value={partner.id}>{partner.display_name}</option>}
                  <option value={BOTH}>Both of us</option>
                </select>
              </label>
            </div>

            <fieldset className="field moods">
              <legend>Mood</legend>
              <div className="mood-grid">
                {CATEGORIES.map((c) => (
                  <button
                    type="button"
                    key={c.value}
                    className={`mood ${category === c.value ? 'on' : ''}`}
                    aria-pressed={category === c.value}
                    onClick={() => {
                      setCategory(c.value);
                      touch();
                    }}
                  >
                    <span aria-hidden="true">{c.glyph}</span> {c.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="field grow">
              <span>Your letter</span>
              <textarea
                ref={textRef}
                value={content}
                maxLength={20000}
                rows={9}
                placeholder="Say the thing you might not always be able to say out loud…"
                onChange={(e) => {
                  setContent(e.target.value);
                  touch();
                }}
              />
            </label>

            <AnimatePresence>
              {(error || note) && (
                <motion.p
                  key={error ?? note}
                  className={error ? 'form-msg error' : 'form-msg'}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role={error ? 'alert' : 'status'}
                >
                  {error ?? note}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="composer-actions">
              <button type="button" className="btn ghost" onClick={() => setFullPreview(true)}>
                <Eye size={16} /> Preview Letter
              </button>
              <button type="button" className="btn ghost" onClick={handleSaveDraft} disabled={busy !== null}>
                {busy === 'draft' ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Save as Draft
              </button>
              <button type="submit" className="btn primary release" disabled={busy !== null}>
                {busy === 'release' ? <Loader2 size={16} className="spin" /> : <Send size={16} />} Release Into Ocean ♡
              </button>
            </div>
          </form>

          <aside className={`composer-preview ${mobileTab === 'preview' ? '' : 'hide-mobile'}`} aria-label="Live paper preview">
            <p className="preview-label">
              <Feather size={14} /> Live preview
            </p>
            {paper}
          </aside>
        </div>
      </motion.div>

      <AnimatePresence>
        {fullPreview && (
          <motion.div
            className="full-preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="full-preview-inner">
              {paper}
              <div className="reader-actions">
                <button type="button" className="btn ghost" onClick={() => setFullPreview(false)}>
                  Keep writing
                </button>
                <button type="button" className="btn primary" onClick={handleRelease} disabled={busy !== null}>
                  <Send size={16} /> Release Into Ocean ♡
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
