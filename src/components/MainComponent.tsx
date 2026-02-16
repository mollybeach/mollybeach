// path: src/components/MainComponent.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Overview from './Overview';
import Experience from './Experience';
import Skills from './Skills';
import Projects from './Projects';
import Education from './Education';
import Certifications from './Certifications';
import Resume from './Resume';
import Awards from './Awards';

interface MainComponentProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const MainComponent: React.FC<MainComponentProps> = ({ setIsMobileMenuOpen }) => {
  return (
    <main className="flex-1 overflow-auto bg-white relative">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6 text-gray-700" />
      </button>

      {/* Main content with padding */}
      <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/portfolio" element={<Overview />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/education" element={<Education />} />
        <Route path="/certifications" element={<Certifications />} />
        <Route path="/awards" element={<Awards />} />
        <Route path="/resume" element={<Resume />} />
      </Routes>
      </div>
    </main>
  );
};

export default MainComponent;
