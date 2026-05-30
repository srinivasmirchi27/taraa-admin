import { request, setTokens, clearTokens } from "./client";
import type { LoginResponse, AuthTokens } from "./types";

export const auth = {
  register: (name: string, email: string, password: string) =>
    request<LoginResponse>("/auth/register", {
      method: "POST",
      auth: false,
      body: { name, email, password },
    }),

  login: async (email: string, password: string) => {
    const data = await request<LoginResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  refresh: async (refreshToken: string) => {
    const data = await request<Pick<AuthTokens, "accessToken" | "expiresIn">>(
      "/auth/refresh",
      { method: "POST", auth: false, body: { refreshToken } },
    );
    setTokens(data.accessToken);
    return data;
  },

  logout: async (refreshToken: string) => {
    const data = await request<{ message: string }>("/auth/logout", {
      method: "POST",
      body: { refreshToken },
    });
    clearTokens();
    return data;
  },

  logoutAll: async () => {
    const data = await request<{ message: string }>("/auth/logout-all", {
      method: "POST",
    });
    clearTokens();
    return data;
  },

  googleToken: (idToken: string) =>
    request<LoginResponse & { isNew: boolean }>("/auth/google/token", {
      method: "POST",
      auth: false,
      body: { idToken },
    }),

  phoneLogin: (idToken: string) =>
    request<{ accessToken: string; isNewUser: boolean }>("/auth/phone-login", {
      method: "POST",
      auth: false,
      body: { idToken },
    }),

  otp: {
    send: (phone: string) =>
      request<{ message: string }>("/auth/otp/send", {
        method: "POST",
        auth: false,
        body: { phone },
      }),

    verify: (phone: string, otp: string) =>
      request<{ accessToken: string; isNewUser: boolean }>("/auth/otp/verify", {
        method: "POST",
        auth: false,
        body: { phone, otp },
      }),
  },
};
