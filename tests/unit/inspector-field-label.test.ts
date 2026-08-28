import { describe, expect, it } from "vitest";
import { formatFieldLabel } from "@/components/inspector";

describe("formatFieldLabel", () => {
  it("capitalises labels generated from object keys", () => {
    expect(formatFieldLabel("near")).toBe("Near");
    expect(formatFieldLabel("intensity")).toBe("Intensity");
  });

  it("splits camelCase keys into words", () => {
    expect(formatFieldLabel("castShadow")).toBe("Cast shadow");
    expect(formatFieldLabel("groundColor")).toBe("Ground color");
  });

  it("keeps known acronyms upper-case", () => {
    expect(formatFieldLabel("fov")).toBe("FOV");
    expect(formatFieldLabel("uuid")).toBe("UUID");
  });

  it("leaves authored labels untouched", () => {
    expect(formatFieldLabel("UUID")).toBe("UUID");
    expect(formatFieldLabel("Safe margin")).toBe("Safe margin");
    expect(formatFieldLabel("Camera Framing")).toBe("Camera Framing");
  });

  it("handles empty labels", () => {
    expect(formatFieldLabel("")).toBe("");
  });
});
