'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { submitOnboardingAction } from '@/app/actions/onboarding';
import { Compass, Sparkles, Loader2, ArrowRight } from 'lucide-react';

export default function CandidateOnboardingClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Onboarding States
  const [careerGoal, setCareerGoal] = useState('');
  const [preferredRoles, setPreferredRoles] = useState<string[]>([]);
  const [skillsText, setSkillsText] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [locationsText, setLocationsText] = useState('');
  const [remotePreference, setRemotePreference] = useState('REMOTE');
  const [desiredSalary, setDesiredSalary] = useState('');

  const rolesOptions = [
    'Frontend Developer',
    'Backend Engineer',
    'Full Stack Engineer',
    'Data Scientist',
    'Product Manager',
    'Mobile Developer',
    'DevOps Engineer'
  ];

  const handleRoleToggle = (role: string) => {
    setPreferredRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!careerGoal.trim()) {
      toast.warning('Please declare your career target goal.');
      return;
    }

    const skills = skillsText.split(',').map(s => s.trim()).filter(Boolean);
    const preferredLocations = locationsText.split(',').map(l => l.trim()).filter(Boolean);

    startTransition(async () => {
      const res = await submitOnboardingAction({
        careerGoal,
        preferredRoles,
        skills,
        experienceLevel,
        preferredLocations,
        remotePreference,
        desiredSalary,
      });

      if (res.success) {
        toast.success('Onboarding complete! Welcome onboard.');
        router.push('/dashboard');
      } else {
        toast.error(`Onboarding failed: ${res.error}`);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#111113] border border-zinc-850 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl text-white select-none">
      
      {/* Header */}
      <div className="text-center space-y-2 pb-4 border-b border-zinc-900">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white mx-auto shadow-lg shadow-primary/20">
          <Compass className="w-5 h-5 animate-spin-slow" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center justify-center gap-1.5">
          Complete Your Career Profile <Sparkles className="w-5 h-5 text-primary animate-pulse" />
        </h2>
        <p className="text-xs text-zinc-400">Tailoring target matches and mock interviews using your preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
        
        {/* Career Goal */}
        <div className="space-y-1.5">
          <label className="block font-bold text-zinc-300">What is your primary career target goal?</label>
          <input
            type="text"
            value={careerGoal}
            onChange={(e) => setCareerGoal(e.target.value)}
            placeholder="e.g. Backend Software Engineer Intern at Google STEP"
            className="w-full bg-zinc-950 border border-zinc-850 text-white rounded-lg p-2.5 focus:outline-none focus:border-primary placeholder:text-zinc-700"
            required
          />
        </div>

        {/* Preferred Roles Checkboxes */}
        <div className="space-y-2">
          <label className="block font-bold text-zinc-300">Preferred Internship Roles</label>
          <div className="grid grid-cols-2 gap-2">
            {rolesOptions.map(role => {
              const isChecked = preferredRoles.includes(role);
              return (
                <button
                  type="button"
                  key={role}
                  onClick={() => handleRoleToggle(role)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    isChecked
                      ? 'border-primary bg-primary/5 text-white font-bold'
                      : 'border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:bg-zinc-950'
                  }`}
                >
                  <span>{role}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Skills Chips Text Area */}
        <div className="space-y-1.5">
          <label className="block font-bold text-zinc-300">What are your main technologies / skills? (Comma-separated)</label>
          <textarea
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="React, TypeScript, Node.js, Python, Docker, PostgreSQL"
            rows={3}
            className="w-full bg-zinc-950 border border-zinc-850 text-white rounded-lg p-2.5 focus:outline-none focus:border-primary placeholder:text-zinc-700 leading-normal"
          />
        </div>

        {/* Splits: Experience & Remote Preference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Experience level */}
          <div className="space-y-1.5">
            <label className="block font-bold text-zinc-300">Current Experience Level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 text-white rounded-lg p-2.5 focus:outline-none"
            >
              <option value="Beginner">Beginner / Student</option>
              <option value="Intermediate">Intermediate / Self-taught</option>
              <option value="Advanced">Advanced / Past Internships</option>
            </select>
          </div>

          {/* Remote Preference */}
          <div className="space-y-1.5">
            <label className="block font-bold text-zinc-300">Remote Work Preference</label>
            <select
              value={remotePreference}
              onChange={(e) => setRemotePreference(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 text-white rounded-lg p-2.5 focus:outline-none"
            >
              <option value="REMOTE">Remote Preference</option>
              <option value="HYBRID">Hybrid Preference</option>
              <option value="ONSITE">On-Site Preference</option>
            </select>
          </div>

        </div>

        {/* Splits: Preferred Locations & Salary Target */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="space-y-1.5">
            <label className="block font-bold text-zinc-300">Preferred Locations (Comma-separated)</label>
            <input
              type="text"
              value={locationsText}
              onChange={(e) => setLocationsText(e.target.value)}
              placeholder="San Francisco, New York, Seattle"
              className="w-full bg-zinc-950 border border-zinc-850 text-white rounded-lg p-2.5 focus:outline-none focus:border-primary placeholder:text-zinc-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-zinc-300">Desired Hourly / Monthly Salary</label>
            <input
              type="text"
              value={desiredSalary}
              onChange={(e) => setDesiredSalary(e.target.value)}
              placeholder="e.g. $45/hr or $6,000/mo"
              className="w-full bg-zinc-950 border border-zinc-850 text-white rounded-lg p-2.5 focus:outline-none focus:border-primary placeholder:text-zinc-700"
            />
          </div>

        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-zinc-900">
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving career settings...</span>
              </>
            ) : (
              <>
                <span>Complete Onboarding</span>
                <ArrowRight className="w-4 h-4 animate-bounce-slow" />
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
