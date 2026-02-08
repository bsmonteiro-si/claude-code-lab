import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Templates from "./pages/Templates";
import Pipelines from "./pages/Pipelines";
import Executions from "./pages/Executions";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/templates", element: <Templates /> },
      { path: "/pipelines", element: <Pipelines /> },
      { path: "/executions", element: <Executions /> },
    ],
  },
]);
