'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company, Internship, Application, Activity, EmailReportPreference, ApplicationStatus } from '@/types';
import {
  COMPANIES as INITIAL_COMPANIES,
  INTERNSHIPS as INITIAL_INTERNSHIPS,
  APPLICATIONS as INITIAL_APPLICATIONS,
  ACTIVITIES as INITIAL_ACTIVITIES,
  EMAIL_PREFERENCES as INITIAL_EMAIL_PREFERENCES
} from '@/constants';
import {
  toggleSaveJobAction,
  upsertApplicationAction,
  deleteApplicationAction,
  trackCompanyAction,
  untrackCompanyAction,
  addCustomApplicationAction,
  loadInitialDashboardStateAction
} from '@/app/actions/candidate';
import { toast } from 'sonner';

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
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 1. Sync from database on mount
  useEffect(() => {
    async function syncData() {
      const res = await loadInitialDashboardStateAction();
      if (res.success) {
        if (res.companies && res.companies.length > 0) {
          setCompanies(res.companies as any);
        }
        if (res.applications) {
          setApplications(res.applications as any);
          setAppliedIds(res.applications.map(a => a.internshipId));
        }
        if (res.savedIds) {
          setSavedIds(res.savedIds);
        }
      }
    }
    syncData();
  }, []);

  const handleToggleCompanyTrack = (id: string) => {
    const target = companies.find((c) => c.id === id);
    if (!target) return;
    const nextTracking = !target.isTracking;

    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isTracking: nextTracking } : c))
    );

    if (nextTracking) {
      trackCompanyAction(id).then(res => {
        if (res.success) toast.success(`Started tracking ${target.name}`);
        else toast.error(`Error: ${res.error}`);
      });
    } else {
      untrackCompanyAction(id).then(res => {
        if (res.success) toast.success(`Stopped tracking ${target.name}`);
        else toast.error(`Error: ${res.error}`);
      });
    }

    const newAct: Activity = {
      id: `act_${Date.now()}`,
      type: 'system',
      message: `${nextTracking ? 'Started' : 'Stopped'} tracking openings for ${target.name}`,
      timestamp: 'Just now'
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleToggleSaveInternship = (id: string) => {
    setSavedIds((prev) => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter((x) => x !== id) : [...prev, id];
      
      toggleSaveJobAction(id).then(res => {
        if (res.success) {
          toast.success(res.saved ? 'Bookmark saved.' : 'Bookmark removed.');
        } else {
          toast.error(`Error: ${res.error}`);
        }
      });

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

    upsertApplicationAction(role.id, 'APPLIED', '').then(res => {
      if (res.success) toast.success('Application tracked in pipeline!');
      else toast.error(`Error: ${res.error}`);
    });

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
    const target = applications.find((app) => app.id === id);
    if (!target) return;

    const dbStatus = newStatus.toUpperCase();
    upsertApplicationAction(target.internshipId, dbStatus as any, target.notes || '').then(res => {
      if (!res.success) toast.error(`Error syncing status: ${res.error}`);
    });

    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] } : app))
    );

    const newAct: Activity = {
      id: `act_${Date.now()}`,
      type: newStatus === 'interview' ? 'interview' : 'system',
      message: `Updated application stage for ${target.companyName} (${target.role}) to: ${newStatus}`,
      timestamp: 'Just now'
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleDeleteApplication = (id: string) => {
    const target = applications.find((app) => app.id === id);
    if (target) {
      deleteApplicationAction(id).then(res => {
        if (!res.success) toast.error(`Error deleting: ${res.error}`);
      });
      setAppliedIds((prev) => prev.filter((x) => x !== target.internshipId));
    }
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };

  const handleAddCustomApplication = (app: Omit<Application, 'id' | 'lastUpdated'>) => {
    addCustomApplicationAction({
      companyName: app.companyName,
      role: app.role,
      status: app.status,
      notes: app.notes,
    }).then(res => {
      if (res.success && res.application) {
        toast.success('Custom application added!');
        setApplications((prev) => [res.application as any, ...prev]);
        setAppliedIds((prev) => [...prev, res.application!.internshipId]);
      } else {
        toast.error(`Error: ${res.error}`);
      }
    });

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
