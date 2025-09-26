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
  Textarea,
  Modal,
  Table,
  Alert,
  Switch,
  Grid
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminBadges() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      icon: '',
      criteria: {
        type: 'problems_solved',
        value: 1,
        timeframe: 'all_time'
      },
      points: 100,
      isActive: true
    },
    validate: {
      name: (value) => (value.length < 3 ? 'Name must be at least 3 characters' : null),
      description: (value) => (value.length < 10 ? 'Description must be at least 10 characters' : null),
      'criteria.value': (value) => (value < 1 ? 'Value must be at least 1' : null),
      points: (value) => (value < 1 ? 'Points must be at least 1' : null)
    }
  });

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/badges');
      setBadges(response.data || []);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingBadge) {
        await axios.put(`/admin/badges/${editingBadge._id}`, values);
        notifications.show({
          title: 'Success',
          message: 'Badge updated successfully',
          color: 'green'
        });
      } else {
        await axios.post('/admin/badges', values);
        notifications.show({
          title: 'Success',
          message: 'Badge created successfully',
          color: 'green'
        });
      }
      
      setModalOpened(false);
      setEditingBadge(null);
      form.reset();
      fetchBadges();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to save badge',
        color: 'red'
      });
    }
  };

  const handleEdit = (badge) => {
    setEditingBadge(badge);
    form.setValues({
      name: badge.name,
      description: badge.description,
      icon: badge.icon || '',
      criteria: badge.criteria,
      points: badge.points,
      isActive: badge.isActive
    });
    setModalOpened(true);
  };

  const handleDelete = async (badgeId) => {
    if (window.confirm('Are you sure you want to delete this badge? This will remove it from all users.')) {
      try {
        await axios.delete(`/admin/badges/${badgeId}`);
        notifications.show({
          title: 'Success',
          message: 'Badge deleted successfully',
          color: 'green'
        });
        fetchBadges();
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to delete badge',
          color: 'red'
        });
      }
    }
  };

  const openCreateModal = () => {
    setEditingBadge(null);
    form.reset();
    setModalOpened(true);
  };

  const getCriteriaTypeLabel = (type) => {
    const labels = {
      'problems_solved': 'Problems Solved',
      'streak': 'Streak Days',
      'contest_participation': 'Contest Participation',
      'daily_activity': 'Daily Activity'
    };
    return labels[type] || type;
  };

  const getTimeframeLabel = (timeframe) => {
    const labels = {
      'daily': 'Daily',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'all_time': 'All Time'
    };
    return labels[timeframe] || timeframe;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container size="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Badge Management</Title>
          <Text c="dimmed">Create and manage achievement badges</Text>
        </div>
        
        <Group>
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/questions')}>
            Questions
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            Users
          </Button>
          <Button onClick={openCreateModal}>
            Create Badge
          </Button>
          <Button variant="filled" color="red" onClick={handleLogout}>
            Logout
          </Button>
        </Group>
      </Group>

      {/* Badges Table */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        {loading ? (
          <Alert>Loading badges...</Alert>
        ) : badges.length > 0 ? (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Badge</Table.Th>
                <Table.Th>Criteria</Table.Th>
                <Table.Th>Points</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {badges.map((badge) => (
                <Table.Tr key={badge._id}>
                  <Table.Td>
                    <Group>
                      <div style={{ fontSize: '24px' }}>
                        {badge.icon || '🏆'}
                      </div>
                      <div>
                        <Text fw={500}>{badge.name}</Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {badge.description}
                        </Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <div>
                      <Text size="sm" fw={500}>
                        {getCriteriaTypeLabel(badge.criteria.type)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {badge.criteria.value} ({getTimeframeLabel(badge.criteria.timeframe)})
                      </Text>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="blue">
                      {badge.points} pts
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={badge.isActive ? 'green' : 'gray'}>
                      {badge.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {new Date(badge.createdAt).toLocaleDateString()}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => handleEdit(badge)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(badge._id)}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Alert>
            <Text>No badges created yet.</Text>
            <Button variant="light" mt="sm" onClick={openCreateModal}>
              Create First Badge
            </Button>
          </Alert>
        )}
      </Card>

      {/* Create/Edit Badge Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingBadge ? 'Edit Badge' : 'Create New Badge'}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Badge Name"
              placeholder="Enter badge name"
              required
              {...form.getInputProps('name')}
            />

            <Textarea
              label="Description"
              placeholder="Enter badge description"
              required
              minRows={2}
              {...form.getInputProps('description')}
            />

            <TextInput
              label="Icon (Emoji)"
              placeholder="🏆"
              {...form.getInputProps('icon')}
            />

            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Criteria Type"
                  required
                  data={[
                    { value: 'problems_solved', label: 'Problems Solved' },
                    { value: 'streak', label: 'Streak Days' },
                    { value: 'contest_participation', label: 'Contest Participation' },
                    { value: 'daily_activity', label: 'Daily Activity' }
                  ]}
                  {...form.getInputProps('criteria.type')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Target Value"
                  type="number"
                  required
                  min={1}
                  {...form.getInputProps('criteria.value')}
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Timeframe"
                  required
                  data={[
                    { value: 'all_time', label: 'All Time' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' }
                  ]}
                  {...form.getInputProps('criteria.timeframe')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Points Reward"
                  type="number"
                  required
                  min={1}
                  {...form.getInputProps('points')}
                />
              </Grid.Col>
            </Grid>

            <Switch
              label="Active"
              description="Whether this badge is currently available to earn"
              {...form.getInputProps('isActive', { type: 'checkbox' })}
            />

            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setModalOpened(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingBadge ? 'Update Badge' : 'Create Badge'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}