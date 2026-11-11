import { categoryGlyph, categoryLabel } from '../../lib/categories';
import type { Category } from '../../types';

interface Props {
  title: string;
  from: string;
  to: string;
  date: string;
  content: string;
  category?: Category;
  placeholder?: string;
}

/** The handwritten-style paper used by the reader and the composer's live preview. */
export default function Paper({ title, from, to, date, content, category, placeholder }: Props) {
  return (
    <article className="paper">
      <header className="paper-head">
        <h2 className="paper-title">{title.trim() || (placeholder ? 'Untitled letter' : 'A letter without a name')}</h2>
        <dl className="paper-meta">
          <div>
            <dt>From</dt>
            <dd>{from}</dd>
          </div>
          <div>
            <dt>To</dt>
            <dd>{to}</dd>
          </div>
          <div>
            <dt>Written</dt>
            <dd>
              <time>{date}</time>
            </dd>
          </div>
        </dl>
        {category && (
          <span className="paper-mood">
            {categoryGlyph(category)} {categoryLabel(category)}
          </span>
        )}
      </header>
      <div className="paper-body">
        {content ? content : <span className="paper-placeholder">{placeholder ?? ''}</span>}
      </div>
      <footer className="paper-seal" aria-hidden="true">
        ♡
      </footer>
    </article>
  );
}
