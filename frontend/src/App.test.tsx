import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RouterProvider, createMemoryRouter } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";

function renderWithRouter(initialRoute = "/") {
  const router = createMemoryRouter(
    [
      {
        element: <Layout />,
        children: [{ path: "/", element: <Home /> }],
      },
    ],
    { initialEntries: [initialRoute] }
  );
  return render(<RouterProvider router={router} />);
}

describe("App", () => {
  it("mounts and renders the home page", () => {
    renderWithRouter();
    expect(screen.getByText("LLM Prompt Lab")).toBeInTheDocument();
    expect(screen.getByText("Welcome to the LLM Prompt Lab.")).toBeInTheDocument();
  });

  it("renders sidebar navigation links", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: "Templates" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pipelines" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Executions" })).toBeInTheDocument();
  });
});
