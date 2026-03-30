import { loadViewerPayload } from "./api";

describe("loadViewerPayload", () => {
  it("returns centered region for interior coordinates", async () => {
    const payload = await loadViewerPayload("NC_000913.3", 235000);

    expect(payload.region).toEqual({
      center: 235000,
      start: 234750,
      end: 235250
    });
  });

  it("wraps region boundaries for circular genomes near coordinate 0", async () => {
    const payload = await loadViewerPayload("NC_000913.3", 0);

    expect(payload.region).toEqual({
      center: 4641652,
      start: 4641402,
      end: 250
    });
    expect(payload.nucleotides[1]?.end).toBe(250);
  });

  it("keeps selected low coordinates centered by wrapping start around genome end", async () => {
    const payload = await loadViewerPayload("NC_000913.3", 100);

    expect(payload.region).toEqual({
      center: 100,
      start: 4641502,
      end: 350
    });
  });
});
