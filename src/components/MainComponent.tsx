// path: src/components/MainComponent.tsx
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Overview from './Overview';
import Experience from './Experience';
import Skills from './Skills';
import Projects from './Projects';
import Education from './Education';
import Certifications from './Certifications';
import Resume from './Resume';
import Awards from './Awards';
import PalaisHome from '../palais/PalaisHome';
import { floralSrc, paletteOf, useFloral } from '../palais/florals';
import Admin from './Admin';

interface MainComponentProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const MainComponent: React.FC<MainComponentProps> = ({ setIsMobileMenuOpen }) => {
  // The home page is the Palais room, which fills the whole pane edge to edge,
  // so it is rendered outside the padded wrapper the other pages sit in.
  const isHome = useLocation().pathname === '/';
  // every other page is papered in whichever floral the Palais footer is
  // wearing, under a cream veil so the writing still reads (florals.ts)
  const floral = useFloral('footer');
  // the menu button is drawn in the stone of whichever floral the sidebar is
  // wearing, so it belongs to the drawer it opens
  const rim = paletteOf(useFloral('sidebar').now);

  return (
    <main className="flex-1 overflow-auto bg-white relative">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6 transition-colors duration-500" style={{ color: rim.jewel }} />
      </button>

      {isHome ? (
        <PalaisHome />
      ) : (
      /* Main content with padding */
      <div
        className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 min-h-full"
        style={{
          backgroundColor: '#fdf8ee',
          backgroundImage: `linear-gradient(rgba(253, 248, 238, 0.86), rgba(250, 243, 229, 0.9)), url("${floralSrc(floral.now)}")`,
          backgroundSize: 'auto, 460px auto',
          backgroundRepeat: 'repeat',
          backgroundAttachment: 'fixed, fixed',
        }}
      >
      <Routes>
        <Route path="/overview" element={<Overview />} />
        <Route path="/portfolio" element={<Overview />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/education" element={<Education />} />
        <Route path="/certifications" element={<Certifications />} />
        <Route path="/awards" element={<Awards />} />
        <Route path="/resume" element={<Resume />} />
        {/* Molly's own: the visitor book, behind the catalogue's sign-in */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
      </div>
      )}
    </main>
  );
};

export default MainComponent;
