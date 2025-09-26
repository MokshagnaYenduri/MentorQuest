import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Text,
  Title,
  Badge,
  Group,
  Stack,
  Button,
  TextInput,
  Select,
  Table,
  Avatar,
  Alert,
  Pagination,
  Modal,
  Paper
} from '@mantine/core';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminUsers() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, total: 1 });
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    sortBy: 'totalPoints',
    sortOrder: 'desc'
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsModal, setUserDetailsModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 20,
        ...filters
      });

      const response = await axios.get(`/admin/users?${params}`);
      setUsers(response.data.users || []);
      setPagination(response.data.pagination || { current: 1, total: 1 });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await axios.get(`/admin/users/${userId}`);
      setSelectedUser(response.data);
      setUserDetailsModal(true);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    return role === 'admin' ? 'red' : 'blue';
  };

  return (
    <Container size="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>User Management</Title>
          <Text c="dimmed">Monitor and manage student accounts</Text>
        </div>
        
        <Group>
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/questions')}>
            Questions
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/badges')}>
            Badges
          </Button>
          <Button variant="filled" color="red" onClick={handleLogout}>
            Logout
          </Button>
        </Group>
      </Group>

      {/* Filters */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <Group>
          <TextInput
            placeholder="Search by name or email"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={{ flex: 1 }}
          />
          
          <Select
            placeholder="Role"
            value={filters.role}
            onChange={(value) => handleFilterChange('role', value)}
            data={[
              { value: '', label: 'All Roles' },
              { value: 'student', label: 'Students' },
              { value: 'admin', label: 'Admins' }
            ]}
            style={{ width: 150 }}
          />

          <Select
            placeholder="Sort by"
            value={filters.sortBy}
            onChange={(value) => handleFilterChange('sortBy', value)}
            data={[
              { value: 'totalPoints', label: 'Points' },
              { value: 'currentStreak', label: 'Streak' },
              { value: 'createdAt', label: 'Join Date' },
              { value: 'name', label: 'Name' }
            ]}
            style={{ width: 150 }}
          />

          <Select
            placeholder="Order"
            value={filters.sortOrder}
            onChange={(value) => handleFilterChange('sortOrder', value)}
            data={[
              { value: 'desc', label: 'Descending' },
              { value: 'asc', label: 'Ascending' }
            ]}
            style={{ width: 120 }}
          />
        </Group>
      </Card>

      {/* Users Table */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        {loading ? (
          <Alert>Loading users...</Alert>
        ) : users.length > 0 ? (
          <>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Points</Table.Th>
                  <Table.Th>Streak</Table.Th>
                  <Table.Th>Badges</Table.Th>
                  <Table.Th>Joined</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((user) => (
                  <Table.Tr key={user._id}>
                    <Table.Td>
                      <Group>
                        <Avatar 
                          size="md" 
                          radius="xl" 
                          src={user.avatar}
                        />
                        <div>
                          <Text fw={500}>{user.name}</Text>
                          <Text size="xs" c="dimmed">{user.email}</Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{user.totalPoints || 0}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <span style={{ fontSize: '14px' }}>🔥</span>
                        <Text>{user.currentStreak || 0} days</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text>{user.badges?.length || 0}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => fetchUserDetails(user._id)}
                      >
                        View Details
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {/* Pagination */}
            {pagination.total > 1 && (
              <Group justify="center" mt="xl">
                <Pagination
                  value={pagination.current}
                  onChange={handlePageChange}
                  total={pagination.total}
                />
              </Group>
            )}
          </>
        ) : (
          <Alert>
            <Text>No users found matching your criteria.</Text>
          </Alert>
        )}
      </Card>

      {/* User Details Modal */}
      <Modal
        opened={userDetailsModal}
        onClose={() => setUserDetailsModal(false)}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <Stack>
            {/* User Info */}
            <Paper p="md" withBorder>
              <Group>
                <Avatar size="lg" radius="xl" src={selectedUser.user?.avatar} />
                <div>
                  <Title order={3}>{selectedUser.user?.name}</Title>
                  <Text c="dimmed">{selectedUser.user?.email}</Text>
                  <Group gap="xs" mt="xs">
                    <Badge color={getRoleBadgeColor(selectedUser.user?.role)}>
                      {selectedUser.user?.role}
                    </Badge>
                    <Badge color="blue">{selectedUser.user?.totalPoints || 0} points</Badge>
                    <Badge color="orange">{selectedUser.user?.currentStreak || 0} day streak</Badge>
                  </Group>
                </div>
              </Group>
            </Paper>

            {/* Statistics */}
            <Paper p="md" withBorder>
              <Title order={4} mb="md">Statistics</Title>
              <Group>
                <div>
                  <Text size="sm" c="dimmed">Problems Solved</Text>
                  <Text fw={700} size="lg">{selectedUser.statistics?.totalSolved || 0}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Problems Attempted</Text>
                  <Text fw={700} size="lg">{selectedUser.statistics?.totalAttempted || 0}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Max Streak</Text>
                  <Text fw={700} size="lg">{selectedUser.user?.maxStreak || 0} days</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Badges</Text>
                  <Text fw={700} size="lg">{selectedUser.user?.badges?.length || 0}</Text>
                </div>
              </Group>
            </Paper>

            {/* Topic Progress */}
            {selectedUser.statistics?.topicStats?.length > 0 && (
              <Paper p="md" withBorder>
                <Title order={4} mb="md">Topic Progress</Title>
                <Stack gap="xs">
                  {selectedUser.statistics.topicStats.slice(0, 5).map((topic, index) => (
                    <Group key={index} justify="space-between">
                      <Text size="sm">{topic.topic}</Text>
                      <Text size="sm">
                        {topic.solvedQuestions}/{topic.totalQuestions} solved
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            )}

            {/* Recent Activity */}
            {selectedUser.recentActivity?.length > 0 && (
              <Paper p="md" withBorder>
                <Title order={4} mb="md">Recent Activity</Title>
                <Stack gap="xs">
                  {selectedUser.recentActivity.slice(0, 5).map((activity, index) => (
                    <Group key={index} justify="space-between">
                      <div>
                        <Text size="sm" fw={500}>
                          {activity.activityType.replace('_', ' ')}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {activity.details?.questionId?.title || 
                           activity.details?.badgeId?.name || 
                           'System activity'}
                        </Text>
                      </div>
                      <Text size="xs" c="dimmed">
                        {new Date(activity.activityDate).toLocaleDateString()}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        )}
      </Modal>
    </Container>
  );
}