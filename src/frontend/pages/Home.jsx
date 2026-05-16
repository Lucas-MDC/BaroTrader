import { useEffect } from 'react';
import { Link } from '../routes.jsx';
import { ACCOUNT_ROUTE, REGISTER_ROUTE, redirectTo } from '../shared/navigation.js';

export default function Home() {
  useEffect(() => {
    document.title = 'Home';
  }, []);

  function handleLogin(event) {
    event.preventDefault();
    redirectTo(ACCOUNT_ROUTE);
  }

  return (
    <>
      <header>
        <h1>Home</h1>
      </header>

      <main>
        <div className="container">
          <section id="login-area">
            <input type="text" id="username-login" placeholder="Username" />
            <input type="password" id="password-login" placeholder="Password" />
            <button id="login-button" onClick={handleLogin}>Login</button>
          </section>
          <section id="register-area">
            <Link to={REGISTER_ROUTE}>Create an account</Link>
          </section>
        </div>
      </main>
    </>
  );
}
