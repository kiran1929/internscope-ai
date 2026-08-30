import React from 'react';
import { Compass, Github, Twitter, Linkedin, Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Product',
      links: [
        { label: 'AI Matching', href: '#features' },
        { label: 'Scrapers', href: '#features' },
        { label: 'Resume Analyzer', href: '#features' },
        { label: 'Pricing (Coming)', href: '#pricing' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Interview Guide', href: '#how-it-works' },
        { label: 'Tech Company List', href: '#companies' },
        { label: 'Syllabus Prep', href: '#features' },
        { label: 'Help Center', href: '#faq' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '#features' },
        { label: 'Careers', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Status Dashboard', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Settings', href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-zinc-950/80 border-t border-zinc-800/80 pt-16 pb-12 relative overflow-hidden backdrop-blur-xl">
      {/* Soft background ambient light */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="col-span-2 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white shadow-md shadow-primary/20">
                <Compass className="w-4.5 h-4.5" />
              </div>
              <span className="font-display font-extrabold text-lg tracking-tight text-white">
                InternScope<span className="text-primary">AI</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm leading-relaxed font-normal">
              The premium internship scouting and preparation platform for technology students and builders. Never miss another opening.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {[
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' },
                { icon: Github, href: '#', label: 'GitHub' },
              ].map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-850 transition-all"
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links Columns */}
          {footerLinks.map((column) => (
            <div key={column.title} className="space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {column.title}
              </h4>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-xs text-zinc-400 hover:text-primary transition-colors duration-200"
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
        <div className="border-t border-zinc-800/60 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            &copy; {currentYear} InternScope AI. All rights reserved. Made for ambitious student builders.
          </p>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
