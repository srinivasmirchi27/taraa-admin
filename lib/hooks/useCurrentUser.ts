"use client";

import { useState, useEffect } from "react";
import { users } from "@/lib/api";
import type { User } from "@/lib/api";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    users.me().then(setUser).catch(() => {});
  }, []);

  return user;
}
