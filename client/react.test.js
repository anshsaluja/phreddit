import '@testing-library/jest-dom';
import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "./src/components/Header";

describe("Header 'Create Post' button behavior", () => {
  const setup = (loggedInUser = null) => {
    render(
      <Header
        setCurrentView={jest.fn()}
        setSearchQuery={jest.fn()}
        currentView="home"
        setHomeRefreshKey={jest.fn()}
        loggedInUser={loggedInUser}
        onLogout={jest.fn()}
      />
    );
  };

  test("Create Post button is disabled for guests", () => {
    setup(null);
    const button = screen.getByRole("button", { name: /create post/i });
    expect(button).toBeDisabled();
  });

  test("Create Post button is enabled for logged-in users", () => {
    const fakeUser = { displayName: "testuser", _id: "123" };
    setup(fakeUser);
    const button = screen.getByRole("button", { name: /create post/i });
    expect(button).toBeEnabled();
  });
});
