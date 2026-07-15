import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Point d'entree React : injecte le composant racine App dans la balise HTML #root.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
