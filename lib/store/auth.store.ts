import { create } from "zustand";
import { auth, users, clearTokens, getToken } from "@/lib/api";
import type { AuthUser } from "@/lib/api";

interface AuthState {
  user: AuthUser | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,

  hydrate: async () => {
    if (!getToken()) {
      set({ hydrated: true });
      return;
    }
    try {
      const u = await users.me();
      set({
        user: {
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          profileImage: u.profileImage ?? undefined,
        },
        hydrated: true,
      });
    } catch {
      clearTokens();
      set({ user: null, hydrated: true });
    }
  },

  login: async (email, password) => {
    const data = await auth.login(email, password);
    set({ user: data.user });
    return data.user;
  },

  logout: async () => {
    try {
      const { getRefreshToken } = await import("@/lib/api");
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await auth.logout(refreshToken);
      } else {
        clearTokens();
      }
    } catch {
      clearTokens();
    }
    set({ user: null });
  },
}));
