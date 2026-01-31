'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/lib/protected-route';
import { usersApi, User, statusesApi, GroupStatus } from '@/lib/api';

function GroupDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  const groupId = params.groupId as string;

  const [statuses, setStatuses] = useState<GroupStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !groupId) return;

      try {
        setIsLoading(true);
        const groupStatuses = await statusesApi.getGroupStatuses(groupId, token);
        setStatuses(groupStatuses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load group details');
        console.error('Failed to fetch group details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, groupId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading group details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => router.push('/groups')}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => router.push('/groups')}
          className="mb-8 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          ← Back to Groups
        </button>

        <h1 className="mb-8 text-4xl font-bold text-gray-900">Group Members</h1>

        {statuses.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-gray-600">No members in this group yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {statuses.map((status) => (
              <div key={status.user.id} className="rounded-lg bg-white p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{status.user.username}</h3>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Status:</span>{' '}
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                            status.state === 'AVAILABLE'
                              ? 'bg-green-100 text-green-800'
                              : status.state === 'READY'
                                ? 'bg-blue-100 text-blue-800'
                                : status.state === 'DONT_WANT'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {status.state}
                        </span>
                      </p>
                      {status.message && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Message:</span> {status.message}
                        </p>
                      )}
                      {status.updatedAt && (
                        <p className="text-xs text-gray-500">
                          Updated: {new Date(status.updatedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GroupDetailsPage() {
  return (
    <ProtectedRoute>
      <GroupDetailsContent />
    </ProtectedRoute>
  );
}
