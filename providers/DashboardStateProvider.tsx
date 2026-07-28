'use client';

import React, { createContext, useContext, useState } from 'react';
import { Company, Internship, Application, Activity, EmailReportPreference, ApplicationStatus } from '@/types';
import {
  COMPANIES as INITIAL_COMPANIES,
  INTERNSHIPS as INITIAL_INTERNSHIPS,
  APPLICATIONS as INITIAL_APPLICATIONS,
  ACTIVITIES as INITIAL_ACTIVITIES,
  EMAIL_PREFERENCES as INITIAL_EMAIL_PREFERENCES
} from '@/constants';

interface DashboardStateContextType {
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  internships: Internship[];
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  emailPreferences: EmailReportPreference[];
  setEmailPreferences: React.Dispatch<React.SetStateAction<EmailReportPreference[]>>;
  savedIds: string[];
  setSavedIds: React.Dispatch<React.SetStateAction<string[]>>;
  appliedIds: string[];
  setAppliedIds: React.Dispatch<React.SetStateAction<string[]>>;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  handleToggleCompanyTrack: (id: string) => void;
  handleToggleSaveInternship: (id: string) => void;
  handleTrackApplication: (role: Internship) => void;
  handleUpdateApplicationStatus: (id: string, newStatus: ApplicationStatus) => void;
  handleDeleteApplication: (id: string) => void;
  handleAddCustomApplication: (app: Omit<Application, 'id' | 'lastUpdated'>) => void;
  handleTogglePreference: (id: string) => void;
}

const DashboardStateContext = createContext<DashboardStateContextType | undefined>(undefined);

export const DashboardStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [internships] = useState<Internship[]>(INITIAL_INTERNSHIPS);
  const [applications, setApplications] = useState<Application[]>(INITIAL_APPLICATIONS);
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [emailPreferences, setEmailPreferences] = useState<EmailReportPreference[]>(INITIAL_EMAIL_PREFERENCES);
  const [savedIds, setSavedIds] = useState<string[]>(['int_5', 'int_7']);
  const [appliedIds, setAppliedIds] = useState<string[]>(['int_3', 'int_1', 'int_6']);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleToggleCompanyTrack = (id: string) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isTracking: !c.isTracking } : c))
    );
    const target = companies.find((c) => c.id === id);
    if (target) {
      const isTrackingNow = !target.isTracking;
      const newAct: Activity = {
        id: `act_${Date.now()}`,
        type: 'system',
        message: `${isTrackingNow ? 'Started' : 'Stopped'} tracking openings for ${target.name}`,
        timestamp: 'Just now'
      };
      setActivities((prev) => [newAct, ...prev]);
    }
  };

  const handleToggleSaveInternship = (id: string) => {
    setSavedIds((prev) => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter((x) => x !== id) : [...prev, id];
      
      const target = internships.find((r) => r.id === id);
      if (target) {
        const newAct: Activity = {
          id: `act_${Date.now()}`,
          type: 'match',
          message: `${exists ? 'Removed' : 'Saved'} position: ${target.role} at ${target.companyName}`,
          timestamp: 'Just now',
          internshipId: id
        };
        setActivities((actPrev) => [newAct, ...actPrev]);
      }
      return updated;
    });
  };

  const handleTrackApplication = (role: Internship) => {
    if (appliedIds.includes(role.id)) return;

    const newApp: Application = {
      id: `app_${Date.now()}`,
      internshipId: role.id,
      companyName: role.companyName,
      companyLogo: role.companyLogo,
      role: role.role,
      status: 'applied',
      appliedDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      notes: 'Promoted from saved internships search.',
      nextStep: 'Resume Screen'
    };

    setApplications((prev) => [newApp, ...prev]);
    setAppliedIds((prev) => [...prev, role.id]);

    const newAct: Activity = {
      id: `act_${Date.now()}`,
      type: 'applied',
      message: `Started tracking application for ${role.role} at ${role.companyName}`,
      timestamp: 'Just now',
      internshipId: role.id
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleUpdateApplicationStatus = (id: string, newStatus: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] } : app))
    );

    const target = applications.find((app) => app.id === id);
    if (target) {
      const newAct: Activity = {
        id: `act_${Date.now()}`,
        type: newStatus === 'interviewing' ? 'interview' : 'system',
        message: `Updated application stage for ${target.companyName} (${target.role}) to: ${newStatus}`,
        timestamp: 'Just now'
      };
      setActivities((prev) => [newAct, ...prev]);
    }
  };

  const handleDeleteApplication = (id: string) => {
    const target = applications.find((app) => app.id === id);
    if (target) {
      setAppliedIds((prev) => prev.filter((x) => x !== target.internshipId));
    }
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };

  const handleAddCustomApplication = (app: Omit<Application, 'id' | 'lastUpdated'>) => {
    const newApp: Application = {
      ...app,
      id: `app_${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setApplications((prev) => [newApp, ...prev]);

    const newAct: Activity = {
      id: `act_${Date.now()}`,
      type: 'applied',
      message: `Added custom application: ${app.role} at ${app.companyName}`,
      timestamp: 'Just now'
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleTogglePreference = (id: string) => {
    setEmailPreferences((prev) =>
      prev.map((pref) => (pref.id === id ? { ...pref, isActive: !pref.isActive } : pref))
    );
  };

  return (
    <DashboardStateContext.Provider
      value={{
        companies,
        setCompanies,
        internships,
        applications,
        setApplications,
        activities,
        setActivities,
        emailPreferences,
        setEmailPreferences,
        savedIds,
        setSavedIds,
        appliedIds,
        setAppliedIds,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        handleToggleCompanyTrack,
        handleToggleSaveInternship,
        handleTrackApplication,
        handleUpdateApplicationStatus,
        handleDeleteApplication,
        handleAddCustomApplication,
        handleTogglePreference,
      }}
    >
      {children}
    </DashboardStateContext.Provider>
  );
};

export const useDashboardState = () => {
  const context = useContext(DashboardStateContext);
  if (context === undefined) {
    throw new Error('useDashboardState must be used within a DashboardStateProvider');
  }
  return context;
};
