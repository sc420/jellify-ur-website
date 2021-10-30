import { fireEvent, render, screen } from "@testing-library/react";

import { I18nextProvider } from "react-i18next";

import App from "./App";
import i18n from "./i18nForAppTest";

test("all buttons should be gray after clicking Jellify button", async () => {
  // Reference: https://react.i18next.com/misc/testing#testing-without-stubbing
  render(
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  );
  fireEvent.click(screen.getByText("Jellify"));

  // Wait for the transitioning to finish
  await screen.findByText("Jellified! Try Scrolling Down", {
    selector: "span",
  });

  expect(screen.getByText("Jellify")).toHaveClass("btn-secondary");
  expect(screen.getByText("Jellify (Soft)")).toHaveClass("btn-secondary");
  expect(screen.getByText("Jellify (Hard)")).toHaveClass("btn-secondary");
  expect(screen.getByText("Jellify (Debug Mode)")).toHaveClass("btn-secondary");
});
