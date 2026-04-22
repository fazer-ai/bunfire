/// <reference lib="dom" />

import { afterEach, describe, expect, spyOn, test } from "bun:test";
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

  test("nested Modal stacks above its parent via depth-based z-index", () => {
    const { baseElement } = render(
      <Modal isOpen onClose={() => {}} title="Parent">
        <Modal isOpen onClose={() => {}} title="Child">
          <p>Child body</p>
        </Modal>
      </Modal>,
    );
    const dialogs = Array.from(
      baseElement.querySelectorAll<HTMLElement>('[role="dialog"]'),
    );
    expect(dialogs.length).toBe(2);
    const [parent, child] = dialogs as [HTMLElement, HTMLElement];
    // Parent: no inline z-index, inherits Tailwind z-(--z-modal) token.
    expect(parent.style.zIndex).toBe("");
    // Child: inline calc() referencing the same CSS token, one step above.
    expect(child.style.zIndex).toContain("var(--z-modal)");
    expect(child.style.zIndex).toContain("+ 2");
  });

  test("warns once nesting reaches the --z-toast layer", () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    try {
      render(
        <Modal isOpen onClose={() => {}} title="d0">
          <Modal isOpen onClose={() => {}} title="d1">
            <Modal isOpen onClose={() => {}} title="d2">
              <Modal isOpen onClose={() => {}} title="d3">
                <Modal isOpen onClose={() => {}} title="d4">
                  <Modal isOpen onClose={() => {}} title="d5">
                    <p>too deep</p>
                  </Modal>
                </Modal>
              </Modal>
            </Modal>
          </Modal>
        </Modal>,
      );
      const deepWarns = warn.mock.calls.filter((call) =>
        String(call[0]).includes("--z-toast"),
      );
      expect(deepWarns.length).toBeGreaterThan(0);
    } finally {
      warn.mockRestore();
    }
  });
});

// NOTE: The pointerup-outside close behavior (only close when both mousedown
// AND mouseup land outside the dialog) is not unit-tested: Radix's
// onPointerDownOutside detection relies on layered document listeners that
// happy-dom does not reliably trigger via fireEvent. Verify manually in a
// browser, or cover via e2e (Playwright) if the behavior is critical.
