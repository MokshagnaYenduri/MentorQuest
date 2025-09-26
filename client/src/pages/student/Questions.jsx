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
  TextInput,
  Select,
  MultiSelect,
  Button,
  Pagination,
  Alert,
  ActionIcon,
  Menu
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function Questions() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, total: 1 });
  const [filters, setFilters] = useState({
    search: '',
    difficulty: '',
    status: '',
    tags: []
  });
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    fetchQuestions();
    fetchTags();
  }, [filters, pagination.current]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 12,
        ...filters,
        tags: filters.tags.join(',')
      });

      const response = await axios.get(`/user/questions?${params}`);
      setQuestions(response.data.questions || []);
      setPagination(response.data.pagination || { current: 1, total: 1 });
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      // We'll get tags from questions for now
      const response = await axios.get('/user/questions?limit=1000');
      const allTags = new Set();
      response.data.questions?.forEach(q => {
        q.tags?.forEach(tag => allTags.add(tag));
      });
      setAvailableTags(Array.from(allTags).map(tag => ({ value: tag, label: tag })));
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
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

  const getStatusColor = (status) => {
    const colors = {
      'solved': 'green',
      'attempted': 'orange',
      'not_attempted': 'gray'
    };
    return colors[status] || 'gray';
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
          <Title order={1}>Questions</Title>
          <Text c="dimmed">Browse and solve coding problems</Text>
        </div>
        
        <Group>
          <Button variant="outline" onClick={() => navigate('/student/dashboard')}>
            Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/student/leaderboard')}>
            Leaderboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/student/profile')}>
            Profile
          </Button>
          <Button variant="filled" color="red" onClick={handleLogout}>
            Logout
          </Button>
        </Group>
      </Group>

      {/* Filters */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <TextInput
              label="Search"
              placeholder="Search questions..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <Select
              label="Difficulty"
              placeholder="All"
              value={filters.difficulty}
              onChange={(value) => handleFilterChange('difficulty', value)}
              data={[
                { value: '', label: 'All' },
                { value: 'cakewalk', label: 'Cakewalk' },
                { value: 'easy', label: 'Easy' },
                { value: 'easy-medium', label: 'Easy-Medium' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' }
              ]}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <Select
              label="Status"
              placeholder="All"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              data={[
                { value: '', label: 'All' },
                { value: 'solved', label: 'Solved' },
                { value: 'attempted', label: 'Attempted' },
                { value: 'not_attempted', label: 'Not Attempted' }
              ]}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <MultiSelect
              label="Tags"
              placeholder="Select tags"
              value={filters.tags}
              onChange={(value) => handleFilterChange('tags', value)}
              data={availableTags}
              searchable
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <div style={{ height: '24px' }}></div>
            <Button onClick={fetchQuestions} loading={loading} fullWidth>
              Apply Filters
            </Button>
          </Grid.Col>
        </Grid>
      </Card>

      {/* Questions Grid */}
      {loading ? (
        <Alert>Loading questions...</Alert>
      ) : questions.length > 0 ? (
        <>
          <Grid>
            {questions.map((question) => (
              <Grid.Col key={question._id} span={{ base: 12, sm: 6, lg: 4 }}>
                <Card
                  shadow="sm"
                  padding="lg"
                  radius="md"
                  withBorder
                  style={{ height: '100%', cursor: 'pointer' }}
                  onClick={() => navigate(`/student/questions/${question._id}`)}
                >
                  <Stack>
                    <Group justify="space-between">
                      <Text fw={500} lineClamp={1}>
                        {question.title}
                      </Text>
                      <Badge color={getStatusColor(question.studentStatus)}>
                        {question.studentStatus?.replace('_', ' ')}
                      </Badge>
                    </Group>

                    <Text size="sm" c="dimmed" lineClamp={3}>
                      {question.description}
                    </Text>

                    <Group justify="space-between">
                      <Badge color={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                      <Text size="sm" c="blue">
                        {question.points} points
                      </Text>
                    </Group>

                    <Group gap="xs">
                      {question.tags?.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" size="sm">
                          {tag}
                        </Badge>
                      ))}
                      {question.tags?.length > 3 && (
                        <Badge variant="outline" size="sm" color="gray">
                          +{question.tags.length - 3}
                        </Badge>
                      )}
                    </Group>

                    {question.attempts > 0 && (
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">
                          Attempts: {question.attempts}
                        </Text>
                        {question.totalPointsEarned > 0 && (
                          <Text size="xs" c="green">
                            Earned: {question.totalPointsEarned} pts
                          </Text>
                        )}
                      </Group>
                    )}

                    <Button variant="light" size="sm" fullWidth>
                      {question.studentStatus === 'solved' ? 'Review' : 
                       question.studentStatus === 'attempted' ? 'Continue' : 'Solve'}
                    </Button>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>

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
          <Text>No questions found matching your criteria.</Text>
          <Button variant="light" mt="sm" onClick={() => setFilters({
            search: '', difficulty: '', status: '', tags: []
          })}>
            Clear Filters
          </Button>
        </Alert>
      )}
    </Container>
  );
}