import { describe, test, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Footer } from "@/components/layout/footer";

describe("🌿 Aura UI Components — Static Rendering Tests", () => {
  test("GlassCard renders children and apply glass classes", () => {
    const html = renderToStaticMarkup(
      <GlassCard className="custom-class" hover={true}>
        <span>Card Content</span>
      </GlassCard>
    );
    expect(html).toContain("Card Content");
    expect(html).toContain("glass");
    expect(html).toContain("custom-class");
    expect(html).toContain("hover:-translate-y-1");
  });

  test("Button renders successfully with default variant", () => {
    const html = renderToStaticMarkup(<Button>Click Me</Button>);
    expect(html).toContain("Click Me");
    expect(html).toContain("bg-primary");
  });

  test("Input renders successfully with placeholder", () => {
    const html = renderToStaticMarkup(<Input id="test-input" placeholder="Enter text" />);
    expect(html).toContain("placeholder=\"Enter text\"");
    expect(html).toContain("id=\"test-input\"");
  });

  test("Textarea renders successfully with custom rows", () => {
    const html = renderToStaticMarkup(<Textarea id="test-area" placeholder="Enter description" rows={4} />);
    expect(html).toContain("placeholder=\"Enter description\"");
    expect(html).toContain("id=\"test-area\"");
    expect(html).toContain("rows=\"4\"");
  });

  test("Footer renders copyright and navigation links", () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).toContain("Aura");
    expect(html).toContain("India GHG Program");
    expect(html).toContain("All rights reserved");
    expect(html).toContain(new Date().getFullYear().toString());
  });
});
