"use client";

import { useEffect, useState } from "react";
import type { Lesson, OptionItem, TimeRow } from "@/lib/db";
import ScheduleTable from "@/components/ScheduleTable";

const days = [
  { key: "monday", label: "Esmaspäev" },
  { key: "tuesday", label: "Teisipäev" },
  { key: "wednesday", label: "Kolmapäev" },
  { key: "thursday", label: "Neljapäev" },
  { key: "friday", label: "Reede" },
];

function lessonHasClass(lesson: Lesson, className: string) {
  const classList = lesson.class_name.split(" ");
  return classList.includes(className);
}

function lessonOverlapsTime(lesson: Lesson, day: string, time: TimeRow) {
  if (lesson.day !== day) return false;

  return lesson.start_time < time.end_time && lesson.end_time > time.start_time;
}

type SavedSelection = {
  type: string;
  value: string;
};

export default function Timetable({
  lessons,
  classes,
  teachers,
  rooms,
  timeRows,
}: {
  lessons: Lesson[];
  classes: OptionItem[];
  teachers: OptionItem[];
  rooms: OptionItem[];
  timeRows: TimeRow[];
}) {
  const [className, setClassName] = useState(classes[0]?.name || "");
  const [teacherName, setTeacherName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [showFreeRooms, setShowFreeRooms] = useState(false);
  const [freeDay, setFreeDay] = useState("monday");
  const [freeTime, setFreeTime] = useState(
    timeRows[0]?.start_time + " - " + timeRows[0]?.end_time
  );
  const [savedSelection, setSavedSelection] = useState<SavedSelection | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("saved_timetable_selection");

    if (!saved) return;

    const data = JSON.parse(saved);
    setSavedSelection(data);

    if (data.type === "klass") {
      setClassName(data.value);
      setTeacherName("");
      setRoomName("");
    }

    if (data.type === "teacher") {
      setTeacherName(data.value);
      setClassName("");
      setRoomName("");
    }

    if (data.type === "room") {
      setRoomName(data.value);
      setClassName("");
      setTeacherName("");
    }
  }, []);

  let selectedLessons = lessons;
  let selectedText = className;
  let selectedType = "klass";

  if (teacherName !== "") {
    selectedLessons = lessons.filter((lesson) => lesson.teacher === teacherName);
    selectedText = teacherName;
    selectedType = "teacher";
  } else if (roomName !== "") {
    selectedLessons = lessons.filter((lesson) => lesson.room === roomName);
    selectedText = roomName;
    selectedType = "room";
  } else {
    selectedLessons = lessons.filter((lesson) => lessonHasClass(lesson, className));
  }

  const currentSelection = {
    type: selectedType,
    value: selectedText,
  };

  const isCurrentPlanSaved =
    savedSelection !== null &&
    savedSelection.type === currentSelection.type &&
    savedSelection.value === currentSelection.value;

  function saveSelection() {
    if (isCurrentPlanSaved) {
      localStorage.removeItem("saved_timetable_selection");
      setSavedSelection(null);
      return;
    }

    localStorage.setItem(
      "saved_timetable_selection",
      JSON.stringify(currentSelection)
    );

    setSavedSelection(currentSelection);
  }

  function chooseClass(value: string) {
    setClassName(value);
    setTeacherName("");
    setRoomName("");
  }

  function chooseTeacher(value: string) {
    setTeacherName(value);
    setClassName("");
    setRoomName("");
  }

  function chooseRoom(value: string) {
    setRoomName(value);
    setClassName("");
    setTeacherName("");
  }

  const selectedFreeTime = timeRows.find(
    (time) => freeTime === time.start_time + " - " + time.end_time
  );

  let freeRooms = rooms.map((room) => room.name);

  if (selectedFreeTime) {
    const busyRooms = lessons
      .filter((lesson) => lessonOverlapsTime(lesson, freeDay, selectedFreeTime))
      .map((lesson) => lesson.room)
      .filter((room) => room !== "");

    freeRooms = freeRooms.filter((room) => !busyRooms.includes(room));
  }

  return (
    <main className="min-h-screen bg-white p-3 text-black md:p-5">
      <header className="relative mb-6 border-b border-black pb-4 md:min-h-20">
        <div className="mb-3 flex justify-center md:absolute md:left-0 md:top-[45%] md:mb-0 md:-translate-y-1/2 md:items-center">
          <img
            src="/plg-logo.png"
            alt="Pelgulinna Gümnaasium"
            className="h-14 w-48 object-contain object-left md:h-16 md:w-56"
          />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold md:text-2xl">PLG tunniplaan 2025/26</h1>
          <p className="text-sm">Õppeperiood V</p>
        </div>

        <button
          onClick={saveSelection}
          className="mt-4 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 md:absolute md:right-0 md:top-1/2 md:mt-0 md:w-auto md:-translate-y-1/2"
        >
          {isCurrentPlanSaved ? "Salvestatud" : "Salvesta"}
        </button>
      </header>

      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-semibold">Klass</label>
          <select
            value={className}
            onChange={(event) => chooseClass(event.target.value)}
            className="w-full border border-black bg-white p-2"
          >
            {classes.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Õpetaja</label>
          <select
            value={teacherName}
            onChange={(event) => chooseTeacher(event.target.value)}
            className="w-full border border-black bg-white p-2"
          >
            <option value="">Vali õpetaja</option>
            {teachers.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Ruum</label>
          <select
            value={roomName}
            onChange={(event) => chooseRoom(event.target.value)}
            className="w-full border border-black bg-white p-2"
          >
            <option value="">Vali ruum</option>
            {rooms.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[190px_1fr]">
        <aside className="border-slate-300 text-sm lg:border-r lg:pr-4">
          <p className="mb-3 font-bold">Filtrid</p>

          <label className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={showFreeRooms}
              onChange={(event) => setShowFreeRooms(event.target.checked)}
            />
            Näita vabu ruume
          </label>

          {showFreeRooms && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block">Päev</label>
                <select
                  value={freeDay}
                  onChange={(event) => setFreeDay(event.target.value)}
                  className="w-full border border-black bg-white p-2"
                >
                  {days.map((day) => (
                    <option key={day.key} value={day.key}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block">Aeg</label>
                <select
                  value={freeTime}
                  onChange={(event) => setFreeTime(event.target.value)}
                  className="w-full border border-black bg-white p-2"
                >
                  {timeRows.map((time) => (
                    <option
                      key={time.start_time + "-" + time.end_time}
                      value={time.start_time + " - " + time.end_time}
                    >
                      {time.start_time} - {time.end_time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 font-semibold">Vabad ruumid</p>
                <div className="max-h-60 overflow-auto border border-slate-300 p-2">
                  {freeRooms.map((room) => (
                    <p key={room}>{room}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>

        <section className="min-w-0">
          <p className="mb-3 text-lg font-bold">{selectedText}</p>

          <ScheduleTable
            lessons={selectedLessons}
            timeRows={timeRows}
            selectedType={selectedType}
          />
        </section>
      </div>
    </main>
  );
}
