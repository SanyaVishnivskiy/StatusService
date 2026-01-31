'use client';

import { groupsApi, Group } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/lib/protected-route';

function JoinGroupModal({
  group,
  onClose,
  onSuccess,
}: {
  group: Group;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { token } = useAuth();
  const [joinKey, setJoinKey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError('');
    setIsSubmitting(true);

    try {
      await groupsApi.join(group._id, joinKey, token);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Join {group.name}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="joinKey" className="block text-sm font-medium text-gray-700">
              Secret Key
            </label>
            <input
              id="joinKey"
              type="password"
              value={joinKey}
              onChange={(e) => setJoinKey(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter the secret key"
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {isSubmitting ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GroupsPageContent() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroupIds, setUserGroupIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        setIsLoading(true);
        const allGroups = await groupsApi.getAll(token);
        const myGroups = await groupsApi.getMyGroups(token);
        
        setGroups(allGroups);
        setUserGroupIds(myGroups.map(g => g._id));
      } catch (err) {
        console.error('Failed to fetch groups:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleGroupClick = (group: Group) => {
    const isJoined = userGroupIds.includes(group._id);
    if (isJoined) {
      router.push(`/groups/${group._id}`);
    } else {
      setSelectedGroup(group);
    }
  };

  const handleJoinSuccess = async () => {
    if (!token) return;
    try {
      const myGroups = await groupsApi.getMyGroups(token);
      setUserGroupIds(myGroups.map(g => g._id));
    } catch (err) {
      console.error('Failed to refresh groups:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading groups...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-gray-900">Groups</h1>
          <button
            onClick={handleLogout}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-gray-600">No groups available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              const isJoined = userGroupIds.includes(group._id);
              return (
                <button
                  key={group._id}
                  onClick={() => handleGroupClick(group)}
                  className="rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-left">
                      <h2 className="text-xl font-semibold text-gray-900">{group.name}</h2>
                      <p className="mt-2 text-sm text-gray-600">
                        {isJoined ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            Joined
                          </span>
                        ) : (
                          <span className="text-gray-400">Not joined</span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedGroup && (
        <JoinGroupModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );
}

export default function GroupsPage() {
  return (
    <ProtectedRoute>
      <GroupsPageContent />
    </ProtectedRoute>
  );
}
