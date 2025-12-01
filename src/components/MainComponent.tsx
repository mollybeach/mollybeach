// path: src/components/MainComponent.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Overview from './Overview';
import Experience from './Experience';
import Skills from './Skills';
import Projects from './Projects';
import Education from './Education';
import Certifications from './Certifications';
import Resume from './Resume';
const MainComponent: React.FC = () => {
  return (
    <main className="flex-1 overflow-auto p-8 bg-white">
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/portfolio" element={<Overview />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/education" element={<Education />} />
        <Route path="/certifications" element={<Certifications />} />
        <Route path="/resume" element={<Resume />} />
      </Routes>
    </main>
  );
};

export default MainComponent;
