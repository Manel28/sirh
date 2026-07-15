import { RouterProvider } from "react-router-dom";
import { router } from "./router";

/**
 * Composant racine de l'application.
 * RouterProvider observe l'URL et affiche la page declaree dans src/router.
 */
export default function App() {
  return <RouterProvider router={router} />;
}
