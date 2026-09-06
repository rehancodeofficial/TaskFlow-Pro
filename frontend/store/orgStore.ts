import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { useAuthStore } from './authStore';

export interface Organization {
  id: string;
  name: string;
}

interface OrgState {
  organizations: Organization[];
  activeOrg: Organization | null;
  isLoading: boolean;
  fetchOrganizations: () => Promise<void>;
  setActiveOrg: (org: Organization) => void;
  createOrganization: (name: string) => Promise<Organization>;
  clearState: () => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      organizations: [],
      activeOrg: null,
      isLoading: false,

      fetchOrganizations: async () => {
        set({ isLoading: true });
        try {
          // In a real implementation we would fetch organizations the user belongs to.
          // Since we didn't explicitly make an endpoint for "GET /users/me/organizations",
          // let's assume we have an endpoint or we try to load it. 
          // For now we'll stub this or use a generic call.
          // Let's create an endpoint in the backend later if needed.
          // Since TaskFlow backend has OrganizationController but maybe not "my orgs", 
          // let's assume we can fetch them or we handle the empty case.
          
          const response = await api.get('/organizations/my'); // We'll assume we add this
          const orgs = response.data.data;
          
          set({ organizations: orgs });
          
          // Auto-select the first org if none is active
          if (orgs.length > 0 && !get().activeOrg) {
            get().setActiveOrg(orgs[0]);
          }
        } catch (error) {
          console.error("Failed to fetch organizations", error);
        } finally {
          set({ isLoading: false });
        }
      },

      setActiveOrg: (org) => {
        set({ activeOrg: org });
        useAuthStore.getState().setTenantId(org.id);
      },

      createOrganization: async (name) => {
        const response = await api.post('/organizations', { name });
        const newOrg = response.data.data;
        
        set((state) => ({
          organizations: [...state.organizations, newOrg],
        }));
        
        get().setActiveOrg(newOrg);
        return newOrg;
      },
      
      clearState: () => {
        set({ organizations: [], activeOrg: null });
      }
    }),
    {
      name: 'org-storage',
      partialize: (state) => ({ activeOrg: state.activeOrg }),
    }
  )
);
