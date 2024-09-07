/**
 * Resolving the sqlite wasm dynamically recurringly breaks
 * in different environments (node, browser, vitest).
 *
 * To ease development, the wasm binary is bundled (for now).
 */

function base64ToArrayBuffer(base64: string) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (var i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

const sqliteWasmBase64 =

export const wasmBinary = base64ToArrayBuffer(sqliteWasmBase64);