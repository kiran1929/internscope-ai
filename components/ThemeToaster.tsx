'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/providers/ThemeProvider';

export function ThemeToaster() {
  const { theme } = useTheme();

  return <Toaster position="top-right" theme={theme} richColors />;
}
