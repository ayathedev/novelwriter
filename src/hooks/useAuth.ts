import { useEffect, useState } from "react";
import { User } from "../types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a logged-in user
    setUser({
      uid: "local-user-id",
      displayName: "Local User",
      isAnonymous: false,
    });
    setLoading(false);
  }, []);

  const login = () => {
    console.log("Login not needed for local storage.");
  };

  const logout = () => {
    console.log("Logout not needed for local storage.");
  };

  return { user, loading, login, logout };
}
