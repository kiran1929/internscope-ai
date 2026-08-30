'use client';

import React, { useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import { LogOut, X, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({ isOpen, onClose }) => {
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);

  const handleConfirmSignOut = async () => {
    try {
      setLoading(true);
      await signOut({ redirectUrl: '/' });
    } catch (err) {
      console.error('Failed to sign out:', err);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={loading ? undefined : onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-sm bg-card-bg border border-border-subtle rounded-2xl p-6 shadow-2xl z-10 space-y-5"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="absolute top-4 right-4 text-text-muted hover:text-foreground p-1 rounded-lg hover:bg-surface-muted transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Sign Out</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Are you sure you want to sign out of your account?
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-border-subtle bg-surface-muted hover:bg-surface-elevated text-foreground transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOut}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SignOutModal;
