import React from 'react';
import { Compass, Github, Twitter, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Product',
      links: [
        { label: 'AI Matching', href: '#features' },
        { label: 'Scrapers', href: '#features' },
        { label: 'Resume Analyzer', href: '#features' },
        { label: 'Pricing (Coming)', href: '#' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Interview Guide', href: '#' },
        { label: 'Tech Company List', href: '#companies' },
        { label: 'Syllabus Prep', href: '#' },
        { label: 'Help Center', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Status Dashboard', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Cookie Settings', href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-[#09090B] border-t border-zinc-800/80 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-white">
                <Compass className="w-4.5 h-4.5" />
              </div>
              <span className="font-display font-bold text-base tracking-tight text-white">
                InternScope<span className="text-primary">AI</span>
              </span>
            </div>
            <p className="text-sm text-text-muted max-w-sm">
              The premium internship scouting and preparation platform for technology students and builders. Never miss another opening.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="text-text-muted hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="text-text-muted hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="text-text-muted hover:text-white transition-colors" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          {footerLinks.map((column) => (
            <div key={column.title} className="space-y-3">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                {column.title}
              </h4>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-text-muted hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            &copy; {currentYear} InternScope AI. All rights reserved. Made for ambitious student builders.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-text-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
