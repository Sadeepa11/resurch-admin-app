import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";

const AuthContext = createContext(null);

const ALLOWED_ROLES = ["superadmin", "super_admin", "admin", "manager", "marketing"];

function normalizeRole(role) {
  if (!role) return "";
  return role.toLowerCase().replace(/\s+/g, "_");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const savedToken = await AsyncStorage.getItem("token");
      const savedUser = await AsyncStorage.getItem("user");
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn("Session restore error:", e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post("/login", { email, password });
    const { token: newToken, data } = response.data;
    const userObj = data.user;

    const role = normalizeRole(userObj.role);
    if (!ALLOWED_ROLES.includes(role)) {
      throw new Error("Access denied. Admin privileges required.");
    }

    await AsyncStorage.setItem("token", newToken);
    await AsyncStorage.setItem("user", JSON.stringify(userObj));
    setToken(newToken);
    setUser(userObj);
    return userObj;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => {
    const role = normalizeRole(user?.role);
    const isSuperAdmin = role === "superadmin" || role === "super_admin";
    return { user, token, loading, login, logout, role, isSuperAdmin };
  }, [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
