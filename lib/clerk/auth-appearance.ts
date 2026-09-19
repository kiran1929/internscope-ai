/**
 * Shared Clerk appearance for light auth pages (sign-in / sign-up).
 * Prefer CSS properties over Tailwind classes so borders/backgrounds
 * aren't dropped by Clerk's internal class structure.
 */
export const authClerkAppearance = {
  layout: {
    socialButtonsPlacement: 'top' as const,
    socialButtonsVariant: 'blockButton' as const,
    logoPlacement: 'none' as const,
    unsafe_disableDevelopmentModeWarnings: true,
  },
  variables: {
    colorPrimary: '#2563EB',
    colorBackground: '#FFFFFF',
    colorInputBackground: '#FFFFFF',
    colorInputText: '#0F172A',
    colorText: '#0F172A',
    colorTextSecondary: '#64748B',
    colorTextOnPrimaryBackground: '#FFFFFF',
    colorDanger: '#DC2626',
    colorNeutral: '#64748B',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
  },
  elements: {
    rootBox: {
      width: '100%',
    },
    cardBox: {
      width: '100%',
      maxWidth: '28rem',
      boxShadow: '0 20px 40px -16px rgba(15, 23, 42, 0.12)',
      border: '1px solid #E2E8F0',
      borderRadius: '1rem',
      overflow: 'visible',
      backgroundColor: '#FFFFFF',
    },
    card: {
      backgroundColor: '#FFFFFF',
      padding: '1.75rem 1.75rem 1.25rem',
      gap: '1.35rem',
      boxShadow: 'none',
    },
    main: {
      gap: '1.25rem',
    },
    header: {
      marginBottom: '0.25rem',
    },
    headerTitle: {
      color: '#0F172A',
      fontSize: '1.25rem',
      fontWeight: '700',
      fontFamily: 'var(--font-outfit), system-ui, sans-serif',
    },
    headerSubtitle: {
      color: '#64748B',
      fontSize: '0.8125rem',
      marginTop: '0.35rem',
    },
    socialButtons: {
      marginTop: '0.35rem',
    },
    socialButtonsBlockButton: {
      position: 'relative',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E2E8F0',
      color: '#334155',
      fontWeight: '600',
      fontSize: '0.8125rem',
      padding: '0.75rem 1rem',
      borderRadius: '0.75rem',
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      marginTop: '0.5rem',
    },
    socialButtonsBlockButtonText: {
      color: '#334155',
      fontWeight: '600',
    },
    socialButtonsProviderIcon: {
      filter: 'none',
    },
    lastAuthenticationStrategyBadge: {
      position: 'absolute',
      top: '-0.55rem',
      right: '0.75rem',
      zIndex: 2,
      color: '#64748B',
      backgroundColor: '#F8FAFC',
      border: '1px solid #E2E8F0',
      fontSize: '0.625rem',
      fontWeight: '600',
      borderRadius: '9999px',
      padding: '0.15rem 0.55rem',
      lineHeight: '1',
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
    },
    formButtonPrimary: {
      backgroundColor: '#2563EB',
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: '0.8125rem',
      padding: '0.75rem 1rem',
      borderRadius: '0.75rem',
      boxShadow: '0 8px 16px -8px rgba(37, 99, 235, 0.55)',
      marginTop: '0.35rem',
    },
    formFieldLabel: {
      color: '#334155',
      fontSize: '0.75rem',
      fontWeight: '600',
      marginBottom: '0.45rem',
    },
    formFieldInput: {
      backgroundColor: '#FFFFFF',
      color: '#0F172A',
      border: '1px solid #CBD5E1',
      borderRadius: '0.75rem',
      fontSize: '0.875rem',
      padding: '0.75rem 0.875rem',
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      outline: 'none',
    },
    formFieldInputShowPasswordButton: {
      color: '#64748B',
    },
    dividerRow: {
      marginTop: '0.15rem',
      marginBottom: '0.15rem',
    },
    dividerText: {
      color: '#94A3B8',
      fontSize: '0.75rem',
      fontWeight: '500',
    },
    dividerLine: {
      backgroundColor: '#E2E8F0',
    },
    footer: {
      backgroundColor: '#F8FAFC',
      borderTop: '1px solid #F1F5F9',
      marginTop: 0,
      padding: '1rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.65rem',
      position: 'relative',
    },
    footerAction: {
      margin: 0,
      padding: 0,
    },
    footerActionText: {
      color: '#64748B',
      fontSize: '0.8125rem',
    },
    footerActionLink: {
      color: '#2563EB',
      fontWeight: '700',
      fontSize: '0.8125rem',
    },
    footerPages: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.4rem',
      margin: 0,
      padding: 0,
      width: '100%',
    },
    identityPreviewText: {
      color: '#0F172A',
      fontSize: '0.8125rem',
      fontWeight: '500',
    },
    identityPreviewEditButton: {
      color: '#2563EB',
      fontSize: '0.75rem',
    },
    formHeaderTitle: {
      color: '#0F172A',
      fontSize: '1.125rem',
      fontWeight: '700',
    },
    formHeaderSubtitle: {
      color: '#64748B',
      fontSize: '0.8125rem',
    },
    alertText: {
      color: '#334155',
      fontSize: '0.75rem',
    },
  },
};
