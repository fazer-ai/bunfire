/// <reference lib="dom" />

import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { Modal, useModalController } from "@/client/components/Modal";

function ControlledModal({
  initial = true,
  closeOnOutsideClick,
}: {
  initial?: boolean;
  closeOnOutsideClick?: boolean;
}) {
  const modal = useModalController();
  // NOTE: fire open() exactly once on mount. `modal` identity changes whenever
  // internal state flips, so depending on it would re-open the dialog after
  // Esc closes it and break the test.
  const openedRef = useRef(false);
  useEffect(() => {
    if (!initial || openedRef.current) return;
    openedRef.current = true;
    modal.open();
  }, [initial, modal]);
  return (
    <Modal
      modal={modal}
      title="Confirm"
      footer={<button type="button">Cancel</button>}
      closeOnOutsideClick={closeOnOutsideClick}
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

  test("Esc still closes when closeOnOutsideClick is false", () => {
    render(<ControlledModal closeOnOutsideClick={false} />);
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("pointerup without prior outside pointerdown does not close", () => {
    render(<ControlledModal />);
    fireEvent.pointerUp(document.body);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("nested Modal stacks above its parent via depth-based z-index", () => {
    function Nested() {
      const parent = useModalController();
      const child = useModalController();
      const openedRef = useRef(false);
      useEffect(() => {
        if (openedRef.current) return;
        openedRef.current = true;
        parent.open();
        child.open();
      }, [parent, child]);
      return (
        <Modal modal={parent} title="Parent">
          <Modal modal={child} title="Child">
            <p>Child body</p>
          </Modal>
        </Modal>
      );
    }
    const { baseElement } = render(<Nested />);
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
    function Deep() {
      const m0 = useModalController();
      const m1 = useModalController();
      const m2 = useModalController();
      const m3 = useModalController();
      const m4 = useModalController();
      const m5 = useModalController();
      const openedRef = useRef(false);
      useEffect(() => {
        if (openedRef.current) return;
        openedRef.current = true;
        m0.open();
        m1.open();
        m2.open();
        m3.open();
        m4.open();
        m5.open();
      }, [m0, m1, m2, m3, m4, m5]);
      return (
        <Modal modal={m0} title="d0">
          <Modal modal={m1} title="d1">
            <Modal modal={m2} title="d2">
              <Modal modal={m3} title="d3">
                <Modal modal={m4} title="d4">
                  <Modal modal={m5} title="d5">
                    <p>too deep</p>
                  </Modal>
                </Modal>
              </Modal>
            </Modal>
          </Modal>
        </Modal>
      );
    }
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    try {
      render(<Deep />);
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
