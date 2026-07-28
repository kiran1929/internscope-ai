'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  User,
  Shield,
  Key,
  Trash2,
  Check,
  Mail,
  Chrome,
  Github,
  AlertTriangle,
  Lock,
  Loader2
} from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-text-muted">Loading your Clerk profile session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-8 text-center max-w-md mx-auto">
        <AlertTriangle className="w-8 h-8 text-danger mx-auto mb-3" />
        <h3 className="text-sm font-bold text-white">No active session found</h3>
        <p className="text-xs text-text-muted mt-1">Please sign in to view your profile settings.</p>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingProfile(true);
    setErrorMsg('');
    setProfileSaved(false);

    const formData = new FormData(e.currentTarget);
    const fName = (formData.get('firstName') as string) || '';
    const lName = (formData.get('lastName') as string) || '';
    
    try {
      await user.update({
        firstName: fName.trim(),
        lastName: lName.trim(),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err: unknown) {
      console.error(err);
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Failed to update profile details.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Check connected accounts
  const isGoogleConnected = user.externalAccounts.some(acc => acc.provider === 'google');
  const isGithubConnected = user.externalAccounts.some(acc => acc.provider === 'github');

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-4xl">
      <div>
        <h2 className="text-base font-bold text-white">Identity & Profile</h2>
        <p className="text-xs text-text-muted">Manage your personal coordinates, social link status, and account security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Avatar Details card */}
        <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.fullName || 'User Avatar'}
                width={80}
                height={80}
                className="rounded-full border border-zinc-700 bg-zinc-900 shadow-md group-hover:opacity-85 transition-opacity"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center font-bold text-white text-2xl shadow-md border border-zinc-800">
                {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-white leading-tight">
              {user.fullName || 'Anonymous Candidate'}
            </h3>
            <span className="text-[10px] text-text-muted font-mono leading-none mt-1 block">
              ID: {user.id}
            </span>
          </div>

          <div className="pt-2 border-t border-zinc-900/60 w-full grid grid-cols-2 gap-2 text-center text-[10px] font-medium text-text-muted">
            <div className="bg-zinc-900/50 p-2 rounded border border-zinc-850">
              <span className="text-white block font-semibold">User Role</span>
              <span className="text-[9px] uppercase font-mono text-primary font-bold mt-0.5 block">USER</span>
            </div>
            <div className="bg-zinc-900/50 p-2 rounded border border-zinc-850">
              <span className="text-white block font-semibold">Verification</span>
              <span className="text-[9px] uppercase font-mono text-success font-bold mt-0.5 block">Verified</span>
            </div>
          </div>
        </div>

        {/* Right Side: Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Info */}
          <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-white">Personal Information</h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-text-muted">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    defaultValue={user.firstName || ''}
                    className="w-full bg-zinc-900/65 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-text-muted">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    defaultValue={user.lastName || ''}
                    className="w-full bg-zinc-900/65 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-muted flex items-center gap-1">
                  <span>Primary Email</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.25 rounded border border-emerald-500/15">Verified</span>
                </label>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-zinc-850 bg-zinc-900/40 text-text-muted select-none cursor-not-allowed">
                  <Mail className="w-4.5 h-4.5 shrink-0" />
                  <span className="text-xs">{user.primaryEmailAddress?.emailAddress || ''}</span>
                </div>
                <span className="text-[9px] text-text-muted/70 block mt-1">Contact your system administrator or modify Clerk settings to change primary email address.</span>
              </div>

              {errorMsg && (
                <p className="text-[10px] text-danger font-semibold bg-danger/10 border border-danger/15 p-2 rounded">{errorMsg}</p>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700/80 text-xs font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : profileSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" />
                      <span>Updated!</span>
                    </>
                  ) : (
                    <span>Update Details</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Connected Accounts */}
          <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Connected Accounts</h3>
            </div>

            <div className="divide-y divide-zinc-900/60 text-xs text-text-muted">
              {/* Google Social Connect */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-850 text-white">
                    <Chrome className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Google OAuth Provider</span>
                    <span className="text-[10px] text-text-muted">Federated identity provider log</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                  isGoogleConnected ? 'bg-success/10 text-success border border-success/15' : 'bg-zinc-900 text-text-muted'
                }`}>
                  {isGoogleConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>

              {/* GitHub Social Connect */}
              <div className="py-3 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-850 text-white">
                    <Github className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">GitHub Provider</span>
                    <span className="text-[10px] text-text-muted">Federated identity provider log</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                  isGithubConnected ? 'bg-success/10 text-success border border-success/15' : 'bg-zinc-900 text-text-muted'
                }`}>
                  {isGithubConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>

          {/* Security details & Password */}
          <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-white">Security & Credentials</h3>
            </div>

            <div className="space-y-3.5 text-xs text-text-muted">
              <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-850/60 flex items-start gap-2.5">
                <Lock className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Password Management</span>
                  <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">
                    To modify your login password, activate 2FA, or review active authentication sessions, configure your profile settings securely via Clerk&apos;s central identity portal.
                  </p>
                  <button
                    onClick={() => window.open('https://accounts.clerk.dev', '_blank')}
                    className="text-[10px] text-primary hover:text-blue-400 font-bold underline mt-2"
                  >
                    Open Clerk Accounts Portal
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-[#18181B] border border-danger/35 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-white">Danger Zone</h3>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-text-muted">
              <div>
                <span className="font-bold text-white block">Delete Account</span>
                <span className="text-[10px] text-text-muted mt-0.5 block">Permanently erase your account, tracked positions, and preferences.</span>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3.5 py-2 rounded-lg bg-danger hover:bg-red-600 text-xs font-bold text-white transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-md shadow-danger/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Delete Account Modal (UI-Only Mock) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 select-none">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-xs">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-danger animate-bounce" />
              <span>Confirm Account Deletion</span>
            </h3>
            <p className="text-text-muted leading-relaxed mb-4">
              You are about to delete your InternScope AI account. This action is irreversible. All your resume matches, saved internships, and applications will be deleted immediately.
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-zinc-800 rounded-lg font-semibold hover:bg-zinc-850 text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Account deletion request registered (UI-Only Simulator). In a production environment, this triggers a call to Clerk SDK to delete user.');
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 bg-danger hover:bg-red-600 text-white rounded-lg font-semibold transition-all shadow-md shadow-danger/15"
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
