import { test, expect, vi } from "vitest";
import * as LixServerApi from "@lix-js/server-api-schema";
import { createServerApiMemoryStorage } from "../storage/create-memory-storage.js";
import { openLixInMemory } from "../../lix/open-lix-in-memory.js";
import { createServerApiHandler } from "../create-server-api-handler.js";
import type { Change } from "../../database/schema.js";
import { mockChange } from "../../change/mock-change.js";
import { getDiffingRows } from "../../sync/get-diffing-rows.js";
import { createVersion } from "../../version/create-version.js";
import { switchVersion } from "../../version/switch-version.js";
import { pullFromServer } from "../../sync/pull-from-server.js";

test("it should push data successfully", async () => {
	const lix = await openLixInMemory({});
	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createServerApiMemoryStorage();
	await storage.set(`lix-file-${id}`, await lix.toBlob());

	const lsa = await createServerApiHandler({ storage });

	const mockChange0 = mockChange({ id: "change0" });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/push-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: id,
				vector_clock: [
					{
						session: "fake-session",
						time: 1,
					},
				],
				data: {
					mutation_log: [
						{
							row_id: { id: mockChange0.id },
							table_name: "change",
							operation: "insert",
							session: "fake-session",
							session_time: 2,
							wall_clock: 1,
						},
					],
					change: [mockChange0] satisfies Change[],
				},
			} satisfies LixServerApi.paths["/lsa/push-v1"]["post"]["requestBody"]["content"]["application/json"]),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	expect(response.status).toBe(201);

	const lixFromStorage = await openLixInMemory({
		blob: await storage.get(`lix-file-${id}`),
	});

	const result = await lixFromStorage.db
		.selectFrom("change")
		.where("id", "=", mockChange0.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(result).toEqual(mockChange0);
});

test("it should return 404 if the Lix file is not found", async () => {
	const storage = createServerApiMemoryStorage();
	const lsa = await createServerApiHandler({ storage });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/push-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: "nonexistent-id",
				vector_clock: [],
				data: {},
			} satisfies LixServerApi.paths["/lsa/push-v1"]["post"]["requestBody"]["content"]["application/json"]),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	expect(response.status).toBe(404);
});

test("it should return 500 for an invalid Lix file", async () => {
	const storage = createServerApiMemoryStorage();
	await storage.set(`lix-file-invalid-id`, new Blob(["invalid data"]));

	const lsa = await createServerApiHandler({ storage });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/push-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: "invalid-id",
				vector_clock: [],
				data: {},
			} satisfies LixServerApi.paths["/lsa/push-v1"]["post"]["requestBody"]["content"]["application/json"]),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	expect(response.status).toBe(500);
	const responseJson = await response.json();
	expect(responseJson.code).toBe("INVALID_LIX_FILE");
	expect(responseJson.message).toBe("The lix file couldn't be opened.");
});

test("it should return 400 for a failed insert operation", async () => {
	const lix = await openLixInMemory({});
	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createServerApiMemoryStorage();
	await storage.set(`lix-file-${id}`, await lix.toBlob());

	const lsa = await createServerApiHandler({ storage });

	const response = await lsa(
		new Request("http://localhost:3000/lsa/push-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: id,
				vector_clock: [],
				data: {
					nonexistent_table: [{ key: "test", value: "test value" }],
				},
			} satisfies LixServerApi.paths["/lsa/push-v1"]["post"]["requestBody"]["content"]["application/json"]),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	expect(response.status).toBe(400);
	const responseJson = await response.json();
	expect(responseJson.code).toBe("FAILED_TO_INSERT_DATA");
	expect(responseJson.message).toBeDefined();
});

test("it should detect conflicts", async () => {
	let lixOnServer = await openLixInMemory({});

	// ensure that both client and server create
	// changes in the same version
	const version0 = await createVersion({
		lix: lixOnServer,
	});
	await switchVersion({ lix: lixOnServer, to: version0 });

	// initialize client
	const lixOnClient = await openLixInMemory({
		blob: await lixOnServer.toBlob(),
	});

	const lixId = await lixOnServer.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const storage = createServerApiMemoryStorage();

	const lsaHandler = await createServerApiHandler({ storage });

	global.fetch = vi.fn((request) => lsaHandler(request));

	// server has/creates value0 for mock_key
	await lixOnServer.db
		.insertInto("key_value")
		.values({ key: "mock_key", value: "value0" })
		.execute();

	await storage.set(`lix-file-${lixId.value}`, await lixOnServer.toBlob());

	// client has/creates value1 for mock_key
	await lixOnClient.db
		.insertInto("key_value")
		.values({ key: "mock_key", value: "value1" })
		.execute();

	const { upsertedRows: tableRowsToPush, state } = await getDiffingRows({
		lix: lixOnClient,
		targetVectorClock: [],
	});

	const response = await lsaHandler(
		new Request("http://localhost:3000/lsa/push-v1", {
			method: "POST",
			body: JSON.stringify({
				lix_id: lixId.value,
				vector_clock: state,
				data: tableRowsToPush,
			} satisfies LixServerApi.paths["/lsa/push-v1"]["post"]["requestBody"]["content"]["application/json"]),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);

	expect(response.status).toBe(201);

	lixOnServer = await openLixInMemory({
		blob: await storage.get(`lix-file-${lixId.value}`),
	});

	const conflictsOnServer = await lixOnServer.db
		.selectFrom("version_change_conflict")
		.where("version_id", "=", version0.id)
		.selectAll()
		.execute();

	expect(conflictsOnServer).not.toHaveLength(0);

	await pullFromServer({
		id: lixId.value,
		lix: lixOnClient,
		serverUrl: "http://localhost:3000",
	});

	const conflictsOnClient = await lixOnClient.db
		.selectFrom("version_change_conflict")
		.where("version_id", "=", version0.id)
		.selectAll()
		.execute();

	expect(conflictsOnClient).toEqual(conflictsOnServer);
});
