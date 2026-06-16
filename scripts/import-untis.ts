import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { XMLParser } from "fast-xml-parser";

const xmlPath = path.join(process.cwd(), "data", "incoming", "untis.xml");
const dbPath = path.join(process.cwd(), "data", "database", "timetable.db");

function asArray(value: any) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function cleanId(id: any, prefix: string) {
  if (!id) return "";

  return String(id)
    .split(" ")
    .map((part) => part.replace(prefix, ""))
    .join(" ");
}

function formatTime(time: any) {
  if (!time) return "";
  const text = String(time).padStart(4, "0");
  return text.slice(0, 2) + ":" + text.slice(2, 4);
}

function dayName(day: any) {
  if (String(day) === "1") return "monday";
  if (String(day) === "2") return "tuesday";
  if (String(day) === "3") return "wednesday";
  if (String(day) === "4") return "thursday";
  if (String(day) === "5") return "friday";
  return "";
}

function subjectFromGroupId(id: any) {
  if (!id) return "";

  const clean = String(id).replace("SG_", "");
  const parts = clean.split("_");

  if (parts.length === 0) return "";

  return parts[0];
}

function makeTables(db: any) {
  db.exec(`
    DROP TABLE IF EXISTS lessons;

    CREATE TABLE lessons (
      id TEXT PRIMARY KEY,
      source_id TEXT,
      day TEXT,
      start_time TEXT,
      end_time TEXT,
      subject TEXT,
      class_name TEXT,
      teacher TEXT,
      room TEXT,
      subject_color TEXT
    );
  `);
}

if (!fs.existsSync(xmlPath)) {
  throw new Error("XML faili ei leitud: " + xmlPath);
}

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const xmlText = fs.readFileSync(xmlPath, "utf8");

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
});

const result = parser.parse(xmlText);
const document = result.document;

if (!document) {
  throw new Error("XML failis puudub document osa.");
}

const db = new Database(dbPath);
makeTables(db);

const insertLesson = db.prepare(`
  INSERT INTO lessons (
    id,
    source_id,
    day,
    start_time,
    end_time,
    subject,
    class_name,
    teacher,
    room,
    subject_color
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const subjectColors = new Map();
const subjects = asArray(document.subjects?.subject);

for (const subject of subjects) {
  const name = cleanId(subject.id, "SU_");
  const color = subject.backcolor || "#f1f5f9";

  if (name !== "") {
    subjectColors.set(name, color);
  }
}

const studentGroupData = new Map();
const studentGroups = asArray(document.studentgroups?.studentgroup);

for (const group of studentGroups) {
  let subject = cleanId(group.subject?.id, "SU_");

  if (subject === "") {
    subject = subjectFromGroupId(group.id);
  }

  const groupClasses = asArray(group.classes?.class)
    .map((item: any) => cleanId(item.id, "CL_"))
    .filter((name: string) => name !== "")
    .join(" ");

  studentGroupData.set(group.id, {
    subject,
    className: groupClasses,
  });
}

const lessons = asArray(document.lessons?.lesson);
let count = 0;

for (const lesson of lessons) {
  let subject = cleanId(lesson.lesson_subject?.id, "SU_");
  const teacher = cleanId(lesson.lesson_teacher?.id, "TR_");
  let className = cleanId(lesson.lesson_classes?.id, "CL_");

  const groupIds = String(lesson.lesson_studentgroups?.id || "").split(" ");

  for (const groupId of groupIds) {
    const group = studentGroupData.get(groupId);

    if (group) {
      if (subject === "" && group.subject !== "") subject = group.subject;
      if (className === "" && group.className !== "") className = group.className;
    }
  }

  if (subject === "") {
    subject = subjectFromGroupId(groupIds[0]);
  }

  const color = subjectColors.get(subject) || "#f1f5f9";
  const times = asArray(lesson.times?.time);

  for (const time of times) {
    const day = dayName(time.assigned_day);
    const startTime = formatTime(time.assigned_starttime);
    const endTime = formatTime(time.assigned_endtime);
    const room = cleanId(time.assigned_room?.id, "RM_");

    if (day === "" || startTime === "" || endTime === "") {
      continue;
    }

    insertLesson.run(
      lesson.id + "_" + count,
      lesson.id,
      day,
      startTime,
      endTime,
      subject,
      className,
      teacher,
      room,
      color
    );

    count++;
  }
}

db.close();
console.log("koik tootab");
