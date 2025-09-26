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
  Progress,
  Avatar,
  ActionIcon,
  Menu,
  Button,
  Paper,
  Timeline,
  Alert
} from '@mantine/core';
// Icons temporarily removed - install @tabler/icons-react to restore
const IconTrophy = () => '🏆';
const IconFlame = () => '🔥';
const IconCoin = () => '🪙';
const IconChevronDown = () => '⬇️';
const IconLogout = () => '🚪';
const IconUser = () => '👤';
const IconCode = () => '💻';
const IconCalendar = () => '📅';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/user/dashboard');
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

  const { user: userStats, questionOfTheDay, todayActivities, recentSubmissions } = dashboardData || {};

  return (
    <Container size="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Group>
          <Avatar size={50} radius="xl" src={user?.avatar} />
          <div>
            <Title order={2}>Welcome back, {user?.name}!</Title>
            <Text c="dimmed">Ready to solve some problems today?</Text>
          </div>
        </Group>
        
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="outline" size="lg">
              <span><IconChevronDown /></span>
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<span><IconUser /></span>}
              onClick={() => navigate('/student/profile')}
            >
              Profile
            </Menu.Item>
            <Menu.Item
              leftSection={<span><IconLogout /></span>}
              onClick={handleLogout}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Grid>
        {/* Stats Cards */}
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Total Points</Text>
              <span style={{ fontSize: '20px' }}><IconCoin /></span>
            </Group>
            <Title order={2}>{userStats?.totalPoints || 0}</Title>
            <Text size="sm" c="dimmed">Rank #{userStats?.rank || 'N/A'}</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Current Streak</Text>
              <span style={{ fontSize: '20px' }}><IconFlame /></span>
            </Group>
            <Title order={2}>{userStats?.currentStreak || 0} days</Title>
            <Text size="sm" c="dimmed">Max: {userStats?.maxStreak || 0} days</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Badges Earned</Text>
              <span style={{ fontSize: '20px' }}><IconTrophy /></span>
            </Group>
            <Title order={2}>{userStats?.badges?.length || 0}</Title>
            <Group gap="xs" mt="xs">
              {userStats?.badges?.slice(0, 3).map((badge, index) => (
                <Badge key={index} variant="light" size="sm">
                  {badge.badgeId?.name}
                </Badge>
              ))}
              {userStats?.badges?.length > 3 && (
                <Badge variant="outline" size="sm">
                  +{userStats.badges.length - 3} more
                </Badge>
              )}
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Quick Actions</Text>
            </Group>
            <Stack gap="xs">
              <Button
                variant="light"
                size="xs"
                onClick={() => navigate('/student/questions')}
              >
                Browse Questions
              </Button>
              <Button
                variant="light"
                size="xs"
                onClick={() => navigate('/student/leaderboard')}
              >
                View Leaderboard
              </Button>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Question of the Day */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} mb="md">
              <Group>
                <span style={{ fontSize: '20px' }}><IconCalendar /></span>
                Question of the Day
              </Group>
            </Title>
            
            {questionOfTheDay ? (
              <Stack>
                <Group justify="space-between">
                  <Text fw={500}>{questionOfTheDay.title}</Text>
                  <Badge color={getDifficultyColor(questionOfTheDay.difficulty)}>
                    {questionOfTheDay.difficulty}
                  </Badge>
                </Group>
                <Text c="dimmed" size="sm" lineClamp={3}>
                  {questionOfTheDay.description}
                </Text>
                <Group gap="xs">
                  {questionOfTheDay.tags?.map(tag => (
                    <Badge key={tag} variant="outline" size="sm">{tag}</Badge>
                  ))}
                </Group>
                <Button
                  onClick={() => navigate(`/student/questions/${questionOfTheDay._id}`)}
                  leftSection={<span><IconCode /></span>}
                >
                  Solve Now ({questionOfTheDay.points} points)
                </Button>
              </Stack>
            ) : (
              <Alert>
                <Text>No question of the day available yet. Check back later!</Text>
              </Alert>
            )}
          </Card>
        </Grid.Col>

        {/* Today's Activity */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">Today's Activity</Title>
            {todayActivities?.length > 0 ? (
              <Timeline active={todayActivities.length}>
                {todayActivities.map((activity, index) => (
                  <Timeline.Item
                    key={index}
                    title={getActivityTitle(activity.activityType)}
                    bullet={getActivityIcon(activity.activityType)}
                  >
                    <Text size="xs" c="dimmed">
                      {activity.details?.questionId?.title || 'System activity'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {new Date(activity.activityDate).toLocaleTimeString()}
                    </Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Text c="dimmed" size="sm">No activity today yet. Start solving!</Text>
            )}
          </Card>
        </Grid.Col>

        {/* Recent Submissions */}
        <Grid.Col span={12}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">Recent Submissions</Title>
            {recentSubmissions?.length > 0 ? (
              <Stack gap="xs">
                {recentSubmissions.slice(0, 5).map((submission, index) => (
                  <Paper key={index} p="xs" withBorder>
                    <Group justify="space-between">
                      <Group>
                        <Text fw={500}>{submission.question?.title}</Text>
                        <Badge 
                          color={submission.status === 'solved' ? 'green' : 'orange'}
                          size="sm"
                        >
                          {submission.status}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {submission.language}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {new Date(submission.submissionTime).toLocaleDateString()}
                      </Text>
                    </Group>
                  </Paper>
                ))}
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => navigate('/student/profile')}
                >
                  View All Submissions
                </Button>
              </Stack>
            ) : (
              <Text c="dimmed" size="sm">No submissions yet. Start coding!</Text>
            )}
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

// Helper functions
function getDifficultyColor(difficulty) {
  const colors = {
    'cakewalk': 'green',
    'easy': 'blue',
    'easy-medium': 'yellow',
    'medium': 'orange',
    'hard': 'red'
  };
  return colors[difficulty] || 'gray';
}

function getActivityTitle(activityType) {
  const titles = {
    'question_solved': 'Question Solved',
    'question_attempted': 'Question Attempted',
    'daily_login': 'Daily Login',
    'streak_maintained': 'Streak Maintained',
    'badge_earned': 'Badge Earned'
  };
  return titles[activityType] || 'Activity';
}

function getActivityIcon(activityType) {
  switch (activityType) {
    case 'question_solved':
      return <span style={{ fontSize: '12px' }}><IconCode /></span>;
    case 'badge_earned':
      return <span style={{ fontSize: '12px' }}><IconTrophy /></span>;
    case 'streak_maintained':
      return <span style={{ fontSize: '12px' }}><IconFlame /></span>;
    default:
      return <span style={{ fontSize: '12px' }}><IconCalendar /></span>;
  }
}