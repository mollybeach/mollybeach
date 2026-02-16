// path: src/components/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  BriefcaseIcon,
  WrenchIcon,
  FolderIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  TrophyIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';


interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const navItems: NavItem[] = [
    { name: 'Overview', path: '/', icon: HomeIcon },
    { name: 'Projects', path: '/projects', icon: FolderIcon },
    { name: 'Experience', path: '/experience', icon: BriefcaseIcon },
    { name: 'Education', path: '/education', icon: AcademicCapIcon },
    { name: 'Skills', path: '/skills', icon: WrenchIcon },
    { name: 'Awards', path: '/awards', icon: TrophyIcon },
    { name: 'Certifications', path: '/certifications', icon: AcademicCapIcon },
    { name: 'Resume', path: '/resume', icon: DocumentTextIcon },
  ];

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
      
      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 lg:top-6 left-0 h-screen lg:h-auto
        w-64 bg-white shadow-lg rounded-lg p-6 z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto
      `}>
      {/* Close button for mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(false)}
        className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Close menu"
      >
        <XMarkIcon className="h-6 w-6 text-gray-600" />
      </button>

      {/* Profile Section */}
      <div className="text-center mb-8">
        <img
          src={`${process.env.PUBLIC_URL}/avi_square.png`}
          alt="Molly Beach"
          className="w-32 h-32 rounded-full mx-auto mb-4 border-2 border-gray-200 shadow-lg object-cover"
        />
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

      {/* Navigation Links */}
      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-[#D63384] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              }`
            }
          >
            {/*} <item.icon className="h-5 w-5" />*/}
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
    </>
  );
};

export default Sidebar;
