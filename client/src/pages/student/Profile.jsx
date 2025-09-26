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
  Avatar,
  Progress,
  Paper,
  SimpleGrid,
  Button,
  Table,
  Tabs,
  Alert
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/user/profile');
      setProfileData(response.data);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'cakewalk': 'green',
      'easy': 'blue',
      'easy-medium': 'yellow',
      'medium': 'orange',
      'hard': 'red'
    };
    return colors[difficulty] || 'gray';
  };

  const getActivityTitle = (activityType) => {
    const titles = {
      'question_solved': 'Question Solved',
      'question_attempted': 'Question Attempted',
      'daily_login': 'Daily Login',
      'streak_maintained': 'Streak Maintained',
      'badge_earned': 'Badge Earned'
    };
    return titles[activityType] || 'Activity';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <Container>Loading...</Container>;
  }

  const { user: userProfile, statistics, recentActivity } = profileData || {};
  const { totalSolved, totalAttempted, difficultyBreakdown, topicStats } = statistics || {};

  return (
    <Container size="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Group>
          <Avatar size={60} radius="xl" src={user?.avatar} />
          <div>
            <Title order={1}>{userProfile?.name}</Title>
            <Text c="dimmed">{userProfile?.email}</Text>
            <Group gap="xs" mt="xs">
              <Badge color="blue">{userProfile?.totalPoints || 0} points</Badge>
              <Badge color="orange">{userProfile?.currentStreak || 0} day streak</Badge>
            </Group>
          </div>
        </Group>
        
        <Group>
          <Button variant="outline" onClick={() => navigate('/student/dashboard')}>
            Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/student/questions')}>
            Questions
          </Button>
          <Button variant="outline" onClick={() => navigate('/student/leaderboard')}>
            Leaderboard
          </Button>
          <Button variant="filled" color="red" onClick={handleLogout}>
            Logout
          </Button>
        </Group>
      </Group>

      <Grid>
        {/* Statistics Overview */}
        <Grid.Col span={12}>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                Problems Solved
              </Text>
              <Text fw={700} size="xl">
                {totalSolved || 0}
              </Text>
              <Text size="xs" c="dimmed">
                out of {totalAttempted || 0} attempted
              </Text>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                Total Points
              </Text>
              <Text fw={700} size="xl">
                {userProfile?.totalPoints || 0}
              </Text>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                Current Streak
              </Text>
              <Text fw={700} size="xl">
                {userProfile?.currentStreak || 0} days
              </Text>
              <Text size="xs" c="dimmed">
                Max: {userProfile?.maxStreak || 0} days
              </Text>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                Badges Earned
              </Text>
              <Text fw={700} size="xl">
                {userProfile?.badges?.length || 0}
              </Text>
            </Card>
          </SimpleGrid>
        </Grid.Col>

        {/* Difficulty Breakdown */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">Difficulty Breakdown</Title>
            {difficultyBreakdown?.length > 0 ? (
              <Stack gap="md">
                {difficultyBreakdown.map((item) => (
                  <div key={item._id}>
                    <Group justify="space-between" mb="xs">
                      <Badge color={getDifficultyColor(item._id)}>
                        {item._id}
                      </Badge>
                      <Text size="sm">{item.count} solved</Text>
                    </Group>
                    <Progress
                      value={item.count}
                      size="sm"
                      color={getDifficultyColor(item._id)}
                    />
                  </div>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" size="sm">No problems solved yet</Text>
            )}
          </Card>
        </Grid.Col>

        {/* Topic Statistics */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">Topic Progress</Title>
            {topicStats?.length > 0 ? (
              <Stack gap="xs" style={{ maxHeight: '300px', overflow: 'auto' }}>
                {topicStats.map((topic, index) => (
                  <Paper key={index} p="sm" withBorder>
                    <Group justify="space-between" mb="xs">
                      <Text fw={500}>{topic.topic}</Text>
                      <Text size="sm">
                        {topic.solvedQuestions}/{topic.totalQuestions}
                      </Text>
                    </Group>
                    <Progress
                      value={topic.totalQuestions > 0 ? (topic.solvedQuestions / topic.totalQuestions) * 100 : 0}
                      size="sm"
                      color="blue"
                    />
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" size="sm">No topic data available</Text>
            )}
          </Card>
        </Grid.Col>

        {/* Badges */}
        <Grid.Col span={12}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">Badges & Achievements</Title>
            {userProfile?.badges?.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
                {userProfile.badges.map((badge, index) => (
                  <Paper key={index} p="md" withBorder radius="md">
                    <Group>
                      <div style={{ fontSize: '24px' }}>🏆</div>
                      <div>
                        <Text fw={500}>{badge.badgeId?.name}</Text>
                        <Text size="xs" c="dimmed">
                          {badge.badgeId?.description}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Earned: {new Date(badge.earnedDate).toLocaleDateString()}
                        </Text>
                      </div>
                    </Group>
                  </Paper>
                ))}
              </SimpleGrid>
            ) : (
              <Alert>
                <Text>No badges earned yet. Keep solving problems to earn your first badge!</Text>
              </Alert>
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
                    <Table.Th>Activity</Table.Th>
                    <Table.Th>Details</Table.Th>
                    <Table.Th>Points</Table.Th>
                    <Table.Th>Date</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {recentActivity.slice(0, 10).map((activity, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>
                        <Badge variant="light">
                          {getActivityTitle(activity.activityType)}
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
                        {activity.details?.pointsEarned > 0 && (
                          <Text size="sm" c="green">
                            +{activity.details.pointsEarned}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {new Date(activity.activityDate).toLocaleDateString()}
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
      </Grid>
    </Container>
  );
}