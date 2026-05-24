import { useEffect } from 'react';
import { HOME_ROUTE, redirectTo } from '../shared/navigation.js';

export default function Account() {
  useEffect(() => {
    document.title = 'Account';
  }, []);

  function handleLogout(event) {
    event.preventDefault();
    redirectTo(HOME_ROUTE);
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
