import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Account from './pages/Account.jsx';
import RequireSession from './components/RequireSession.jsx';
import {
  ACCOUNT_ROUTE,
  HOME_ROUTE,
  LOGIN_ROUTE,
  REGISTER_ROUTE
} from './shared/navigation.js';

export default function App() {
  return (
    <Routes>
      <Route path={HOME_ROUTE} element={<Home />} />
      <Route path={LOGIN_ROUTE} element={<Login />} />
      <Route path={REGISTER_ROUTE} element={<Register />} />
      <Route
        path={ACCOUNT_ROUTE}
        element={
          <RequireSession>
            <Account />
          </RequireSession>
        }
      />
      <Route path="*" element={<Navigate to={HOME_ROUTE} replace />} />
    </Routes>
  );
}
