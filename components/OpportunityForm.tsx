'use client';

import React, { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, ArrowLeft, Loader2, Info, X } from 'lucide-react';
import Link from 'next/link';
import { opportunitySchema, OpportunityFormValues } from '@/lib/validation/opportunity';
import { OpportunityType, RemoteType } from '@/lib/generated/prisma/enums';
import { createOpportunityAction, updateOpportunityAction } from '@/app/actions/opportunities';

interface Company {
  id: string;
  name: string;
}

interface OpportunityFormProps {
  companies: Company[];
  initialData?: Partial<OpportunityFormValues> & { companyId?: string }; // For edit or duplicate mode
  opportunityId?: string; // Empty if creating
}

export const OpportunityForm: React.FC<OpportunityFormProps> = ({
  companies,
  initialData,
  opportunityId,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Parse default values
  const defaultValues = {
    title: initialData?.title || '',
    companyId: initialData?.companyId || '',
    description: initialData?.description || '',
    requirements: initialData?.requirements || '',
    location: initialData?.location || '',
    remoteType: (initialData?.remoteType as RemoteType) || RemoteType.ONSITE,
    type: (initialData?.type as OpportunityType) || OpportunityType.INTERNSHIP,
    salaryRange: initialData?.salaryRange || '',
    benefits: initialData?.benefits || '',
    applicationUrl: initialData?.applicationUrl || '',
    deadline: initialData?.deadline ? new Date(initialData.deadline) : null as Date | null,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    isArchived: initialData?.isArchived !== undefined ? initialData.isArchived : false,
    tags: initialData?.tags || [] as string[],
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(opportunitySchema),
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

  const onSubmit = (data: OpportunityFormValues) => {
    startTransition(async () => {
      let res;
      if (opportunityId) {
        res = await updateOpportunityAction(opportunityId, data);
      } else {
        res = await createOpportunityAction(data);
      }

      if (res.success) {
        toast.success(
          opportunityId
            ? 'Opportunity updated successfully'
            : 'Opportunity created successfully'
        );
        router.push('/admin/opportunities');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 select-none relative max-w-4xl">
      {/* Top Save Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <Link
          href="/admin/opportunities"
          className="flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to opportunities
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
          {opportunityId ? 'Save Changes' : 'Create Opportunity'}
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
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
              Opportunity Title *
            </label>
            <input
              type="text"
              id="title"
              {...register('title')}
              placeholder="e.g. Summer 2027 Software Engineering Intern"
              className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 transition-all"
            />
            {errors.title && (
              <span className="text-[10px] text-red-400 block mt-1">{errors.title.message}</span>
            )}
          </div>

          {/* Company Select */}
          <div className="space-y-1.5">
            <label htmlFor="companyId" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
              Tracked Company *
            </label>
            <select
              id="companyId"
              {...register('companyId')}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white outline-none focus:border-primary/60 transition-all cursor-pointer"
            >
              <option value="">Select a company...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.companyId && (
              <span className="text-[10px] text-red-400 block mt-1">{errors.companyId.message}</span>
            )}
          </div>

          {/* Description Editor Placeholder */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="description" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Opportunity Description
              </label>
              <span className="text-[9px] text-zinc-500 font-mono">(Supports Markdown text)</span>
            </div>
            
            {/* Rich text mock bar */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-850 border-b-0 rounded-t-lg text-text-muted text-[10px] select-none font-bold">
              <span className="cursor-not-allowed">Bold</span>
              <span className="text-zinc-800">|</span>
              <span className="cursor-not-allowed">Italic</span>
              <span className="text-zinc-800">|</span>
              <span className="cursor-not-allowed">Heading</span>
              <span className="text-zinc-800">|</span>
              <span className="cursor-not-allowed">List</span>
            </div>
            <textarea
              id="description"
              {...register('description')}
              rows={8}
              placeholder="Provide a detailed description of roles, team contexts, and engineering scopes..."
              className="w-full bg-zinc-950 border border-zinc-850 rounded-b-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 transition-all font-mono resize-y"
            />
            {errors.description && (
              <span className="text-[10px] text-red-400 block mt-1">{errors.description.message}</span>
            )}
          </div>

          {/* Requirements Details */}
          <div className="space-y-1.5">
            <label htmlFor="requirements" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
              Candidate Requirements
            </label>
            <textarea
              id="requirements"
              {...register('requirements')}
              rows={4}
              placeholder="e.g. Currently pursuing a BS in CS, proficiency in JavaScript/React, prior internship experience preferred..."
              className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 transition-all font-mono resize-y"
            />
          </div>
        </div>

        {/* Right Column (Metadata Parameters) */}
        <div className="space-y-5">
          {/* Filters Card */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">
              Parameters
            </h3>

            {/* Type */}
            <div className="space-y-1.5">
              <label htmlFor="type" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Opportunity Type *
              </label>
              <select
                id="type"
                {...register('type')}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white outline-none focus:border-primary/60 transition-all cursor-pointer"
              >
                {Object.values(OpportunityType).map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Remote */}
            <div className="space-y-1.5">
              <label htmlFor="remoteType" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Remote Status *
              </label>
              <select
                id="remoteType"
                {...register('remoteType')}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white outline-none focus:border-primary/60 transition-all cursor-pointer"
              >
                {Object.values(RemoteType).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label htmlFor="location" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Location *
              </label>
              <input
                type="text"
                id="location"
                {...register('location')}
                placeholder="e.g. San Francisco, CA"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 transition-all"
              />
              {errors.location && (
                <span className="text-[10px] text-red-400 block mt-1">{errors.location.message}</span>
              )}
            </div>

            {/* Application URL */}
            <div className="space-y-1.5">
              <label htmlFor="applicationUrl" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Application URL *
              </label>
              <input
                type="text"
                id="applicationUrl"
                {...register('applicationUrl')}
                placeholder="https://jobs.company.com/..."
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 transition-all"
              />
              {errors.applicationUrl && (
                <span className="text-[10px] text-red-400 block mt-1">{errors.applicationUrl.message}</span>
              )}
            </div>

            {/* Salary */}
            <div className="space-y-1.5">
              <label htmlFor="salaryRange" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Salary Range (Optional)
              </label>
              <input
                type="text"
                id="salaryRange"
                {...register('salaryRange')}
                placeholder="e.g. $45 - $60 / hour"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 transition-all"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <label htmlFor="deadline" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Application Deadline
              </label>
              <input
                type="date"
                id="deadline"
                onChange={(e) => {
                  setValue('deadline', e.target.value ? new Date(e.target.value) : null, { shouldDirty: true });
                }}
                defaultValue={defaultValues.deadline ? new Date(defaultValues.deadline).toISOString().substring(0, 10) : ''}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white outline-none focus:border-primary/60 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Tags & Status Card */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">
              Tags & Publication
            </h3>

            {/* Tags Input */}
            <div className="space-y-1.5">
              <label htmlFor="tagInput" className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Tags (Press Enter or Comma)
              </label>
              <input
                type="text"
                id="tagInput"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="e.g. React, C++, Python"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 transition-all"
              />

              {/* Badges list */}
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

            {/* Published State toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-900 bg-zinc-950/40">
              <div>
                <p className="text-xs font-semibold text-white">Publish Status</p>
                <p className="text-[9px] text-text-muted mt-0.5">Toggle live candidate visibility.</p>
              </div>
              <input
                type="checkbox"
                {...register('isActive')}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
