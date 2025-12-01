// path: src/components/Resume.tsx
import React from 'react';
import { ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const Resume: React.FC = () => {
  const resumePath = `${process.env.PUBLIC_URL}/Beach_Molly_Resume.pdf`;

  return (
    <section className="max-w-5xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Resume</h2>
          <p className="text-gray-600 text-lg">Download or view my complete professional resume</p>
        </div>

        {/* Download Card */}
        <div className="bg-gradient-to-br from-[#D63384] to-[#B02968] rounded-xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-white">
              <DocumentTextIcon className="h-16 w-16" />
              <div>
                <h3 className="text-2xl font-bold mb-2">Molly Beach Resume</h3>
                <p className="text-white/90">Full-Stack Software Engineer</p>
              </div>
            </div>
            <a
              href={resumePath}
              download="Beach_Molly_Resume.pdf"
              className="flex items-center gap-2 bg-white text-[#D63384] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Download PDF
            </a>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
          </div>
          <div className="p-4">
            <div className="w-full" style={{ height: '800px' }}>
              <iframe
                src={resumePath}
                className="w-full h-full border-0 rounded-lg"
                title="Resume Preview"
              />
            </div>
          </div>
        </div>

        {/* Alternative Download Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600 mb-3">
            Can't view the PDF? 
          </p>
          <a
            href={resumePath}
            download="Beach_Molly_Resume.pdf"
            className="text-[#D63384] hover:text-[#B02968] font-medium underline"
          >
            Click here to download directly
          </a>
        </div>
      </div>
    </section>
  );
};

export default Resume;

