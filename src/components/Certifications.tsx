// path: src/components/Certifications.tsx
import CertBadge, { type BadgeKind } from './CertBadge';

interface Certification {
    title: string;
    issuer: string;
    issueDate: string;
    credentialId?: string;
    /** the drawn badge for it (CertBadge.tsx) */
    badge: BadgeKind;
  }

const certifications: Certification[] = [
  {
    title: "PrivacyOps Certification – Incident & Data Breach Management",
    issuer: "Securiti",
    issueDate: "Dec 2022",
    badge: "privacy-incident",
  },
  {
    title: "PrivacyOps Certification – Privacy Notice Creation & Management",
    issuer: "Securiti",
    issueDate: "Dec 2022",
    badge: "privacy-notice",
  },
  {
    title: "PrivacyOps Certification – Vendor Assessment Automation Badge",
    issuer: "Securiti",
    issueDate: "Dec 2022",
    badge: "privacy-vendor",
  },
  {
    title: "AWS Developer Associate 2021: Network Security",
    issuer: "Skillsoft",
    issueDate: "Oct 2022",
    credentialId: "61023160",
    badge: "aws-network",
  },
  {
    title: "AWS SysOps Associate 2021: Database & EBS Volume Management",
    issuer: "Skillsoft",
    issueDate: "Oct 2022",
    credentialId: "61025397",
    badge: "aws-database",
  },
  {
    title: "Blockchains & Ethereum: Mining & Smart Contracts in Ethereum",
    issuer: "Skillsoft",
    issueDate: "Oct 2022",
    credentialId: "61019693",
    badge: "eth-mining",
  },
  {
    title: "Ethereum Smart Contracts with Solidity: Functions in Solidity",
    issuer: "Skillsoft",
    issueDate: "Oct 2022",
    credentialId: "60928524",
    badge: "solidity-functions",
  },
  {
    title: "Smart Contracts & Hyperledger Fabric: Foundations of Hyperledger Fabric",
    issuer: "Skillsoft",
    issueDate: "Oct 2022",
    credentialId: "61021579",
    badge: "hyperledger",
  },
  {
    title: "Learn Solidity, Blockchain, and Smart Contracts",
    issuer: "freeCodeCamp",
    issueDate: "Feb 2020",
    badge: "blockchain",
  },
  {
    title: "Back End Development and APIs",
    issuer: "freeCodeCamp",
    issueDate: "Jan 2019",
    badge: "backend-api",
  },
  {
    title: "Feature Engineering",
    issuer: "Codecademy",
    issueDate: "Feb 2018",
    badge: "feature-engineering",
  },
  {
    title: "User Authentication & Authorization in Express",
    issuer: "CodeAcademy",
    issueDate: "Jan 2017",
    badge: "auth",
  },
  {
    title: "Machine Learning with Python",
    issuer: "freeCodeCamp",
    issueDate: "Jan 2016",
    badge: "machine-learning",
  },
  {
    title: "Nourish to Thrive",
    issuer: "Thrive Global",
    issueDate: "",
    badge: "nourish",
  },
  {
    title: "PrivacyOps Certification – Assessment Automation Badge",
    issuer: "Securiti",
    issueDate: "Dec 2022",
    badge: "privacy-assessment",
  },
  {
    title: "PrivacyOps Certification – Consent Lifecycle Management Badge",
    issuer: "Securiti",
    issueDate: "Dec 2022",
    badge: "privacy-consent",
  },
  {
    title: "Thriving Mind",
    issuer: "Thrive Global",
    issueDate: "",
    badge: "mind",
  },
  {
    title: "Thriving Together",
    issuer: "Thrive Global",
    issueDate: "",
    badge: "together",
  }
];  

export default function Certifications() {
  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold mb-8 text-center">Certifications</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {certifications.map((cert, index) => (
          <div key={index} className="bg-[#fffdf6] rounded-lg shadow-md border-2 border-[#c9a44c]/55 p-4 flex flex-col">
            <div className="mb-3">
              <CertBadge kind={cert.badge} issuer={cert.issuer} title={cert.title} />
            </div>
            <h3 className="font-semibold text-lg mb-2">{cert.title}</h3>
            <div className="text-gray-600">
              <p>{cert.issuer}</p>
              {cert.issueDate && <p>Issued {cert.issueDate}</p>}
              {cert.credentialId && (
                <p className="text-sm">Credential ID: {cert.credentialId}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}