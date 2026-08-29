import React from 'react';
import { CompanyRepository } from '@/lib/repositories/company';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Compass,
  ExternalLink,
  MapPin,
  Building,
  CheckCircle,
  Briefcase,
  Linkedin,
  Twitter,
  Github,
  Clock,
  Tag
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompanyDetailPage(props: PageProps) {
  const { id } = await props.params;

  // 1. Fetch company with relations
  const company = await CompanyRepository.findById(id);

  if (!company) {
    notFound();
  }

  const parts = [company.city, company.state, company.country].filter(Boolean);
  const locationText = parts.join(', ') || 'N/A';

  return (
    <div className="space-y-6 animate-fade-in text-white max-w-5xl">
      {/* Top Navigation & Edit Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <Link
          href="/admin/companies"
          className="flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to companies
        </Link>
        <Link
          href={`/admin/companies/${company.id}/edit`}
          className="btn-primary flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shrink-0"
        >
          <Edit className="w-4 h-4" /> Edit Company Specs
        </Link>
      </div>

      {/* Main Title Banner Card */}
      <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              className="w-12 h-12 rounded-lg border border-zinc-800 bg-white object-contain p-0.5 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-zinc-850 border border-zinc-800 flex items-center justify-center text-sm text-zinc-400 font-bold uppercase shrink-0">
              {company.name.charAt(0)}
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight">
                {company.name}
              </h2>
              {company.isVerified && (
                <CheckCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/10 shrink-0" />
              )}
            </div>
            <p className="text-xs text-primary font-medium flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> {company.industry || 'No Industry Specified'}
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 shrink-0">
          {company.isArchived ? (
            <span className="px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Archived
            </span>
          ) : company.hiringStatus === 'HIRING' ? (
            <span className="px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-bold text-primary uppercase tracking-wider">
              Hiring
            </span>
          ) : company.hiringStatus === 'FREEZE' ? (
            <span className="px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              Hiring Freeze
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Closed
            </span>
          )}
        </div>
      </div>

      {/* Grid Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: About & Opportunities */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">
              About the Company
            </h3>
            <div className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap font-sans">
              {company.description || 'No description has been populated for this corporate profile.'}
            </div>
          </div>

          {/* Related Opportunities */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-primary" /> Active Opportunities ({company._count.opportunities})
              </h3>
              <span className="text-[10px] text-text-muted font-mono">(Latest first)</span>
            </div>

            <div className="space-y-3">
              {company.opportunities.length > 0 ? (
                company.opportunities.map((opp) => {
                  const isExpired = opp.deadline && new Date(opp.deadline) < new Date();
                  return (
                    <div
                      key={opp.id}
                      className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-900 hover:border-zinc-850 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 space-y-1">
                        <Link
                          href={`/admin/opportunities/${opp.id}`}
                          className="text-xs font-semibold text-zinc-200 hover:text-primary transition-colors block truncate"
                        >
                          {opp.title}
                        </Link>
                        <div className="flex items-center gap-3 text-[10px] text-text-muted">
                          <span className="uppercase">{opp.type.replace('_', ' ')}</span>
                          <span className="text-zinc-800">•</span>
                          <span>{opp.location} ({opp.remoteType})</span>
                        </div>
                      </div>
                      
                      {/* Job Status badge & link */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded-full border border-red-500/10 bg-red-500/5 text-[9px] font-semibold text-red-400">
                            Expired
                          </span>
                        ) : !opp.isActive ? (
                          <span className="px-2 py-0.5 rounded-full border border-amber-500/10 bg-amber-500/5 text-[9px] font-semibold text-amber-400">
                            Draft
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-[9px] font-semibold text-primary">
                            Published
                          </span>
                        )}
                        <Link
                          href={`/admin/opportunities/${opp.id}`}
                          className="p-1 rounded hover:bg-zinc-900 text-text-muted hover:text-white transition-all"
                          title="Quick View"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-text-muted">
                  <Briefcase className="w-8 h-8 text-zinc-700 mb-2" />
                  <p className="font-semibold text-white">No opportunities indexed</p>
                  <p className="text-[10px] mt-0.5">Add job opportunities bound to this company profile.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Specifications & Timestamps */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">
              Specifications
            </h3>

            <div className="space-y-4 text-xs">
              {/* HQ */}
              <div className="flex items-start justify-between py-1.5 border-b border-zinc-900">
                <span className="text-text-muted flex items-center gap-1.5 shrink-0">
                  <MapPin className="w-3.5 h-3.5" /> HQ
                </span>
                <span className="text-white font-semibold text-right max-w-[150px]">{locationText}</span>
              </div>

              {/* Size */}
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                <span className="text-text-muted">Size</span>
                <span className="text-white font-semibold">{company.companySize || 'N/A'}</span>
              </div>

              {/* Founded */}
              {company.foundedYear && (
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                  <span className="text-text-muted">Founded</span>
                  <span className="text-white font-semibold">{company.foundedYear}</span>
                </div>
              )}

              {/* Created */}
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                <span className="text-text-muted flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Created
                </span>
                <span className="text-zinc-400 font-mono">{new Date(company.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Updated */}
              <div className="flex items-center justify-between py-1.5">
                <span className="text-text-muted">Updated</span>
                <span className="text-zinc-400 font-mono">{new Date(company.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* URL Redirections */}
            <div className="space-y-2 pt-2">
              {company.websiteUrl && (
                <a
                  href={company.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold"
                >
                  <Compass className="w-3.5 h-3.5" /> Visit Website
                </a>
              )}
              {company.careerPageUrl && (
                <a
                  href={company.careerPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-200 hover:text-white transition-all flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Visit Career Page
                </a>
              )}
            </div>
          </div>

          {/* Socials Card */}
          {(company.linkedinUrl || company.twitterUrl || company.githubUrl) && (
            <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">
                Social Networks
              </h3>
              
              <div className="flex items-center gap-4 justify-around py-1">
                {company.linkedinUrl && (
                  <a
                    href={company.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded bg-zinc-950 border border-zinc-850 hover:border-zinc-800 hover:text-primary transition-all"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {company.twitterUrl && (
                  <a
                    href={company.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded bg-zinc-950 border border-zinc-850 hover:border-zinc-800 hover:text-sky-400 transition-all"
                    title="Twitter/X"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {company.githubUrl && (
                  <a
                    href={company.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded bg-zinc-950 border border-zinc-850 hover:border-zinc-800 hover:text-white transition-all"
                    title="GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {company.tags.length > 0 && (
            <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-1.5 text-white">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <h4 className="text-[10px] uppercase font-bold tracking-wider">Company Tags</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {company.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-[10px] text-zinc-300 font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
