import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HOME_ROUTE } from '../shared/navigation.js';
import { logoutUser } from '../shared/sessionClient.js';

export default function Account() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Account';
  }, []);

  async function handleLogout(event) {
    event.preventDefault();

    try {
      await logoutUser();
    } catch (err) {
      console.error('Failed to logout', err);
    } finally {
      navigate(HOME_ROUTE, { replace: true });
    }
  }

  return (
    <>
      <header>
        <h1>Account</h1>

        <div className="header-right">
          <button id="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <nav>
        <ul>
          <li>Inventory</li>
          <li>Market</li>
          <li>Settings</li>
        </ul>
      </nav>

      <main />
    </>
  );
}
