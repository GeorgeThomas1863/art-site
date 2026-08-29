import { describe, expect, it } from "vitest";
import { splitEventsByDate } from "../public/js/helpers/events-date.js";

describe("splitEventsByDate", () => {
  it("puts future and today events in ascending order", () => {
    const events = [
      { name: "Future", eventDate: "2026-09-10" },
      { name: "Today", eventDate: "2026-09-01" },
      { name: "Soon", eventDate: "2026-09-02" },
    ];

    const result = splitEventsByDate(events, "2026-09-01");

    expect(result.upcomingEvents).toEqual([events[1], events[2], events[0]]);
  });

  it("puts past events in descending order", () => {
    const events = [
      { name: "Oldest", eventDate: "2024-01-01" },
      { name: "Newest", eventDate: "2026-08-31" },
      { name: "Middle", eventDate: "2025-06-15" },
    ];

    const result = splitEventsByDate(events, "2026-09-01");

    expect(result.oldEvents).toEqual([events[1], events[2], events[0]]);
  });

  it("classifies malformed and missing dates as old", () => {
    const events = [
      { name: "Malformed", eventDate: "09/01/2026" },
      { name: "Impossible", eventDate: "2026-02-30" },
      { name: "Missing" },
      { name: "Non-string", eventDate: 20260901 },
    ];

    const result = splitEventsByDate(events, "2026-09-01");

    expect(result.upcomingEvents).toEqual([]);
    expect(result.oldEvents).toEqual(events);
  });

  it("does not mutate the input array", () => {
    const events = [
      { name: "Future", eventDate: "2026-09-02" },
      { name: "Past", eventDate: "2026-08-31" },
    ];
    const originalOrder = [...events];

    splitEventsByDate(events, "2026-09-01");

    expect(events).toEqual(originalOrder);
  });
});
