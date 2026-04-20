/// <reference lib="dom" />

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { Modal } from "@/client/components/Modal";

function ControlledModal({ initial = true }: { initial?: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <Modal
      isOpen={open}
      onClose={() => setOpen(false)}
      title="Confirm"
      footer={<button type="button">Cancel</button>}
    >
      <p>Body content</p>
    </Modal>
  );
}

describe("Modal", () => {
  afterEach(() => cleanup());

  test("renders title and body when open", () => {
    render(<ControlledModal />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  test("does not render when closed", () => {
    render(<ControlledModal initial={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("closes when Esc is pressed", () => {
    render(<ControlledModal />);
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("exposes close button with aria-label", () => {
    render(<ControlledModal />);
    expect(
      screen.getByRole("button", { name: /^close$/i }),
    ).toBeInTheDocument();
  });
});
