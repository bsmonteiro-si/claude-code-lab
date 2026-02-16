import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Templates from "./pages/Templates";
import Pipelines from "./pages/Pipelines";
import Executions from "./pages/Executions";
import Login from "./pages/Login";
import Register from "./pages/Register";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/", element: <Home /> },
          { path: "/templates", element: <Templates /> },
          { path: "/pipelines", element: <Pipelines /> },
          { path: "/executions", element: <Executions /> },
        ],
      },
    ],
  },
]);
