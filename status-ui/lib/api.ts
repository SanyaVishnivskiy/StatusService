const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SignupRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

export interface Group {
  _id: string;
  name: string;
  joinKeyHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  username: string;
  usernameLower: string;
  groups: Array<{
    groupId: string;
    data: {
      status: {
        state: 'NOT_AVAILABLE' | 'AVAILABLE' | 'READY' | 'DONT_WANT';
        gameIds: string[];
        message: string | null;
        updatedAt: string;
      };
    };
  }>;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupStatus {
  user: {
    id: string;
    username: string;
  };
  state: 'NOT_AVAILABLE' | 'AVAILABLE' | 'READY' | 'DONT_WANT';
  gameIds: string[];
  message: string | null;
  updatedAt: string;
}

async function request<T>(
  endpoint: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token, ...fetchOptions } = options || {};

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (fetchOptions.headers && typeof fetchOptions.headers === 'object' && !Array.isArray(fetchOptions.headers)) {
    Object.assign(headers, fetchOptions.headers);
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Auth endpoints
export const authApi = {
  signup: (data: SignupRequest) =>
    request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginRequest) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: (token: string) =>
    request<{ ok: boolean }>('/auth/logout', {
      method: 'POST',
      token,
    }),
};

// Groups endpoints
export const groupsApi = {
  getAll: (token: string) =>
    request<Group[]>('/groups', {
      token,
    }),

  getMyGroups: (token: string) =>
    request<Group[]>('/groups/me', {
      token,
    }),

  join: (groupId: string, joinKey: string, token: string) =>
    request<Group>(`/groups/${groupId}/join`, {
      method: 'POST',
      body: JSON.stringify({ joinKey }),
      token,
    }),
};

// Users endpoints
export const usersApi = {
  getGroupUsers: (groupId: string, token: string) =>
    request<User[]>(`/groups/${groupId}/users`, {
      token,
    }),
};

// Statuses endpoints
export const statusesApi = {
  getGroupStatuses: (groupId: string, token: string) =>
    request<GroupStatus[]>(`/groups/${groupId}/statuses`, {
      token,
    }),

  updateMyStatus: (
    groupId: string,
    data: {
      state: 'NOT_AVAILABLE' | 'AVAILABLE' | 'READY' | 'DONT_WANT';
      gameIds?: string[];
      message?: string;
    },
    token: string,
  ) =>
    request<GroupStatus>(`/groups/${groupId}/statuses/me`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),
};
