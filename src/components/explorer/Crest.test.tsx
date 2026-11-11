import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Crest } from "./Crest";

describe("municipal crest", () => {
  it("uses the same image through a visit transition", () => {
    const url = "https://images.example.org/provided.png";
    const { rerender } = render(<Crest name="Torino" url={url} visited={false} />);
    const image = screen.getByRole("img", { name: "Stemma di Torino" });
    rerender(<Crest name="Torino" url={url} visited />);
    expect(screen.getByRole("img", { name: "Stemma di Torino" })).toBe(image);
    expect(image.getAttribute("src")).toBe(url);
  });
  it("falls back to a shield on a failed image and retries a new URL", () => {
    const { rerender } = render(<Crest name="Roma" url="https://images.example.org/one.png" visited={false} />);
    act(() => fireEvent.error(screen.getByRole("img", { name: "Stemma di Roma" })));
    expect(screen.getByRole("img", { name: "Stemma di Roma (segnaposto)" })).toBeDefined();
    rerender(<Crest name="Roma" url="https://images.example.org/two.png" visited={false} />);
    expect(screen.getByRole("img", { name: "Stemma di Roma" }).getAttribute("src")).toBe("https://images.example.org/two.png");
  });
});