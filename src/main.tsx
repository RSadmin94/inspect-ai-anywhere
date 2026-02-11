import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log('main.tsx loaded');
const rootElement = document.getElementById("root");
console.log('Root element:', rootElement);
if (rootElement) {
  console.log('Creating React root...');
  createRoot(rootElement).render(<App />);
  console.log('React app rendered');
} else {
  console.error('Root element not found!');
}
