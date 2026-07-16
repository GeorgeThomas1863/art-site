import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getUniqueItem: vi.fn(),
  storeAny: vi.fn(),
  updateObjItem: vi.fn(),
  deleteItem: vi.fn(),
  getAll: vi.fn(),
}));

vi.mock("../models/db-model.js", () => ({
  default: class {
    constructor(dataObject, collection) {
      this.dataObject = dataObject;
      this.collection = collection;
    }
    getUniqueItem() {
      return dbMocks.getUniqueItem(this.dataObject);
    }
    storeAny() {
      return dbMocks.storeAny(this.dataObject);
    }
    updateObjItem() {
      return dbMocks.updateObjItem(this.dataObject);
    }
    deleteItem() {
      return dbMocks.deleteItem(this.dataObject);
    }
    getAll() {
      return dbMocks.getAll(this.dataObject);
    }
  },
}));

import { storeEvent, updateEvent, deleteEvent, getEventData } from "../src/events.js";

process.env.EVENTS_COLLECTION = "events-test";

beforeEach(() => {
  dbMocks.getUniqueItem.mockReset();
  dbMocks.storeAny.mockReset();
  dbMocks.updateObjItem.mockReset();
  dbMocks.deleteItem.mockReset();
  dbMocks.getAll.mockReset();
});

describe("storeEvent", () => {
  it("stores the event, assigns eventId, and strips the route key", async () => {
    dbMocks.storeAny.mockResolvedValue({ insertedId: { toString: () => "ev1" } });
    dbMocks.updateObjItem.mockResolvedValue({ modifiedCount: 1 });

    const result = await storeEvent({ route: "/admin/add-event", name: "Gallery Opening", date: "2026-08-01" });

    expect(result.success).toBe(true);
    expect(result.eventId).toBe("ev1");
    expect(result.route).toBeUndefined();
    const backfill = dbMocks.updateObjItem.mock.calls[0][0];
    expect(backfill.updateObj.eventId).toBe("ev1");
  });

  it("fails when the store fails", async () => {
    dbMocks.storeAny.mockResolvedValue(null);
    const result = await storeEvent({ name: "Gallery Opening" });
    expect(result.success).toBe(false);
  });
});

describe("updateEvent", () => {
  it("fails when the event does not exist", async () => {
    dbMocks.getUniqueItem.mockResolvedValue(null);
    const result = await updateEvent({ eventId: "ghost", name: "New Name" });
    expect(result).toEqual({ success: false, message: "Event not found" });
  });

  it("updates an existing event", async () => {
    dbMocks.getUniqueItem.mockResolvedValue({ eventId: "ev1" });
    dbMocks.updateObjItem.mockResolvedValue({ modifiedCount: 1 });

    const result = await updateEvent({ eventId: "ev1", name: "Updated Show" });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Event updated successfully");
    const editCall = dbMocks.updateObjItem.mock.calls[0][0];
    expect(editCall.itemValue).toBe("ev1");
    expect(editCall.updateObj.name).toBe("Updated Show");
  });
});

describe("deleteEvent", () => {
  it("fails when the event does not exist", async () => {
    dbMocks.getUniqueItem.mockResolvedValue(null);
    const result = await deleteEvent("ghost");
    expect(result).toEqual({ success: false, message: "Event not found" });
  });

  it("deletes an existing event", async () => {
    dbMocks.getUniqueItem.mockResolvedValue({ eventId: "ev1" });
    dbMocks.deleteItem.mockResolvedValue({ deletedCount: 1 });

    const result = await deleteEvent("ev1");

    expect(result.success).toBe(true);
    expect(result.eventId).toBe("ev1");
  });
});

describe("getEventData", () => {
  it("returns all events", async () => {
    const events = [{ eventId: "ev1" }];
    dbMocks.getAll.mockResolvedValue(events);
    expect(await getEventData()).toBe(events);
  });
});
