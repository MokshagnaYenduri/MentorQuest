import React, { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Anchor,
  Stack,
  Alert,
  Divider,
  Center
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, register, googleLogin } = useAuth();

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: 'student'
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
      name: (value) => (!isLogin && value.length < 2 ? 'Name must be at least 2 characters' : null)
    }
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await login({
          email: values.email,
          password: values.password
        });
      } else {
        result = await register({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role
        });
      }

      if (result.success) {
        notifications.show({
          title: 'Success',
          message: isLogin ? 'Logged in successfully!' : 'Account created successfully!',
          color: 'green'
        });
      } else {
        notifications.show({
          title: 'Error',
          message: result.error,
          color: 'red'
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Something went wrong. Please try again.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // This would integrate with Google Identity Services
      // For now, we'll show a placeholder
      notifications.show({
        title: 'Google Login',
        message: 'Google login integration would be implemented here',
        color: 'blue'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Google login failed',
        color: 'red'
      });
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" c="blue">
        MentorQuest
      </Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title order={2} ta="center" mb="md">
          {isLogin ? 'Welcome back!' : 'Create account'}
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!isLogin && (
              <>
                <TextInput
                  label="Name"
                  placeholder="Your name"
                  required
                  {...form.getInputProps('name')}
                />
                
                <select {...form.getInputProps('role')} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </>
            )}

            <TextInput
              label="Email"
              placeholder="hello@mantine.dev"
              required
              {...form.getInputProps('email')}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              {...form.getInputProps('password')}
            />

            <Button type="submit" loading={loading} fullWidth>
              {isLogin ? 'Sign in' : 'Sign up'}
            </Button>

            <Divider label="or" labelPosition="center" my="lg" />

            <Button 
              variant="outline" 
              fullWidth 
              onClick={handleGoogleLogin}
            >
              Continue with Google
            </Button>
          </Stack>
        </form>

        <Group justify="center" mt="lg">
          <Anchor
            component="button"
            type="button"
            c="dimmed"
            onClick={() => {
              setIsLogin(!isLogin);
              form.reset();
            }}
            size="xs"
          >
            {isLogin
              ? "Don't have an account? Register"
              : 'Already have an account? Login'}
          </Anchor>
        </Group>
      </Paper>
    </Container>
  );
}