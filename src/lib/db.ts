import path from "path";
import Database from "better-sqlite3";

const dbPath = path.join(process.cwd(), "data", "database", "timetable.db");

export type Lesson = {
  id: string;
  source_id: string;
  day: string;
  start_time: string;
  end_time: string;
  subject: string;
  class_name: string;
  teacher: string;
  room: string;
  subject_color: string;
};

export type OptionItem = {
  name: string;
};

export type TimeRow = {
  start_time: string;
  end_time: string;
};

function openDb() {
  return new Database(dbPath, { readonly: true });
}

export function getLessons() {
  const db = openDb();
  const rows = db
    .prepare("SELECT * FROM lessons ORDER BY day, start_time, end_time")
    .all();
  db.close();
  return rows as Lesson[];
}

export function getClasses() {
  const db = openDb();
  const rows = db
    .prepare("SELECT DISTINCT class_name FROM lessons WHERE class_name != '' ORDER BY class_name")
    .all() as { class_name: string }[];
  db.close();

  const classNames: string[] = [];

  for (const row of rows) {
    const parts = row.class_name.split(" ");

    for (const part of parts) {
      if (part !== "" && !classNames.includes(part)) {
        classNames.push(part);
      }
    }
  }

  classNames.sort();

  return classNames.map((name) => ({ name }));
}

export function getTeachers() {
  const db = openDb();
  const rows = db
    .prepare("SELECT DISTINCT teacher AS name FROM lessons WHERE teacher != '' ORDER BY teacher")
    .all();
  db.close();
  return rows as OptionItem[];
}

export function getRooms() {
  const db = openDb();
  const rows = db
    .prepare("SELECT DISTINCT room AS name FROM lessons WHERE room != '' ORDER BY room")
    .all();
  db.close();
  return rows as OptionItem[];
}

export function getTimeRows() {
  const db = openDb();
  const rows = db
    .prepare(
      `
      SELECT DISTINCT start_time, end_time
      FROM lessons
      WHERE start_time != '' AND end_time != ''
      ORDER BY start_time, end_time
      `
    )
    .all() as TimeRow[];
  db.close();

  const standardRows = rows.filter((row) => {
    const start = row.start_time;
    const end = row.end_time;

    return (
      (start === "08:45" && end === "10:00") ||
      (start === "10:15" && end === "11:30") ||
      (start === "12:00" && end === "13:15") ||
      (start === "13:30" && end === "14:45") ||
      (start === "15:00" && end === "16:15")
    );
  });

  if (standardRows.length > 0) {
    return standardRows;
  }

  return rows;
}
