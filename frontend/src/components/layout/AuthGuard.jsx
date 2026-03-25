"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  authActions,
  selectIsAuthenticated,
} from "@/redux/slices/auth/authSlice";
import { authService } from "@/services/auth";

const getCookieToken = () => {
  if (typeof document === "undefined") return null;
  const found = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("token="));
  return found ? decodeURIComponent(found.split("=")[1]) : null;
};

export default function AuthGuard({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      if (isAuthenticated) {
        if (active) setHydrating(false);
        return;
      }

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || getCookieToken()
          : null;

      if (!token) {
        if (active) {
          setHydrating(false);
          router.replace("/signin");
        }
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
      }

      const rawUser =
        typeof window !== "undefined" ? localStorage.getItem("user") : null;

      if (rawUser) {
        try {
          const parsedUser = JSON.parse(rawUser);
          dispatch(authActions.setCredentials({ user: parsedUser, token }));
          if (active) setHydrating(false);
          return;
        } catch {
          // fallback to /auth/me request
        }
      }

      try {
        const data = await authService.getMe();
        const user = data?.data?.user;
        if (user) {
          if (typeof window !== "undefined") {
            localStorage.setItem("user", JSON.stringify(user));
          }
          dispatch(authActions.setCredentials({ user, token }));
        }
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          document.cookie = "token=; path=/; max-age=0; samesite=lax";
        }
        if (active) router.replace("/signin");
      } finally {
        if (active) setHydrating(false);
      }
    };

    hydrate();

    return () => {
      active = false;
    };
  }, [isAuthenticated, dispatch, router]);

  if (hydrating || !isAuthenticated) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}
