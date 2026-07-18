const DATABASE_NAME = "vault-architect-assets";
const STORE_NAME = "blueprint-covers";
const MAX_WIDTH = 400;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const memoryCovers = new Map<string, Blob>();
let databasePromise: Promise<IDBDatabase | undefined> | undefined;

function canUseIndexedDb(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openDatabase(): Promise<IDBDatabase | undefined> {
  if (!canUseIndexedDb()) return Promise.resolve(undefined);
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve) => {
    const request = window.indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(undefined);
  });
  return databasePromise;
}

function getStoredCover(id: string): Promise<Blob | undefined> {
  return openDatabase().then((database) => {
    if (!database) return memoryCovers.get(id);
    return new Promise<Blob | undefined>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : undefined);
      request.onerror = () => reject(request.error ?? new Error("Unable to read cover image"));
    });
  });
}

function resizeImage(file: File): Promise<Blob> {
  if (typeof document === "undefined") return Promise.reject(new Error("Cover images require a browser environment"));
  return new Promise((resolve, reject) => {
    const image = new Image();
    const sourceUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(sourceUrl);
      const scale = Math.min(1, MAX_WIDTH / image.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Your browser could not prepare this cover image"));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Your browser could not encode this cover image")), file.type, file.type === "image/png" ? undefined : 0.82);
    };
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("The selected file is not a readable image"));
    };
    image.src = sourceUrl;
  });
}

export function validateBlueprintCover(file: File): string | undefined {
  if (!ACCEPTED_MIME_TYPES.has(file.type)) return "Choose a PNG, JPEG, or WebP image.";
  if (file.size > MAX_FILE_SIZE) return "Cover images must be smaller than 10 MB.";
  return undefined;
}

export async function saveBlueprintCover(id: string, file: File): Promise<string> {
  const validationError = validateBlueprintCover(file);
  if (validationError) throw new Error(validationError);
  const blob = await resizeImage(file);
  memoryCovers.set(id, blob);
  const database = await openDatabase();
  if (database) {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(blob, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Unable to save cover image"));
    });
  }
  return URL.createObjectURL(blob);
}

export async function loadBlueprintCoverUrl(id: string): Promise<string | undefined> {
  const blob = await getStoredCover(id);
  return blob ? URL.createObjectURL(blob) : undefined;
}

export async function removeBlueprintCover(id: string): Promise<void> {
  memoryCovers.delete(id);
  const database = await openDatabase();
  if (!database) return;
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Unable to remove cover image"));
  });
}
