'use client';

import React, { useState, useEffect } from 'react';
import { Compass, Menu, X, ArrowRight } from 'lucide-react';

interface HeaderProps {
  onViewDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onViewDemo }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Companies', href: '#companies' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'glass-navbar py-3 shadow-lg shadow-black/20'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">
              InternScope<span className="text-primary font-black">AI</span>
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-text-muted hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onViewDemo}
              className="px-4 py-2 text-sm font-medium text-white hover:text-primary transition-colors duration-200"
            >
              View Demo
            </button>
            <button
              onClick={onViewDemo}
              className="relative group overflow-hidden px-4 py-2 rounded-lg bg-primary hover:bg-blue-700 text-sm font-semibold text-white transition-all duration-200 flex items-center gap-1.5 shadow-md shadow-primary/20 hover:shadow-primary/35"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[60px] z-40 bg-background/95 backdrop-blur-md border-t border-zinc-800 animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="px-4 py-6 space-y-4 flex flex-col h-full">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-text-muted hover:text-white py-2 border-b border-zinc-800/40 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 space-y-3">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onViewDemo();
                }}
                className="w-full py-3 rounded-lg border border-zinc-850 hover:bg-zinc-800 text-base font-medium text-white transition-colors"
              >
                View Demo
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onViewDemo();
                }}
                className="w-full py-3 rounded-lg bg-primary hover:bg-blue-700 text-base font-semibold text-white transition-colors flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
export default Header;
