import { useEffect } from 'react';
import { HOME_ROUTE, redirectTo } from '../shared/navigation.js';
import { logoutUser } from '../shared/sessionClient.js';

export default function Account() {
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
      redirectTo(HOME_ROUTE);
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
