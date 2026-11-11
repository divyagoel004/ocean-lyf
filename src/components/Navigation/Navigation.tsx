import { NavLink, useLocation } from 'react-router-dom';
import { BookHeart, Feather, LogOut, Moon, Sparkles, Volume2, VolumeX, Waves } from 'lucide-react';
import { useOcean } from '../../hooks/OceanContext';

export default function Navigation() {
  const { letters, unreadIds, soundOn, toggleSound, findRandom, openComposer, signOut, me } = useOcean();
  const loc = useLocation();
  const count = letters.length;

  return (
    <>
      <header className="topbar">
        <NavLink to="/ocean" className="brand" aria-label="Back to the ocean">
          <span className="moon-icon" aria-hidden="true">
            <Moon size={20} />
          </span>
          <span className="brand-text">Hii Mikku ♡</span>
        </NavLink>

        <span className="counter" title="Letters in our ocean" aria-label={`${count} ${count === 1 ? 'letter' : 'letters'} in our ocean`}>
          <Waves size={14} aria-hidden="true" />
          <b>{count}</b>
          <span className="counter-label">{count === 1 ? 'letter' : 'letters'}</span>
        </span>

        <nav className="topnav" aria-label="Main">
          <NavLink to="/ocean" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} title="The ocean">
            <Waves size={18} /> <span>Ocean</span>
          </NavLink>
          <NavLink
            to="/collection"
            className={() => `nav-btn ${loc.pathname === '/collection' && !loc.search.includes('memories') ? 'active' : ''}`}
            title="Our Little Collection ♡"
          >
            <BookHeart size={18} />
            <span>Our Little Collection ♡</span>
            {unreadIds.size > 0 && <i className="nav-badge" aria-label={`${unreadIds.size} unread`}>{unreadIds.size}</i>}
          </NavLink>
          <NavLink
            to="/collection?filter=memories"
            className={() => `nav-btn ${loc.pathname === '/collection' && loc.search.includes('memories') ? 'active' : ''}`}
            title="Our Memories"
          >
            <Moon size={18} /> <span>Our Memories</span>
          </NavLink>
          <button type="button" className="nav-btn" onClick={findRandom} title="Find me a little message ♡">
            <Sparkles size={18} /> <span>Find me a little message ♡</span>
          </button>
        </nav>

        <div className="topright">
          <button
            type="button"
            className="icon-btn"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Turn ocean sounds off' : 'Turn ocean sounds on'}
            title={soundOn ? 'Ocean sounds: on' : 'Ocean sounds: off'}
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button type="button" className="icon-btn" onClick={signOut} aria-label={`Sign out ${me.display_name}`} title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <button type="button" className="fab" onClick={() => openComposer()}>
        <Feather size={18} /> <span>Send a Letter ♡</span>
      </button>
    </>
  );
}
