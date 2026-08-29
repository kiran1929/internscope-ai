'use client';

import React, { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, ArrowLeft, Loader2, Info, X } from 'lucide-react';
import Link from 'next/link';
import { companySchema, CompanyFormValues } from '@/lib/validation/company';
import { createCompanyAction, updateCompanyAction } from '@/app/actions/companies';

interface CompanyFormProps {
  initialData?: Partial<CompanyFormValues>; // For edit or duplicate mode
  companyId?: string; // Empty if creating
}

export const CompanyForm: React.FC<CompanyFormProps> = ({
  initialData,
  companyId,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Parse default values
  const defaultValues = {
    name: initialData?.name || '',
    logoUrl: initialData?.logoUrl || '',
    websiteUrl: initialData?.websiteUrl || '',
    careerPageUrl: initialData?.careerPageUrl || '',
    industry: initialData?.industry || '',
    description: initialData?.description || '',
    country: initialData?.country || '',
    state: initialData?.state || '',
    city: initialData?.city || '',
    companySize: initialData?.companySize || '1-10',
    foundedYear: initialData?.foundedYear !== undefined && initialData?.foundedYear !== null ? initialData.foundedYear : ('' as unknown as number),
    linkedinUrl: initialData?.linkedinUrl || '',
    twitterUrl: initialData?.twitterUrl || '',
    githubUrl: initialData?.githubUrl || '',
    isVerified: initialData?.isVerified !== undefined ? initialData.isVerified : false,
    hiringStatus: initialData?.hiringStatus || 'HIRING',
    tags: initialData?.tags || [] as string[],
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues,
  });

  const selectedTags = watch('tags') || [];
  const [tagInput, setTagInput] = React.useState('');

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome/Firefox
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle adding a tag
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleaned = tagInput.trim().replace(/,/g, '');
      if (cleaned && !selectedTags.includes(cleaned)) {
        setValue('tags', [...selectedTags, cleaned], { shouldDirty: true });
        setTagInput('');
      }
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      'tags',
      selectedTags.filter((t) => t !== tagToRemove),
      { shouldDirty: true }
    );
  };

  const onSubmit = (data: CompanyFormValues) => {
    startTransition(async () => {
      let res;
      if (companyId) {
        res = await updateCompanyAction(companyId, data);
      } else {
        res = await createCompanyAction(data);
      }

      if (res.success) {
        toast.success(
          companyId
            ? 'Company updated successfully'
            : 'Company created successfully'
        );
        router.push('/admin/companies');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative max-w-4xl text-white">
      {/* Top Save Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <Link
          href="/admin/companies"
          className="flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to companies
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {companyId ? 'Save Changes' : 'Create Company'}
        </button>
      </div>

      {isDirty && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg border border-amber-500/10 bg-amber-500/5 text-amber-400 text-xs">
          <Info className="w-4 h-4 shrink-0" />
          <span>You have unsaved changes. Make sure to click save before exiting this page.</span>
        </div>
      )}

      {/* Main Grid Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (Main Specs) */}
        <div className="md:col-span-2 space-y-5 bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
          {/* Company Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
              Company Name *
            </label>
            <input
              type="text"
              id="name"
              {...register('name')}
              placeholder="e.g. Stripe, Inc."
              className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 transition-all"
            />
            {errors.name && (
              <span className="text-[10px] text-red-400 block mt-1">{errors.name.message}</span>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
              Company Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={6}
              placeholder="Provide a detailed description of the company's background, vision, and core products..."
              className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 transition-all font-sans resize-y"
            />
          </div>

          {/* Headquarters Grid */}
          <div className="border-t border-zinc-900 pt-4 mt-2">
            <h3 className="text-[10px] uppercase font-bold text-white tracking-wider mb-3">Headquarters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* City */}
              <div className="space-y-1.5">
                <label htmlFor="city" className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  {...register('city')}
                  placeholder="e.g. San Francisco"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white outline-none focus:border-primary/60 transition-all"
                />
              </div>

              {/* State */}
              <div className="space-y-1.5">
                <label htmlFor="state" className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
                  State / Region
                </label>
                <input
                  type="text"
                  id="state"
                  {...register('state')}
                  placeholder="e.g. CA"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white outline-none focus:border-primary/60 transition-all"
                />
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <label htmlFor="country" className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  {...register('country')}
                  placeholder="e.g. United States"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white outline-none focus:border-primary/60 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Links Configuration */}
          <div className="border-t border-zinc-900 pt-4 mt-2 space-y-4">
            <h3 className="text-[10px] uppercase font-bold text-white tracking-wider">Online Presence</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Website URL */}
              <div className="space-y-1.5">
                <label htmlFor="websiteUrl" className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
                  Website URL
                </label>
                <input
                  type="text"
                  id="websiteUrl"
                  {...register('websiteUrl')}
                  placeholder="https://company.com"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white outline-none focus:border-primary/60 transition-all"
                />
                {errors.websiteUrl && (
                  <span className="text-[9px] text-red-400 block mt-1">{errors.websiteUrl.message}</span>
                )}
              </div>

              {/* Career Page URL */}
              <div className="space-y-1.5">
                <label htmlFor="careerPageUrl" className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
                  Career Page URL
                </label>
                <input
                  type="text"
                  id="careerPageUrl"
                  {...register('careerPageUrl')}
                  placeholder="https://company.com/careers"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white outline-none focus:border-primary/60 transition-all"
                />
                {errors.careerPageUrl && (
                  <span className="text-[9px] text-red-400 block mt-1">{errors.careerPageUrl.message}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* LinkedIn */}
              <div className="space-y-1.5">
                <label htmlFor="linkedinUrl" className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
                  LinkedIn URL
                </label>
                <input
                  type="text"
                  id="linkedinUrl"
                  {...register('linkedinUrl')}
                  placeholder="https://linkedin.com/company/..."
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white outline-none focus:border-primary/60 transition-all"
                />
                {errors.linkedinUrl && (
                  <span className="text-[9px] text-red-400 block mt-1">{errors.linkedinUrl.message}</span>
                )}
              </div>

              {/* Twitter */}
              <div className="space-y-1.5">
                <label htmlFor="twitterUrl" className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
                  Twitter/X URL
                </label>
                <input
                  type="text"
                  id="twitterUrl"
                  {...register('twitterUrl')}
                  placeholder="https://x.com/..."
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white outline-none focus:border-primary/60 transition-all"
                />
                {errors.twitterUrl && (
                  <span className="text-[9px] text-red-400 block mt-1">{errors.twitterUrl.message}</span>
                )}
              </div>

              {/* GitHub */}
              <div className="space-y-1.5">
                <label htmlFor="githubUrl" className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
                  GitHub URL
                </label>
                <input
                  type="text"
                  id="githubUrl"
                  {...register('githubUrl')}
                  placeholder="https://github.com/..."
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white outline-none focus:border-primary/60 transition-all"
                />
                {errors.githubUrl && (
                  <span className="text-[9px] text-red-400 block mt-1">{errors.githubUrl.message}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Metadata Parameters) */}
        <div className="space-y-5">
          {/* Attributes Card */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">
              Corporate Specs
            </h3>

            {/* Logo URL */}
            <div className="space-y-1.5">
              <label htmlFor="logoUrl" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Logo Image URL
              </label>
              <input
                type="text"
                id="logoUrl"
                {...register('logoUrl')}
                placeholder="https://logo.clearbit.com/..."
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 transition-all"
              />
              {errors.logoUrl && (
                <span className="text-[10px] text-red-400 block mt-1">{errors.logoUrl.message}</span>
              )}
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <label htmlFor="industry" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Industry
              </label>
              <input
                type="text"
                id="industry"
                {...register('industry')}
                placeholder="e.g. Fintech, Cloud"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 transition-all"
              />
            </div>

            {/* Company Size */}
            <div className="space-y-1.5">
              <label htmlFor="companySize" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Company Size
              </label>
              <select
                id="companySize"
                {...register('companySize')}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white outline-none focus:border-primary/60 transition-all cursor-pointer"
              >
                <option value="1-10">1 - 10 employees</option>
                <option value="11-50">11 - 50 employees</option>
                <option value="51-200">51 - 200 employees</option>
                <option value="201-500">201 - 500 employees</option>
                <option value="501-1000">501 - 1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>

            {/* Founded Year */}
            <div className="space-y-1.5">
              <label htmlFor="foundedYear" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Founded Year
              </label>
              <input
                type="number"
                id="foundedYear"
                {...register('foundedYear')}
                placeholder="e.g. 2011"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 transition-all"
              />
              {errors.foundedYear && (
                <span className="text-[10px] text-red-400 block mt-1">{errors.foundedYear.message}</span>
              )}
            </div>
          </div>

          {/* Publication and verification panel */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">
              Status & Validation
            </h3>

            {/* Hiring Status */}
            <div className="space-y-1.5">
              <label htmlFor="hiringStatus" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Hiring Status
              </label>
              <select
                id="hiringStatus"
                {...register('hiringStatus')}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white outline-none focus:border-primary/60 transition-all cursor-pointer"
              >
                <option value="HIRING">Active hiring</option>
                <option value="FREEZE">Hiring freeze</option>
                <option value="NOT_HIRING">Closed / No active roles</option>
              </select>
            </div>

            {/* Verified toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-900 bg-zinc-950/40">
              <div>
                <p className="text-xs font-semibold text-white font-sans">Verified Profile</p>
                <p className="text-[9px] text-text-muted mt-0.5">Toggle verification status badges.</p>
              </div>
              <input
                type="checkbox"
                {...register('isVerified')}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-900">
              <label htmlFor="tagInput" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Tags (Press Enter or Comma)
              </label>
              <input
                type="text"
                id="tagInput"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="e.g. YCombinator, RemoteFirst"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 transition-all"
              />

              {/* Tags list */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-[10px] text-zinc-300 font-semibold"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-text-muted hover:text-white"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
