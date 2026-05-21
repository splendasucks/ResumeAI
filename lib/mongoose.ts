import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  memoryServer: { getUri: () => string } | null;
  lastUri: string | null;
};

const debugLog = (
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
  runId = "pre-fix"
) => {
  // #region agent log
  fetch("http://127.0.0.1:7830/ingest/c357e084-9847-4c11-997e-68e2cfaa8db9", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "467421",
    },
    body: JSON.stringify({
      sessionId: "467421",
      location,
      message,
      data,
      hypothesisId,
      timestamp: Date.now(),
      runId,
    }),
  }).catch(() => {});
  // #endregion
};

const uriKind = (uri: string) =>
  uri.startsWith("mongodb://127.0.0.1") || uri.includes("127.0.0.1")
    ? "memory"
    : uri.startsWith("mongodb+srv")
      ? "atlas"
      : "other";

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
  memoryServer: null,
  lastUri: null,
};

global.mongooseCache = cache;

async function resolveMongoUri(): Promise<string> {
  if (process.env.USE_MEMORY_MONGO === "true") {
    if (!cache.memoryServer) {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      cache.memoryServer = await MongoMemoryServer.create();
      console.log("In-memory MongoDB started");
      debugLog(
        "lib/mongoose.ts:resolveMongoUri",
        "memory server created",
        { hadMemoryServer: false },
        "H4"
      );
    }
    return cache.memoryServer.getUri();
  }

  if (!process.env.MONGODB_URL) {
    throw new Error("MongoDB URL not found");
  }

  return process.env.MONGODB_URL;
}

export const connectToDB = async () => {
  mongoose.set("strictQuery", true);

  debugLog(
    "lib/mongoose.ts:connectToDB:entry",
    "connectToDB called",
    {
      readyState: mongoose.connection.readyState,
      hasCacheConn: !!cache.conn,
      hasCachePromise: !!cache.promise,
      hasMemoryServer: !!cache.memoryServer,
      lastUriKind: cache.lastUri ? uriKind(cache.lastUri) : null,
      useMemoryMongo: process.env.USE_MEMORY_MONGO === "true",
    },
    "H1"
  );

  if (cache.conn) {
    debugLog(
      "lib/mongoose.ts:connectToDB:cache-hit",
      "returning cached conn",
      { readyState: mongoose.connection.readyState },
      "H1"
    );
    return cache.conn;
  }

  // HMR resets module cache but keeps the global mongoose connection alive.
  if (mongoose.connection.readyState === 1) {
    cache.conn = mongoose;
    cache.lastUri = cache.lastUri ?? mongoose.connection.host;
    debugLog(
      "lib/mongoose.ts:connectToDB:reuse-active",
      "reusing existing mongoose connection after cache reset",
      {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host || null,
        hasMemoryServer: !!cache.memoryServer,
      },
      "H2",
      "post-fix"
    );
    return cache.conn;
  }

  const uri = await resolveMongoUri();
  const resolvedKind = uriKind(uri);

  debugLog(
    "lib/mongoose.ts:connectToDB:uri-resolved",
    "resolved mongo uri",
    {
      resolvedKind,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || null,
      lastUriKind: cache.lastUri ? uriKind(cache.lastUri) : null,
      uriMismatch: cache.lastUri !== null && cache.lastUri !== uri,
    },
    "H5"
  );

  if (cache.lastUri && cache.lastUri !== uri) {
    debugLog(
      "lib/mongoose.ts:connectToDB:stale-connection",
      "active connection uri differs from resolved uri",
      {
        resolvedKind,
        lastUriKind: uriKind(cache.lastUri),
        host: mongoose.connection.host || null,
      },
      "H2"
    );
  }

  if (!cache.promise) {
    debugLog(
      "lib/mongoose.ts:connectToDB:before-connect",
      "starting mongoose.connect",
      {
        resolvedKind,
        readyState: mongoose.connection.readyState,
      },
      "H3"
    );
    cache.promise = mongoose.connect(uri).then((mongooseInstance) => {
      console.log("MongoDB connected");
      cache.lastUri = uri;
      debugLog(
        "lib/mongoose.ts:connectToDB:connected",
        "mongoose.connect succeeded",
        {
          resolvedKind,
          readyState: mongooseInstance.connection.readyState,
          host: mongooseInstance.connection.host || null,
        },
        "H3"
      );
      return mongooseInstance;
    });
  } else {
    debugLog(
      "lib/mongoose.ts:connectToDB:await-promise",
      "awaiting existing connect promise",
      { resolvedKind, readyState: mongoose.connection.readyState },
      "H3"
    );
  }

  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    debugLog(
      "lib/mongoose.ts:connectToDB:error",
      "mongoose.connect failed",
      {
        message,
        resolvedKind,
        readyState: mongoose.connection.readyState,
        lastUriKind: cache.lastUri ? uriKind(cache.lastUri) : null,
      },
      "H1"
    );
    throw error;
  }
};
