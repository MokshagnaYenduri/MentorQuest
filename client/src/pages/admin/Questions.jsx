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
  Button,
  TextInput,
  Select,
  MultiSelect,
  Textarea,
  Modal,
  Table,
  ActionIcon,
  Menu,
  Alert,
  Pagination
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminQuestions() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, total: 1 });
  const [availableTags, setAvailableTags] = useState([]);

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      constraints: '',
      difficulty: 'easy',
      tags: [],
      points: 10,
      examples: []
    },
    validate: {
      title: (value) => (value.length < 3 ? 'Title must be at least 3 characters' : null),
      description: (value) => (value.length < 10 ? 'Description must be at least 10 characters' : null),
      points: (value) => (value < 1 ? 'Points must be at least 1' : null)
    }
  });

  useEffect(() => {
    fetchQuestions();
    fetchTags();
  }, [pagination.current]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/admin/questions?page=${pagination.current}&limit=20`);
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
      const response = await axios.get('/admin/tags');
      setAvailableTags(response.data.map(tag => ({ value: tag, label: tag })));
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingQuestion) {
        await axios.put(`/admin/questions/${editingQuestion._id}`, values);
        notifications.show({
          title: 'Success',
          message: 'Question updated successfully',
          color: 'green'
        });
      } else {
        await axios.post('/admin/questions', values);
        notifications.show({
          title: 'Success',
          message: 'Question created successfully',
          color: 'green'
        });
      }
      
      setModalOpened(false);
      setEditingQuestion(null);
      form.reset();
      fetchQuestions();
      fetchTags();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to save question',
        color: 'red'
      });
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    form.setValues({
      title: question.title,
      description: question.description,
      constraints: question.constraints || '',
      difficulty: question.difficulty,
      tags: question.tags || [],
      points: question.points,
      examples: question.examples || []
    });
    setModalOpened(true);
  };

  const handleDelete = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await axios.delete(`/admin/questions/${questionId}`);
        notifications.show({
          title: 'Success',
          message: 'Question deleted successfully',
          color: 'green'
        });
        fetchQuestions();
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to delete question',
          color: 'red'
        });
      }
    }
  };

  const openCreateModal = () => {
    setEditingQuestion(null);
    form.reset();
    setModalOpened(true);
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  return (
    <Container size="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Question Management</Title>
          <Text c="dimmed">Create and manage coding problems</Text>
        </div>
        
        <Group>
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            Users
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/badges')}>
            Badges
          </Button>
          <Button onClick={openCreateModal}>
            Add Question
          </Button>
          <Button variant="filled" color="red" onClick={handleLogout}>
            Logout
          </Button>
        </Group>
      </Group>

      {/* Questions Table */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        {loading ? (
          <Alert>Loading questions...</Alert>
        ) : questions.length > 0 ? (
          <>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Difficulty</Table.Th>
                  <Table.Th>Points</Table.Th>
                  <Table.Th>Tags</Table.Th>
                  <Table.Th>Submissions</Table.Th>
                  <Table.Th>Success Rate</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {questions.map((question) => (
                  <Table.Tr key={question._id}>
                    <Table.Td>
                      <div>
                        <Text fw={500}>{question.title}</Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {question.description}
                        </Text>
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text>{question.points}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {question.tags?.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" size="sm">
                            {tag}
                          </Badge>
                        ))}
                        {question.tags?.length > 2 && (
                          <Badge variant="outline" size="sm" color="gray">
                            +{question.tags.length - 2}
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text>{question.totalSubmissions || 0}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text>
                        {question.totalSubmissions > 0 
                          ? `${Math.round((question.successfulSubmissions / question.totalSubmissions) * 100)}%`
                          : 'N/A'
                        }
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => handleEdit(question)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(question._id)}
                        >
                          Delete
                        </Button>
                      </Group>
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
            <Text>No questions found.</Text>
            <Button variant="light" mt="sm" onClick={openCreateModal}>
              Create First Question
            </Button>
          </Alert>
        )}
      </Card>

      {/* Add/Edit Question Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingQuestion ? 'Edit Question' : 'Add New Question'}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Title"
              placeholder="Enter question title"
              required
              {...form.getInputProps('title')}
            />

            <Textarea
              label="Description"
              placeholder="Enter problem description"
              required
              minRows={4}
              {...form.getInputProps('description')}
            />

            <Textarea
              label="Constraints"
              placeholder="Enter constraints (optional)"
              minRows={2}
              {...form.getInputProps('constraints')}
            />

            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Difficulty"
                  required
                  data={[
                    { value: 'cakewalk', label: 'Cakewalk' },
                    { value: 'easy', label: 'Easy' },
                    { value: 'easy-medium', label: 'Easy-Medium' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Hard' }
                  ]}
                  {...form.getInputProps('difficulty')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Points"
                  type="number"
                  required
                  min={1}
                  {...form.getInputProps('points')}
                />
              </Grid.Col>
            </Grid>

            <MultiSelect
              label="Tags"
              placeholder="Select or add tags"
              data={availableTags}
              searchable
              creatable
              getCreateLabel={(query) => `+ Add "${query}"`}
              onCreate={(query) => {
                const item = { value: query, label: query };
                setAvailableTags(prev => [...prev, item]);
                return item;
              }}
              {...form.getInputProps('tags')}
            />

            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setModalOpened(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingQuestion ? 'Update Question' : 'Create Question'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}