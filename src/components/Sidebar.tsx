// path: src/components/Sidebar.tsx
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserCircleIcon,
  BriefcaseIcon,
  WrenchScrewdriverIcon,
  FolderIcon,
  AcademicCapIcon,
  CheckBadgeIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  TrophyIcon,
  XMarkIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';


interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  /** match the path exactly, so Home is not also highlighted on every other page */
  end?: boolean;
}

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const navItems: NavItem[] = [
    { name: 'Home', path: '/', icon: HomeIcon, end: true },
    { name: 'Overview', path: '/overview', icon: UserCircleIcon },
    { name: 'Projects', path: '/projects', icon: FolderIcon },
    { name: 'Experience', path: '/experience', icon: BriefcaseIcon },
    { name: 'Education', path: '/education', icon: AcademicCapIcon },
    { name: 'Skills', path: '/skills', icon: WrenchScrewdriverIcon },
    { name: 'Awards', path: '/awards', icon: TrophyIcon },
    { name: 'Certifications', path: '/certifications', icon: CheckBadgeIcon },
    { name: 'Resume', path: '/resume', icon: DocumentTextIcon },
  ];

  /* On a wide screen the sidebar folds down to the avatar and a column of
     icons. It opens by itself on the home page, the Palais terrace, and folds
     itself away on every other page and in every other room on the map; the
     arrow at its foot opens or folds it by hand. (On a phone it's a drawer,
     and always shown in full.) */
  const { pathname } = useLocation();
  const [room, setRoom] = useState(() => window.location.hash.replace('#', ''));
  useEffect(() => {
    const fromHash = () => setRoom(window.location.hash.replace('#', ''));
    const fromMap = (e: Event) => setRoom(String((e as CustomEvent).detail ?? ''));
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('palais:place', fromMap);
    return () => {
      window.removeEventListener('hashchange', fromHash);
      window.removeEventListener('palais:place', fromMap);
    };
  }, []);
  const atHome = pathname === '/' && (room === '' || room === 'palace');
  const [collapsed, setCollapsed] = useState(!atHome);
  useEffect(() => {
    setCollapsed(!atHome);
  }, [atHome, pathname]);
  // only the wide-screen layout folds
  const folded = (full: string, small: string) => `${full} ${collapsed ? small : ''}`;

  const handleNavClick = () => {
    // Close mobile menu when a nav item is clicked
    if (window.innerWidth < 1024) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar, papered in the same teal lily pattern as the Palais footer */}
      <div
        style={{
          backgroundColor: '#69b3b5',
          backgroundImage: `url("${process.env.PUBLIC_URL}/images/sidebar-floral.webp")`,
          backgroundSize: '320px auto',
          backgroundRepeat: 'repeat',
        }}
        className={`
        fixed lg:sticky top-0 lg:top-6 left-0 h-screen lg:h-auto
        w-64 ${collapsed ? 'lg:w-[5.5rem] lg:p-2.5' : ''} shadow-lg rounded-lg p-4 z-50 space-y-4 shrink-0
        transform transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto
      `}>
      {/* Close button for mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(false)}
        className="lg:hidden absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 shadow hover:bg-white transition-colors"
        aria-label="Close menu"
      >
        <XMarkIcon className="h-6 w-6 text-gray-600" />
      </button>

      {/* Profile Section: on a card so it reads over the flowers */}
      <div className={folded('text-center rounded-2xl bg-white/90 backdrop-blur-sm px-4 pt-5 pb-1 shadow-md ring-1 ring-[#c9a44c]/60', 'lg:px-1.5 lg:pt-1.5 lg:pb-1.5')}>
        <img
          src={`${process.env.PUBLIC_URL}/avi_square.png`}
          alt="Molly Beach"
          title={collapsed ? 'Molly Beach' : undefined}
          className={folded('w-32 h-32 rounded-full mx-auto mb-4 border-2 border-gray-200 shadow-lg object-cover transition-all duration-300', 'lg:w-14 lg:h-14 lg:mb-0')}
        />
        <div className={collapsed ? 'lg:hidden' : ''}>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Molly Beach</h2>
        <p className="text-gray-600 mb-4">Software Engineer</p>
        
        {/* Social Links */}
        <div className="flex justify-center gap-3 mb-6">
          <a 
            href="https://github.com/mollybeach" 
            target="_blank" 
            rel="noopener noreferrer"
            className="transition-transform hover:scale-110"
          >
            <img 
              src={`${process.env.PUBLIC_URL}/images/github-mark.png`}
              alt="GitHub"
              className="w-8 h-8 rounded shadow-sm hover:shadow-md"
            />
          </a>
          <a 
            href="https://www.linkedin.com/in/mollybeach" 
            target="_blank" 
            rel="noopener noreferrer"
            className="transition-transform hover:scale-110"
          >
            <img 
              src={`${process.env.PUBLIC_URL}/images/linkedin-icon.png`}
              alt="LinkedIn"
              className="w-8 h-8 rounded shadow-sm hover:shadow-md"
            />
          </a>
        </div>

        {/* Contact Info */}
        <div className="text-sm text-gray-600 mb-6">
          <p className="mb-1">
            <PhoneIcon className="h-5 w-5 inline mr-2" />
            206.947.6991
          </p>
          <p>
            <EnvelopeIcon className="h-5 w-5 inline mr-2" />
            mollyjbeach@gmail.com
          </p>
        </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className={folded('space-y-1 rounded-2xl bg-white/90 backdrop-blur-sm p-2 shadow-md ring-1 ring-[#c9a44c]/60', 'lg:p-1.5')}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.end}
            onClick={handleNavClick}
            title={collapsed ? item.name : undefined}
            aria-label={item.name}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                collapsed ? 'lg:justify-center lg:px-0 lg:py-2.5' : ''
              } ${
                isActive
                  ? 'bg-[#D63384] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              }`
            }
          >
            <item.icon className={`h-5 w-5 shrink-0 hidden ${collapsed ? 'lg:block' : ''}`} aria-hidden />
            <span className={collapsed ? 'lg:hidden' : ''}>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* fold or open the sidebar (wide screens) */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="hidden lg:flex w-full items-center justify-center gap-2 rounded-2xl bg-white/90 backdrop-blur-sm py-2 text-sm font-medium text-gray-600 shadow-md ring-1 ring-[#c9a44c]/60 hover:text-[#D63384] transition-colors"
        aria-label={collapsed ? 'Open the sidebar' : 'Fold the sidebar away'}
        title={collapsed ? 'Open the sidebar' : 'Fold the sidebar away'}
      >
        {collapsed ? <ChevronDoubleRightIcon className="h-5 w-5" /> : <ChevronDoubleLeftIcon className="h-5 w-5" />}
      </button>
    </div>
    </>
  );
};

export default Sidebar;
