import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const rootElement = document.querySelector('#root');

if (rootElement) {
  createRoot(rootElement).render(<App />);
}
