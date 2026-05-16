import { Route, Routes } from './routes.jsx';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Account from './pages/Account.jsx';
import {
  ACCOUNT_ROUTE,
  HOME_ROUTE,
  REGISTER_ROUTE
} from './shared/navigation.js';

export default function App() {
  return (
    <Routes fallback={<Home />}>
      <Route path={HOME_ROUTE} element={<Home />} />
      <Route path={REGISTER_ROUTE} element={<Register />} />
      <Route path={ACCOUNT_ROUTE} element={<Account />} />
    </Routes>
  );
}
