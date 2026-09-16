// path: src/components/Education.tsx
import React, { useState } from 'react';
import { GardenHeading, PageTitle, shelfAt } from './garden';

const Education: React.FC = () => {
  const [expandedSchools, setExpandedSchools] = useState<{[key: string]: boolean}>({});

  const toggleCoursework = (schoolName: string) => {
    setExpandedSchools(prev => ({
      ...prev,
      [schoolName]: !prev[schoolName]
    }));
  };

  const education = [
    {
      school: "BRAINSTATION",
      logo: `${process.env.PUBLIC_URL}/images/brainstationicon.png`,
      degree: "WEB DEVELOPMENT DIPLOMA",
      date: "JAN 2020 - APR 2020",
      location: "ONTARIO, CA",
      details: [
        "React, Javascript, SCSS, HTML5, SQL, Front End Responsive Design",
        "Worked with PMs, UX designers, Data Science, Digital Marketing Team on Projects"
      ]
    },
    {
      school: "UNIVERSITY OF WASHINGTON",
      logo: `${process.env.PUBLIC_URL}/images/uwcrestsquare.png`,
      degree: "BACHELORS OF SCIENCE",
      date: "SEP 2014 - AUG 2017",
      location: "SEATTLE, WA",
      details: [
        "Molecular Cellular Developmental Biology (MCDB)",
        "Computer Science Software Engineering Minor (CSSE)"
      ],
      coursework: [
        "CSS 142 & 143: Computer Programming I & II (Java)",
        "CSS 340: Applied Algorithmics",
        "CSS 342: Advanced Data Structures, Algorithms, and Discrete Mathematics I",
        "CSS 360: Software Engineering"
      ]
    }
  ];
  return (
    <section className="space-y-6">
      <PageTitle>Education</PageTitle>
      {education.map((edu, index) => (
        <article
          key={index}
          className="gilt-card bg-[#fffdf6] rounded-2xl p-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <img src={edu.logo} alt={`${edu.school} logo`} className="w-16 h-16 object-contain rounded-lg" />
            <div className="min-w-0 flex-1">
              <GardenHeading shelf={shelfAt(index)} as="h3" note={`${edu.degree} · ${edu.date} • ${edu.location}`}>
                <span className="font-bold">{edu.school}</span>
              </GardenHeading>
            </div>
          </div>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            {edu.details.map((detail, idx) => (
              <li key={idx}>{detail}</li>
            ))}
          </ul>
          {edu.coursework && (
            <div className="mt-4">
              <button
                onClick={() => toggleCoursework(edu.school)}
                className="flex items-center gap-2 font-semibold text-gray-800 hover:text-[#D63384] transition-colors"
              >
                <svg
                  className={`w-4 h-4 transform transition-transform ${
                    expandedSchools[edu.school] ? 'rotate-90' : ''
                  }`}
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"
                  />
                </svg>
                Relevant Coursework
              </button>
              {expandedSchools[edu.school] && (
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-2">
                  {edu.coursework.map((course, idx) => (
                    <li key={idx} className="animate-fadeIn">
                      {course}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </article>
      ))}
    </section>
  );
};

export default Education;
