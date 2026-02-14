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
  TrophyIcon
} from '@heroicons/react/24/outline';


interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const Sidebar: React.FC = () => {
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

  return (
    <div className="w-64 bg-white shadow-lg rounded-lg p-6 sticky top-6">
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
  );
};

export default Sidebar;
