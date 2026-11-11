import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CornerUpLeft, Feather } from 'lucide-react';
import OceanBackdrop from '../../components/Ocean/OceanBackdrop';
import BottleSvg from '../../components/Bottle/BottleSvg';
import { useOcean } from '../../hooks/OceanContext';
import { categoryGlyph, categoryLabel } from '../../lib/categories';
import { formatMonth, formatShort, letterTitle } from '../../lib/format';
import type { Letter } from '../../types';

type Filter = 'all' | 'mine' | 'theirs' | 'unread' | 'memories' | 'replies';

export default function CollectionPage() {
  const { letters, me, partner, nameOf, unreadIds, openLetter, openComposer, status } = useOcean();
  const [params, setParams] = useSearchParams();
  const raw = params.get('filter') as Filter | null;
  const filter: Filter = raw && ['all', 'mine', 'theirs', 'unread', 'memories', 'replies'].includes(raw) ? raw : 'all';
  const partnerName = partner?.display_name ?? 'Mikku';

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All letters' },
    { id: 'mine', label: 'Written by me' },
    { id: 'theirs', label: `Written by ${partnerName}` },
    { id: 'unread', label: 'Unread letters' },
    { id: 'memories', label: 'Memories' },
    { id: 'replies', label: 'Replies' },
  ];

  const visible = useMemo(() => {
    const test: Record<Filter, (l: Letter) => boolean> = {
      all: () => true,
      mine: (l) => l.sender_id === me.id,
      theirs: (l) => l.sender_id !== me.id,
      unread: (l) => unreadIds.has(l.id),
      memories: (l) => l.category === 'memory',
      replies: (l) => l.reply_to_id !== null,
    };
    return letters.filter(test[filter]).slice().reverse(); // chronological, newest first
  }, [letters, filter, me.id, unreadIds]);

  const groups = useMemo(() => {
    const map = new Map<string, Letter[]>();
    for (const l of visible) {
      const key = formatMonth(l.created_at);
      map.set(key, [...(map.get(key) ?? []), l]);
    }
    return [...map.entries()];
  }, [visible]);

  const title = filter === 'memories' ? 'Our Memories' : 'Our Little Collection';

  return (
    <div className="collection-page">
      <OceanBackdrop horizon={0.3} calm />
      <div className="collection-scrim" />
      <motion.div
        className="collection-inner"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="display small">
          {title} <span className="heart-glyph">♡</span>
        </h1>
        <p className="muted">Every bottle we’ve ever sent, in the order it floated in.</p>

        <div className="chips" role="tablist" aria-label="Filter letters">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`chip ${filter === f.id ? 'on' : ''}`}
              onClick={() => setParams(f.id === 'all' ? {} : { filter: f.id })}
            >
              {f.label}
              {f.id === 'unread' && unreadIds.size > 0 && <i className="chip-count">{unreadIds.size}</i>}
            </button>
          ))}
        </div>

        {status === 'loading' && <p className="muted center">Gathering our bottles…</p>}

        {status !== 'loading' && visible.length === 0 && (
          <div className="empty-card">
            <p className="lead">
              {letters.length === 0 ? 'Nothing here yet.' : 'No letters match this filter.'}
            </p>
            <button type="button" className="btn primary" onClick={() => openComposer()}>
              <Feather size={16} /> Write a letter
            </button>
          </div>
        )}

        {groups.map(([month, items]) => (
          <section key={month} className="month">
            <h2 className="month-title">{month}</h2>
            <ul className="letter-list">
              {items.map((l) => {
                const unread = unreadIds.has(l.id);
                return (
                  <li key={l.id}>
                    <button type="button" className={`letter-card ${unread ? 'unread' : ''}`} onClick={() => openLetter(l.id, null)}>
                      <span className="letter-card-bottle" aria-hidden="true">
                        <BottleSvg style={l.bottle.bottle_style} />
                      </span>
                      <span className="letter-card-main">
                        <span className="letter-card-title">
                          {unread && <i className="dot" aria-label="unread" />}
                          {letterTitle(l)}
                        </span>
                        <span className="letter-card-meta">
                          {nameOf(l.sender_id)} → {nameOf(l.recipient_id)} · {formatShort(l.created_at)}
                        </span>
                        <span className="letter-card-snippet">{l.content}</span>
                      </span>
                      <span className="letter-card-tags">
                        <span className="tag">
                          {categoryGlyph(l.category)} {categoryLabel(l.category)}
                        </span>
                        {l.reply_to_id && (
                          <span className="tag soft">
                            <CornerUpLeft size={12} /> reply
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </motion.div>
    </div>
  );
}
