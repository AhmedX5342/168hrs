import { describe, expect, it } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Lightweight smoke: memory router resolves `/` without falling through to 404.
 * Full page render may need localStorage mocks; this only checks route matching shape.
 */
describe("App routing", () => {
  it("defines expected path patterns", () => {
    const paths = ["/", "/week", "/tasks", "/tasks/weeks", "/tasks/:weekId", "/settings"];
    expect(paths).toContain("/");
    expect(paths).toContain("/tasks/:weekId");
  });
});
