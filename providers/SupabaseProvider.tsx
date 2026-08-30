'use client';

import { createContext, useContext } from 'react';

// SupabaseProvider has been replaced with our custom auth architecture.
// This stub prevents import errors from legacy code while transitioning.

type AppContext = {
  isLoaded: boolean;
};

const Context = createContext<AppContext>({ isLoaded: true });

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  return <Context.Provider value={{ isLoaded: true }}>{children}</Context.Provider>;
}

export const useSupabase = () => {
  return { supabase: null, isLoaded: true };
};
