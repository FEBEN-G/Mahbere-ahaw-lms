import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface OfflineDashboardSnapshot {
  unlockedMonth: number;
  currentMonthCourses: Array<{
    id: string;
    title: string;
    description: string | null;
    monthNumber: number;
    moduleCount: number;
    assignmentCount: number;
  }>;
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
  availableCourses: number;
  submissionsCount: number;
  publishedGradesCount: number;
  firstName: string;
  savedAt: string;
}

interface OfflineDb extends DBSchema {
  courses: {
    key: string;
    value: {
      id: string;
      title: string;
      description: string | null;
      monthNumber: number;
      downloadedAt: string;
      payload: unknown;
    };
  };
  files: {
    key: string;
    value: {
      attachmentId: string;
      courseId: string;
      title: string;
      mimeType: string;
      blob: Blob;
    };
  };
  assignmentPrompts: {
    key: string;
    value: {
      assignmentId: string;
      courseId: string;
      title: string;
      originalName: string;
      mimeType: string;
      blob: Blob;
      downloadedAt: string;
    };
  };
  snapshots: {
    key: string;
    value: {
      id: string;
      dashboard: OfflineDashboardSnapshot;
    };
  };
}

const DB_NAME = "lms-offline";
const DB_VERSION = 3;
const DASHBOARD_SNAPSHOT_ID = "student-dashboard";

let dbPromise: Promise<IDBPDatabase<OfflineDb>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("courses")) {
          db.createObjectStore("courses", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files", { keyPath: "attachmentId" });
        }
        if (!db.objectStoreNames.contains("assignmentPrompts")) {
          db.createObjectStore("assignmentPrompts", {
            keyPath: "assignmentId",
          });
        }
        if (!db.objectStoreNames.contains("snapshots")) {
          db.createObjectStore("snapshots", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveOfflineCourse(input: {
  id: string;
  title: string;
  description: string | null;
  monthNumber: number;
  payload: unknown;
}) {
  const db = await getDb();
  await db.put("courses", {
    ...input,
    downloadedAt: new Date().toISOString(),
  });
}

export async function getOfflineCourse(id: string) {
  const db = await getDb();
  return db.get("courses", id);
}

export async function listOfflineCourses() {
  const db = await getDb();
  return db.getAll("courses");
}

export async function saveOfflineFile(input: {
  attachmentId: string;
  courseId: string;
  title: string;
  mimeType: string;
  blob: Blob;
}) {
  const db = await getDb();
  await db.put("files", input);
}

export async function getOfflineFile(attachmentId: string) {
  const db = await getDb();
  return db.get("files", attachmentId);
}

export async function saveOfflineAssignmentPrompt(input: {
  assignmentId: string;
  courseId: string;
  title: string;
  originalName: string;
  mimeType: string;
  blob: Blob;
}) {
  const db = await getDb();
  await db.put("assignmentPrompts", {
    ...input,
    downloadedAt: new Date().toISOString(),
  });
}

export async function getOfflineAssignmentPrompt(assignmentId: string) {
  const db = await getDb();
  return db.get("assignmentPrompts", assignmentId);
}

export async function saveStudentDashboardSnapshot(
  dashboard: Omit<OfflineDashboardSnapshot, "savedAt">,
) {
  const db = await getDb();
  await db.put("snapshots", {
    id: DASHBOARD_SNAPSHOT_ID,
    dashboard: {
      ...dashboard,
      savedAt: new Date().toISOString(),
    },
  });
}

export async function getStudentDashboardSnapshot() {
  const db = await getDb();
  const row = await db.get("snapshots", DASHBOARD_SNAPSHOT_ID);
  return row?.dashboard ?? null;
}

export async function clearOfflineCache() {
  const db = await getDb();
  await db.clear("courses");
  await db.clear("files");
  if (db.objectStoreNames.contains("assignmentPrompts")) {
    await db.clear("assignmentPrompts");
  }
  if (db.objectStoreNames.contains("snapshots")) {
    await db.clear("snapshots");
  }
}
