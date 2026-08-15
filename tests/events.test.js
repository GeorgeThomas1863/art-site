// src/events.js is a thin CRUD layer behind the admin events UI: store, update, delete,
// and list events. Unlike src/products.js it has NO field validation and NO slug/date logic —
// field whitelisting happens upstream in controllers/data-controller.js, out of scope here.

import { describe, it, expect } from "vitest";
import { storeEvent, updateEvent, deleteEvent, getEventData } from "../src/events.js";
import { seedCollection, readCollection } from "./helpers/fake-db.js";

const EVENTS = process.env.EVENTS_COLLECTION;

const buildEventInput = (overrides = {}) => {
  return {
    name: "Summer Art Show",
    eventDate: "2026-09-01",
    eventLocation: "Main Gallery",
    eventDescription: "An outdoor showcase.",
    picData: null,
    dateCreated: "2026-08-15T12:00:00Z",
    ...overrides,
  };
};

const buildEventDoc = (overrides = {}) => {
  return {
    eventId: "evt-1",
    name: "Summer Art Show",
    eventDate: "2026-09-01",
    eventLocation: "Main Gallery",
    eventDescription: "An outdoor showcase.",
    picData: null,
    ...overrides,
  };
};

describe("storeEvent", () => {
  it("stores the event and returns success with the message text as currently implemented (bug: says 'product' not 'event')", async () => {
    const result = await storeEvent(buildEventInput());

    expect(result.success).toBe(true);
    expect(result.message).toBe("Product added successfully"); // copy-pasted from products.js — see report concerns
    expect(readCollection(EVENTS)).toHaveLength(1);
  });

  it("derives eventId from the fake insertedId, starting fresh on an empty collection", async () => {
    const result = await storeEvent(buildEventInput());

    expect(result.eventId).toBe("fake-id-1");
    expect(readCollection(EVENTS)[0].eventId).toBe("fake-id-1");
    expect(readCollection(EVENTS)[0]._id).toBe("fake-id-1");
  });

  it("assigns sequential ids across multiple stores", async () => {
    const first = await storeEvent(buildEventInput({ name: "Show A" }));
    const second = await storeEvent(buildEventInput({ name: "Show B" }));

    expect(first.eventId).toBe("fake-id-1");
    expect(second.eventId).toBe("fake-id-2");
    expect(readCollection(EVENTS)).toHaveLength(2);
  });

  it("strips route from the stored document", async () => {
    await storeEvent(buildEventInput({ route: "/admin/add-event-route" }));
    expect(readCollection(EVENTS)[0]).not.toHaveProperty("route");
  });

  it("persists whatever fields it is given verbatim — no validation exists at this layer", async () => {
    const result = await storeEvent({});
    expect(result.success).toBe(true);
    expect(readCollection(EVENTS)).toHaveLength(1);
  });
});

describe("updateEvent", () => {
  it("returns 'Event not found' when eventId does not match any seeded event", async () => {
    seedCollection(EVENTS, [buildEventDoc({ eventId: "evt-1" })]);
    const result = await updateEvent({ eventId: "nope", name: "New name" });
    expect(result).toEqual({ success: false, message: "Event not found" });
  });

  it("returns 'Event not found' against an empty collection", async () => {
    const result = await updateEvent({ eventId: "evt-1" });
    expect(result).toEqual({ success: false, message: "Event not found" });
  });

  it("updates the matching event's fields and strips route from the stored doc", async () => {
    seedCollection(EVENTS, [buildEventDoc({ eventId: "evt-1", name: "Old name" })]);

    const result = await updateEvent({ eventId: "evt-1", name: "New name", route: "/admin/edit-event-route" });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Event updated successfully");
    const stored = readCollection(EVENTS)[0];
    expect(stored.name).toBe("New name");
    expect(stored).not.toHaveProperty("route");
  });

  it("leaves other events untouched", async () => {
    seedCollection(EVENTS, [buildEventDoc({ eventId: "evt-1", name: "Keep me" }), buildEventDoc({ eventId: "evt-2", name: "Old" })]);

    await updateEvent({ eventId: "evt-2", name: "Changed" });

    const stored = readCollection(EVENTS);
    expect(stored.find((doc) => doc.eventId === "evt-1").name).toBe("Keep me");
    expect(stored.find((doc) => doc.eventId === "evt-2").name).toBe("Changed");
  });
});

describe("deleteEvent", () => {
  it("returns 'Event not found' when the eventId does not exist", async () => {
    const result = await deleteEvent("nope");
    expect(result).toEqual({ success: false, message: "Event not found" });
  });

  it("deletes the matching event and returns success (note: leaks keyToLookup/itemValue internals into the response)", async () => {
    seedCollection(EVENTS, [buildEventDoc({ eventId: "evt-1" })]);

    const result = await deleteEvent("evt-1");

    expect(result).toEqual({
      success: true,
      message: "Event deleted successfully",
      eventId: "evt-1",
      keyToLookup: "eventId",
      itemValue: "evt-1",
    });
    expect(readCollection(EVENTS)).toHaveLength(0);
  });

  it("removes only the targeted event, leaving others in place", async () => {
    seedCollection(EVENTS, [buildEventDoc({ eventId: "evt-1" }), buildEventDoc({ eventId: "evt-2" })]);

    await deleteEvent("evt-1");

    const stored = readCollection(EVENTS);
    expect(stored).toHaveLength(1);
    expect(stored[0].eventId).toBe("evt-2");
  });
});

describe("getEventData", () => {
  it("returns an empty array when no events are seeded", async () => {
    expect(await getEventData()).toEqual([]);
  });

  it("returns every seeded event in insertion order (no date-handling or ordering logic exists in this file)", async () => {
    seedCollection(EVENTS, [
      buildEventDoc({ eventId: "evt-1", eventDate: "2026-12-01" }),
      buildEventDoc({ eventId: "evt-2", eventDate: "2026-01-01" }),
    ]);

    const data = await getEventData();

    expect(data).toHaveLength(2);
    expect(data.map((doc) => doc.eventId)).toEqual(["evt-1", "evt-2"]); // insertion order, not date order
  });

  it("returns copies, not live references to the store", async () => {
    seedCollection(EVENTS, [buildEventDoc({ eventId: "evt-1" })]);

    const data = await getEventData();
    data[0].name = "mutated";

    expect(readCollection(EVENTS)[0].name).not.toBe("mutated");
  });
});
