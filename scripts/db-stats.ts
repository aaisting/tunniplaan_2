import path from "path";
import Database from "better-sqlite3";

const dbPath = path.join(process.cwd(), "data", "database", "timetable.db");
const db = new Database(dbPath, { readonly: true });

const lessonCount = db.prepare("SELECT COUNT(*) as count FROM lessons").get() as { count: number };
const classCount = db.prepare("SELECT COUNT(DISTINCT class_name) as count FROM lessons WHERE class_name != ''").get() as { count: number };
const teacherCount = db.prepare("SELECT COUNT(DISTINCT teacher) as count FROM lessons WHERE teacher != ''").get() as { count: number };
const roomCount = db.prepare("SELECT COUNT(DISTINCT room) as count FROM lessons WHERE room != ''").get() as { count: number };

console.log("Tunnikirjeid: " + lessonCount.count);
console.log("Klassi gruppe: " + classCount.count);
console.log("Õpetajaid: " + teacherCount.count);
console.log("Ruume: " + roomCount.count);

db.close();
