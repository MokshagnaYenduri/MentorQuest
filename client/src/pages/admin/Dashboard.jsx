import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  Text,
  Title,
  Badge,
  Group,
  Stack,
  Paper,
  SimpleGrid,
  ActionIcon,
  Menu,
  Button,
  Table,
  Progress,
  Avatar,
  Alert
} from '@mantine/core';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/admin/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <Container>Loading...</Container>;
  }

  const { overview, recentActivity, topPerformers, popularQuestions, submissionTrends } = dashboardData || {};

  return (
    <Container size="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Admin Dashboard</Title>
          <Text c="dimmed">Welcome back, {user?.name}</Text>
        </div>
        
        <Group>
          <Button variant="outline" onClick={() => navigate('/admin/questions')}>
            Manage Questions
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            Manage Users
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/badges')}>
            Manage Badges
          </Button>
          <Button variant="filled" color="red" onClick={handleLogout}>
            Logout
          </Button>
        </Group>
      </Group>

      {/* Overview Stats */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
            Total Students
          </Text>
          <Text fw={700} size="xl">
            {overview?.totalUsers || 0}
          </Text>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
            Total Questions
          </Text>
          <Text fw={700} size="xl">
            {overview?.totalQuestions || 0}
          </Text>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
            Total Submissions
          </Text>
          <Text fw={700} size="xl">
            {overview?.totalSubmissions || 0}
          </Text>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
            Active Badges
          </Text>
          <Text fw={700} size="xl">
            {overview?.totalBadges || 0}
          </Text>
        </Card>
      </SimpleGrid>

      <Grid>
        {/* Top Performers */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">Top Performers</Title>
            {topPerformers?.length > 0 ? (
              <Stack gap="xs">
                {topPerformers.slice(0, 5).map((performer, index) => (
                  <Paper key={index} p="xs" withBorder>
                    <Group justify="space-between">
                      <Group>
                        <Avatar size="sm" radius="xl" />
                        <div>
                          <Text fw={500}>{performer.name}</Text>
                          <Text size="xs" c="dimmed">{performer.email}</Text>
                        </div>
                      </Group>
                      <div style={{ textAlign: 'right' }}>
                        <Text fw={500}>{performer.totalPoints} pts</Text>
                        <Text size="xs" c="dimmed">{performer.currentStreak} day streak</Text>
                      </div>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" size="sm">No performance data available</Text>
            )}
          </Card>
        </Grid.Col>

        {/* Popular Questions */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">Popular Questions</Title>
            {popularQuestions?.length > 0 ? (
              <Stack gap="xs">
                {popularQuestions.slice(0, 5).map((question, index) => (
                  <Paper key={index} p="xs" withBorder>
                    <Group justify="space-between">
                      <div>
                        <Text fw={500} lineClamp={1}>{question.question?.title}</Text>
                        <Group gap="xs">
                          <Badge size="xs" color="blue">
                            {question.submissionCount} submissions
                          </Badge>
                          <Badge size="xs" color="green">
                            {Math.round(question.successRate * 100)}% success
                          </Badge>
                        </Group>
                      </div>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" size="sm">No submission data available</Text>
            )}
          </Card>
        </Grid.Col>

        {/* Recent Activity */}
        <Grid.Col span={12}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">Recent Activity</Title>
            {recentActivity?.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Student</Table.Th>
                    <Table.Th>Activity</Table.Th>
                    <Table.Th>Details</Table.Th>
                    <Table.Th>Time</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {recentActivity.slice(0, 10).map((activity, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>
                        <Group>
                          <Avatar size="sm" radius="xl" />
                          <Text size="sm">{activity.student?.name}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light">
                          {activity.activityType.replace('_', ' ')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {activity.details?.questionId?.title || 
                           activity.details?.badgeId?.name || 
                           'System activity'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {new Date(activity.activityDate).toLocaleString()}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed" size="sm">No recent activity</Text>
            )}
          </Card>
        </Grid.Col>

        {/* Submission Trends */}
        {submissionTrends?.length > 0 && (
          <Grid.Col span={12}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={4} mb="md">Submission Trends (Last 30 Days)</Title>
              <Text c="dimmed" size="sm" mb="md">
                Daily submission and success rate overview
              </Text>
              {/* Simple text representation of trends */}
              <Stack gap="xs">
                {submissionTrends.slice(-7).map((trend, index) => (
                  <Paper key={index} p="xs" withBorder>
                    <Group justify="space-between">
                      <Text size="sm">{trend._id}</Text>
                      <Group gap="lg">
                        <Text size="sm">{trend.count} submissions</Text>
                        <Text size="sm">{trend.solved} solved</Text>
                        <Progress 
                          value={(trend.solved / trend.count) * 100} 
                          size="sm" 
                          style={{ width: 100 }}
                        />
                      </Group>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Card>
          </Grid.Col>
        )}
      </Grid>
    </Container>
  );
}