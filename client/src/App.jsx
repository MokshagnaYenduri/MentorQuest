import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/student/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import Questions from './pages/student/Questions';
import QuestionDetail from './pages/student/QuestionDetail';
import Profile from './pages/student/Profile';
import Leaderboard from './pages/student/Leaderboard';
import AdminQuestions from './pages/admin/Questions';
import AdminUsers from './pages/admin/Users';
import AdminBadges from './pages/admin/Badges';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} />;
  }
  
  return children;
}

// App Router Component
function AppRouter() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} /> : <Login />} />
      
      {/* Student Routes */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute requiredRole="student">
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/questions" element={
        <ProtectedRoute requiredRole="student">
          <Questions />
        </ProtectedRoute>
      } />
      <Route path="/student/questions/:questionId" element={
        <ProtectedRoute requiredRole="student">
          <QuestionDetail />
        </ProtectedRoute>
      } />
      <Route path="/student/profile" element={
        <ProtectedRoute requiredRole="student">
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/student/leaderboard" element={
        <ProtectedRoute requiredRole="student">
          <Leaderboard />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/questions" element={
        <ProtectedRoute requiredRole="admin">
          <AdminQuestions />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requiredRole="admin">
          <AdminUsers />
        </ProtectedRoute>
      } />
      <Route path="/admin/badges" element={
        <ProtectedRoute requiredRole="admin">
          <AdminBadges />
        </ProtectedRoute>
      } />
      
      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <MantineProvider>
      <Notifications />
      <Router>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </Router>
    </MantineProvider>
  );
}

export default App;
