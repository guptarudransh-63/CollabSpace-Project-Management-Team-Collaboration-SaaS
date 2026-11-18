import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth.js';
import { workspaceAPI } from '../api/workspaces.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('collabspace_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('collabspace_token') || null);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(() => {
    const saved = localStorage.getItem('collabspace_current_workspace_obj');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Sync session on mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data.user);
          localStorage.setItem('collabspace_user', JSON.stringify(res.data.user));

          const userWorkspaces = res.data.workspaces || [];
          setWorkspaces(userWorkspaces);

          // Select active workspace if none or invalid
          const savedId = localStorage.getItem('collabspace_current_workspace');
          const matched = userWorkspaces.find((w) => w._id === savedId) || userWorkspaces[0];

          if (matched) {
            setCurrentWorkspace(matched);
            localStorage.setItem('collabspace_current_workspace', matched._id);
            localStorage.setItem('collabspace_current_workspace_obj', JSON.stringify(matched));
          }
        } catch (err) {
          console.error('Session sync error:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: newToken, user: userData, workspaces: wsList } = res.data;

    setToken(newToken);
    setUser(userData);
    setWorkspaces(wsList);

    localStorage.setItem('collabspace_token', newToken);
    localStorage.setItem('collabspace_user', JSON.stringify(userData));

    if (wsList && wsList.length > 0) {
      setCurrentWorkspace(wsList[0]);
      localStorage.setItem('collabspace_current_workspace', wsList[0]._id);
      localStorage.setItem('collabspace_current_workspace_obj', JSON.stringify(wsList[0]));
    }

    return res.data;
  };

  const register = async (name, email, password, invitationToken = null) => {
    const res = await authAPI.register({ name, email, password, invitationToken });
    const { token: newToken, user: userData, defaultWorkspace } = res.data;

    setToken(newToken);
    setUser(userData);

    localStorage.setItem('collabspace_token', newToken);
    localStorage.setItem('collabspace_user', JSON.stringify(userData));

    if (defaultWorkspace) {
      const wsObj = { ...defaultWorkspace, role: 'owner' };
      setWorkspaces([wsObj]);
      setCurrentWorkspace(wsObj);
      localStorage.setItem('collabspace_current_workspace', wsObj._id);
      localStorage.setItem('collabspace_current_workspace_obj', JSON.stringify(wsObj));
    }

    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspace(null);
    localStorage.removeItem('collabspace_token');
    localStorage.removeItem('collabspace_user');
    localStorage.removeItem('collabspace_current_workspace');
    localStorage.removeItem('collabspace_current_workspace_obj');
  };

  const switchWorkspace = (workspace) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem('collabspace_current_workspace', workspace._id);
    localStorage.setItem('collabspace_current_workspace_obj', JSON.stringify(workspace));
  };

  const refreshWorkspaces = async () => {
    try {
      const res = await workspaceAPI.getMyWorkspaces();
      setWorkspaces(res.data);
      if (res.data.length > 0 && (!currentWorkspace || !res.data.some((w) => w._id === currentWorkspace._id))) {
        switchWorkspace(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to refresh workspaces:', err);
    }
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedData };
      localStorage.setItem('collabspace_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        workspaces,
        currentWorkspace,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
        switchWorkspace,
        refreshWorkspaces,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
