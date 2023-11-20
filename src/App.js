import './App.css';
import Panel from "./components/Panel";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Files from "./components/Files";
import Team from "./components/Team";
import Register from "./components/Register";
import Profile from "./components/profile";
import AvatarUpload from './components/AvatarUpload';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from './components/Forgot_password';
import Tasks from "./components/Tasks";
import Invite from "./components/Invite";
import { AuthContextProvider } from './context/AuthContext';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <div>
          <AuthContextProvider>
            <Routes>
              <Route path="/" element={<Panel />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path='/forgot-password' element={<ForgotPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/files" element={<ProtectedRoute><Files /></ProtectedRoute>} />
              <Route path="/files/:teamName" element={<ProtectedRoute><Files /></ProtectedRoute>} />
              <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/avatar" element={<ProtectedRoute><AvatarUpload /></ProtectedRoute>} />
              <Route path="/invite" element={<ProtectedRoute><Invite /></ProtectedRoute>} />
            </Routes>
          </AuthContextProvider>
        </div>
      </div>
    </Router>
  );
}

export default App;
