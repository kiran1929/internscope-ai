'use client';

import React, { useState, useTransition } from 'react';
import {
  User,
  Shield,
  Key,
  Trash2,
  Check,
  Mail,
  Chrome,
  Github,
  Linkedin,
  Globe,
  AlertTriangle,
  Lock,
  Loader2,
  Briefcase,
  FileText,
  UploadCloud,
  Plus,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateProfilePageAction } from '@/app/actions/candidate';

interface UserProfileFormClientProps {
  user: {
    id: string;
    email: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      skills: string[];
      preferredLocations: string[];
      preferredTechnologies: string[];
      salaryExpectations: string | null;
      experienceLevel: string | null;
      headline: string | null;
      bio: string | null;
      githubUrl: string | null;
      linkedinUrl: string | null;
      portfolioUrl: string | null;
      employmentPreferences?: string[];
      remotePreferences?: string[];
      university?: string | null;
      degree?: string | null;
      branch?: string | null;
      cgpa?: number | null;
    } | null;
  };
}

export default function UserProfileFormClient({ user }: UserProfileFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local state for tags/lists inputs
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(user.profile?.skills || []);

  const [techInput, setTechInput] = useState('');
  const [preferredTechnologies, setPreferredTechnologies] = useState<string[]>(
    user.profile?.preferredTechnologies || []
  );

  const [locInput, setLocInput] = useState('');
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    user.profile?.preferredLocations || []
  );

  const [employmentPrefs, setEmploymentPrefs] = useState<string[]>(
    user.profile?.employmentPreferences || ['Internship']
  );
  const [remotePrefs, setRemotePrefs] = useState<string[]>(
    user.profile?.remotePreferences || ['Remote']
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Helper arrays
  const experienceOptions = ['Intern', 'Entry Level', 'Junior', 'Mid Level', 'Senior', 'Lead', 'Manager'];
  const employmentOptions = ['Internship', 'Full-Time', 'Part-Time', 'Contract', 'Freelance'];
  const remoteOptions = ['Remote', 'Hybrid', 'Onsite'];

  // Handlers for lists
  const addSkill = () => {
    const val = skillInput.trim();
    if (val && !skills.includes(val)) {
      setSkills([...skills, val]);
      setSkillInput('');
    }
  };

  const addTech = () => {
    const val = techInput.trim();
    if (val && !preferredTechnologies.includes(val)) {
      setPreferredTechnologies([...preferredTechnologies, val]);
      setTechInput('');
    }
  };

  const addLocation = () => {
    const val = locInput.trim();
    if (val && !preferredLocations.includes(val)) {
      setPreferredLocations([...preferredLocations, val]);
      setLocInput('');
    }
  };

  const toggleEmployment = (opt: string) => {
    setEmploymentPrefs((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
    );
  };

  const toggleRemote = (opt: string) => {
    setRemotePrefs((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
    );
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateProfilePageAction({
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        headline: formData.get('headline') as string,
        bio: formData.get('bio') as string,
        githubUrl: formData.get('githubUrl') as string,
        linkedinUrl: formData.get('linkedinUrl') as string,
        portfolioUrl: formData.get('portfolioUrl') as string,
        skills,
        preferredTechnologies,
        preferredLocations,
        employmentPreferences: employmentPrefs,
        remotePreferences: remotePrefs,
        salaryExpectations: formData.get('salaryExpectations') as string,
        experienceLevel: formData.get('experienceLevel') as string,
        university: formData.get('university') as string,
        degree: formData.get('degree') as string,
        branch: formData.get('branch') as string,
        cgpa: formData.get('cgpa') ? parseFloat(formData.get('cgpa') as string) : undefined,
      });

      if (res.success) {
        toast.success('Candidate profile updated successfully!');
        router.refresh();
      } else {
        toast.error(`Failed to update profile: ${res.error}`);
      }
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-white max-w-4xl ">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          Candidate Profile
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Manage your personal identifiers, career goals, preferred tech stacks, and social links.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Avatar Details card */}
        <div className="space-y-4">
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              {user.profile?.avatarUrl ? (
                <img
                  src={user.profile.avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full border border-zinc-800 bg-zinc-950 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center font-bold text-white text-2xl border border-zinc-800 shadow-md">
                  {(user.profile?.firstName?.[0] || 'U') + (user.profile?.lastName?.[0] || '')}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-zinc-100 leading-tight">
                {(user.profile?.firstName || '') + ' ' + (user.profile?.lastName || 'Candidate')}
              </h3>
              <span className="text-[9px] text-zinc-500 font-mono mt-1 block">
                Clerk ID: {user.id.slice(0, 15)}...
              </span>
            </div>

            <div className="pt-2 border-t border-zinc-900 w-full grid grid-cols-2 gap-2 text-center text-[10px] font-medium text-zinc-400">
              <div className="bg-zinc-950 p-2 rounded border border-zinc-900">
                <span className="text-zinc-200 block font-semibold">User Role</span>
                <span className="text-[9px] uppercase font-mono text-primary font-bold mt-0.5 block">CANDIDATE</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-900">
                <span className="text-zinc-200 block font-semibold">Status</span>
                <span className="text-[9px] uppercase font-mono text-emerald-400 font-bold mt-0.5 block">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Resume Upload Placeholder */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Resume Document</h4>
            <div className="border border-dashed border-zinc-850 hover:border-zinc-800 rounded-lg p-5 text-center space-y-2 hover:bg-zinc-950/20 transition-all cursor-pointer">
              <UploadCloud className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-[10px] font-semibold text-zinc-400">Upload PDF Resume</p>
              <p className="text-[8px] text-zinc-650">Max size 5MB (Placeholder)</p>
            </div>
          </div>
        </div>

        {/* Right Side: Profile Forms Panels */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section A: Personal Information */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <User className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Personal coordinates</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-400">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  defaultValue={user.profile?.firstName || ''}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-zinc-400">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  defaultValue={user.profile?.lastName || ''}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-zinc-400">Headline</label>
              <input
                type="text"
                name="headline"
                placeholder="e.g. CS Sophomore | Full Stack Developer | Aspiring Software Engineer"
                defaultValue={user.profile?.headline || ''}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-600"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-zinc-400">Bio Description</label>
              <textarea
                name="bio"
                rows={3}
                placeholder="Brief summary of your academic path and professional goals..."
                defaultValue={user.profile?.bio || ''}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-600 resize-none"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-zinc-400 flex items-center gap-1">
                <span>Account Email</span>
                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.25 rounded border border-emerald-500/15 font-mono">VERIFIED</span>
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-900 bg-zinc-950/40 text-zinc-500 cursor-not-allowed">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="text-xs">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Section B: Job Preferences & Target Vectors */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Career Targets & Preferences</h3>
            </div>

            {/* Target Experience and Salary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-400">Target Experience Level</label>
                <select
                  name="experienceLevel"
                  defaultValue={user.profile?.experienceLevel || 'Entry Level'}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary"
                >
                  {experienceOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-400">Salary Expectations</label>
                <input
                  type="text"
                  name="salaryExpectations"
                  placeholder="e.g. $100,000 / year or $45 / hour"
                  defaultValue={user.profile?.salaryExpectations || ''}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-650"
                />
              </div>
            </div>

            {/* Employment and Remote preference vectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">Preferred Employment Type</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {employmentOptions.map((opt) => {
                    const active = employmentPrefs.includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => toggleEmployment(opt)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                          active
                            ? 'bg-primary/10 border-primary/20 text-primary'
                            : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-850'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">Preferred Workplace Mode</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {remoteOptions.map((opt) => {
                    const active = remotePrefs.includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => toggleRemote(opt)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                          active
                            ? 'bg-primary/10 border-primary/20 text-primary'
                            : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-850'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dynamic Tags Input: Skills */}
            <div className="space-y-2 text-xs">
              <label className="font-semibold text-zinc-400">Core Professional Skills</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Press add button to append skills (e.g. React, Next.js, Node.js)"
                  className="flex-1 bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-650"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 rounded-lg text-xs font-bold text-zinc-200"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-850 text-[10px] text-zinc-300"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => setSkills(skills.filter((x) => x !== skill))}
                      className="text-zinc-500 hover:text-zinc-350"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Dynamic Tags Input: Preferred Technologies */}
            <div className="space-y-2 text-xs">
              <label className="font-semibold text-zinc-400">Preferred Technologies</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  placeholder="Press add button to append tech stacks (e.g. Frontend, TypeScript, Cloud)"
                  className="flex-1 bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-650"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
                />
                <button
                  type="button"
                  onClick={addTech}
                  className="px-4 py-2 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 rounded-lg text-xs font-bold text-zinc-200"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {preferredTechnologies.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-850 text-[10px] text-zinc-300"
                  >
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => setPreferredTechnologies(preferredTechnologies.filter((x) => x !== tech))}
                      className="text-zinc-500 hover:text-zinc-350"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Dynamic Tags Input: Preferred Locations */}
            <div className="space-y-2 text-xs">
              <label className="font-semibold text-zinc-400">Preferred Locations</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locInput}
                  onChange={(e) => setLocInput(e.target.value)}
                  placeholder="Press add button to append locations (e.g. Remote, Seattle, New York)"
                  className="flex-1 bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-650"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                />
                <button
                  type="button"
                  onClick={addLocation}
                  className="px-4 py-2 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 rounded-lg text-xs font-bold text-zinc-200"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {preferredLocations.map((loc) => (
                  <span
                    key={loc}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-850 text-[10px] text-zinc-300"
                  >
                    <span>{loc}</span>
                    <button
                      type="button"
                      onClick={() => setPreferredLocations(preferredLocations.filter((x) => x !== loc))}
                      className="text-zinc-500 hover:text-zinc-350"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Section D: Education Details */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Education Coordinates</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-400">University / College</label>
                <input
                  type="text"
                  name="university"
                  placeholder="e.g. Stanford University"
                  defaultValue={user.profile?.university || ''}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-650"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-400">Degree Program</label>
                <input
                  type="text"
                  name="degree"
                  placeholder="e.g. Bachelor of Science"
                  defaultValue={user.profile?.degree || ''}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-650"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-400">Major / Branch</label>
                <input
                  type="text"
                  name="branch"
                  placeholder="e.g. Computer Science"
                  defaultValue={user.profile?.branch || ''}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-650"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-400">Cumulative GPA / Score</label>
                <input
                  type="number"
                  step="0.01"
                  name="cgpa"
                  placeholder="e.g. 3.85 or 9.2"
                  defaultValue={user.profile?.cgpa || ''}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-650"
                />
              </div>
            </div>
          </div>

          {/* Section C: Social Profiles */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Social Coordinates</h3>
            </div>

            <div className="grid grid-cols-1 gap-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5" /> Github Portfolio
                </label>
                <input
                  type="url"
                  name="githubUrl"
                  placeholder="https://github.com/username"
                  defaultValue={user.profile?.githubUrl || ''}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-650"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-blue-400" /> LinkedIn Link
                </label>
                <input
                  type="url"
                  name="linkedinUrl"
                  placeholder="https://linkedin.com/in/username"
                  defaultValue={user.profile?.linkedinUrl || ''}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-650"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> Personal Portfolio Website
                </label>
                <input
                  type="url"
                  name="portfolioUrl"
                  placeholder="https://mywebsite.com"
                  defaultValue={user.profile?.portfolioUrl || ''}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-650"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center bg-[#111113] border border-zinc-850 rounded-xl p-4">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-3.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-xs font-bold text-red-400 transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-xs font-bold text-white transition-all disabled:opacity-50 hover:cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>

        </div>
      </form>

      {/* Delete Account Modal (UI-Only Mock) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl animate-fade-in text-xs">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
              <span>Confirm Account Deletion</span>
            </h3>
            <p className="text-zinc-400 leading-relaxed mb-4">
              You are about to delete your InternScope AI account. This action is irreversible. All saved internships, alert preferences, and applications trackers will be deleted immediately.
            </p>
             <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 border border-zinc-800 bg-zinc-950 text-zinc-300 rounded-lg hover:bg-zinc-900 transition-all font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.error('Deletion simulation: Clerk users cannot be deleted directly in sandbox environments.');
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-lg font-bold transition-all shadow-md text-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
