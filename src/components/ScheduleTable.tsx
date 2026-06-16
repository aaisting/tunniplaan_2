"use client";

import type { Lesson, TimeRow } from "@/lib/db";

const days = [
  { key: "monday", label: "Esmaspäev" },
  { key: "tuesday", label: "Teisipäev" },
  { key: "wednesday", label: "Kolmapäev" },
  { key: "thursday", label: "Neljapäev" },
  { key: "friday", label: "Reede" },
];

function sameLesson(first: Lesson, second: Lesson) {
  if (first.source_id !== "" && second.source_id !== "") {
    return first.source_id === second.source_id;
  }

  return (
    first.subject === second.subject &&
    first.class_name === second.class_name &&
    first.teacher === second.teacher &&
    first.room === second.room
  );
}

function LessonBlock({
  lesson,
  selectedType,
}: {
  lesson: Lesson;
  selectedType: string;
}) {
  return (
    <div
      className="h-full min-h-[92px] w-full rounded-lg border border-slate-200 p-3 text-left text-xs text-slate-950 shadow-sm transition hover:border-slate-400 hover:brightness-95"
      style={{ backgroundColor: lesson.subject_color || "#f1f5f9" }}
    >
      {lesson.subject.trim() !== "" && (
        <div className="break-words font-bold leading-tight">{lesson.subject}</div>
      )}

      {selectedType !== "klass" && lesson.class_name.trim() !== "" && (
        <div className="mt-1 break-words leading-tight">{lesson.class_name}</div>
      )}

      {selectedType !== "teacher" && lesson.teacher.trim() !== "" && (
        <div className="mt-1 break-words leading-tight">{lesson.teacher}</div>
      )}

      {selectedType !== "room" && lesson.room.trim() !== "" && (
        <div className="break-words leading-tight">{lesson.room}</div>
      )}
    </div>
  );
}

function getConnectedLessons({
  lesson,
  day,
  lessons,
  timeRows,
}: {
  lesson: Lesson;
  day: string;
  lessons: Lesson[];
  timeRows: TimeRow[];
}) {
  const connected = [lesson];
  let currentLesson = lesson;
  let currentIndex = timeRows.findIndex(
    (row) => row.start_time === lesson.start_time && row.end_time === lesson.end_time
  );

  while (currentIndex >= 0 && currentIndex < timeRows.length - 1) {
    const nextTime = timeRows[currentIndex + 1];

    const nextLesson = lessons.find(
      (item) =>
        item.day === day &&
        item.start_time === nextTime.start_time &&
        item.end_time === nextTime.end_time &&
        sameLesson(item, currentLesson)
    );

    if (!nextLesson) break;

    connected.push(nextLesson);
    currentLesson = nextLesson;
    currentIndex++;
  }

  return connected;
}

function isContinuation({
  lesson,
  day,
  lessons,
  timeRows,
}: {
  lesson: Lesson;
  day: string;
  lessons: Lesson[];
  timeRows: TimeRow[];
}) {
  const index = timeRows.findIndex((row) => row.start_time === lesson.start_time);

  if (index <= 0) return false;

  const previousTime = timeRows[index - 1];

  return lessons.some(
    (item) =>
      item.day === day &&
      item.start_time === previousTime.start_time &&
      item.end_time === previousTime.end_time &&
      sameLesson(item, lesson)
  );
}


function isContinuationAtTime({
  lessons,
  day,
  time,
  timeRows,
}: {
  lessons: Lesson[];
  day: string;
  time: TimeRow;
  timeRows: TimeRow[];
}) {
  return lessons.some((lesson) =>
    isContinuation({ lesson, day, lessons, timeRows }) &&
    lesson.day === day &&
    lesson.start_time === time.start_time
  );
}

function getMobileTimeText({
  lessons,
  day,
  time,
  timeRows,
}: {
  lessons: Lesson[];
  day: string;
  time: TimeRow;
  timeRows: TimeRow[];
}) {
  const cellLessons = getStartLessonsForCell({ lessons, day, time, timeRows });

  if (cellLessons.length === 0) {
    return time.start_time + " - " + time.end_time;
  }

  let latestEndTime = time.end_time;

  for (const lesson of cellLessons) {
    const endTime = getLessonEndTime({ lesson, day, lessons, timeRows });

    if (endTime > latestEndTime) {
      latestEndTime = endTime;
    }
  }

  return time.start_time + " - " + latestEndTime;
}

function getStartLessonsForCell({
  lessons,
  day,
  time,
  timeRows,
}: {
  lessons: Lesson[];
  day: string;
  time: TimeRow;
  timeRows: TimeRow[];
}) {
  return lessons.filter(
    (lesson) =>
      lesson.day === day &&
      lesson.start_time === time.start_time &&
      !isContinuation({ lesson, day, lessons, timeRows })
  );
}

function cellHasOnlyLongLessonContinuation({
  lessons,
  day,
  time,
  timeRows,
}: {
  lessons: Lesson[];
  day: string;
  time: TimeRow;
  timeRows: TimeRow[];
}) {
  return lessons.some(
    (lesson) =>
      lesson.day === day &&
      lesson.start_time < time.start_time &&
      lesson.end_time > time.start_time
  );
}

function getTimeIndex(timeRows: TimeRow[], startTime: string) {
  return timeRows.findIndex((row) => row.start_time === startTime);
}

function getSpan(timeRows: TimeRow[], startTime: string, endTime: string) {
  let span = 0;

  for (const row of timeRows) {
    if (row.start_time >= startTime && row.end_time <= endTime) {
      span++;
    }
  }

  if (span < 1) return 1;

  return span;
}

function getLessonEndTime({
  lesson,
  day,
  lessons,
  timeRows,
}: {
  lesson: Lesson;
  day: string;
  lessons: Lesson[];
  timeRows: TimeRow[];
}) {
  const connected = getConnectedLessons({ lesson, day, lessons, timeRows });

  if (connected.length > 1) {
    return connected[connected.length - 1].end_time;
  }

  return lesson.end_time;
}

function getRowHeight({
  row,
  lessons,
  timeRows,
}: {
  row: TimeRow;
  lessons: Lesson[];
  timeRows: TimeRow[];
}) {
  let biggestCount = 1;

  for (const day of days) {
    const cellLessons = getStartLessonsForCell({
      lessons,
      day: day.key,
      time: row,
      timeRows,
    });

    if (cellLessons.length > biggestCount) {
      biggestCount = cellLessons.length;
    }
  }

  return Math.max(150, biggestCount * 115 + 24);
}

function sumHeights(rowHeights: number[], startIndex: number, span: number) {
  let total = 0;

  for (let i = startIndex; i < startIndex + span; i++) {
    total += rowHeights[i] || 150;
  }

  return total;
}

export default function ScheduleTable({
  lessons,
  timeRows,
  selectedType,
}: {
  lessons: Lesson[];
  timeRows: TimeRow[];
  selectedType: string;
}) {
  const headerHeight = 52;
  const rowHeights = timeRows.map((row) =>
    getRowHeight({ row, lessons, timeRows })
  );

  return (
    <>
      <div className="block md:hidden">
        <div className="space-y-4">
          {days.map((day) => (
            <div
              key={day.key}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-center font-semibold">
                {day.label}
              </div>

              {timeRows.map((time) => {
                const cellLessons = getStartLessonsForCell({
                  lessons,
                  day: day.key,
                  time,
                  timeRows,
                });

                const isLongLessonContinuation = cellHasOnlyLongLessonContinuation({
                  lessons,
                  day: day.key,
                  time,
                  timeRows,
                });

                const isSplitLessonContinuation = isContinuationAtTime({
                  lessons,
                  day: day.key,
                  time,
                  timeRows,
                });

                if (
                  cellLessons.length === 0 &&
                  (isLongLessonContinuation || isSplitLessonContinuation)
                ) {
                  return null;
                }

                const mobileTimeText = getMobileTimeText({
                  lessons,
                  day: day.key,
                  time,
                  timeRows,
                });

                return (
                  <div
                    key={`${day.key}-${time.start_time}`}
                    className="border-b border-slate-200 p-3 last:border-b-0"
                  >
                    <div className="mb-2 text-xs font-semibold text-slate-700">
                      {mobileTimeText}
                    </div>

                    <div className="space-y-2">
                      {cellLessons.length === 0 && (
                        <div className="text-xs text-slate-400">Tunde ei ole</div>
                      )}

                      {cellLessons.map((lesson) => (
                        <LessonBlock
                          key={lesson.id}
                          lesson={lesson}
                          selectedType={selectedType}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <div
            className="grid w-full min-w-[1280px] text-sm"
            style={{
              gridTemplateColumns: "110px repeat(5, minmax(220px, 1fr))",
              gridTemplateRows:
                `${headerHeight}px ` + rowHeights.map((height) => `${height}px`).join(" "),
            }}
          >
            <div className="border-b border-r border-slate-200 bg-slate-50" />

            {days.map((day, index) => (
              <div
                key={day.key}
                className="border-b border-r border-slate-200 bg-slate-50 px-3 py-4 text-center font-semibold"
                style={{ gridColumn: index + 2, gridRow: 1 }}
              >
                {day.label}
              </div>
            ))}

            {timeRows.map((time, index) => (
              <div
                key={`${time.start_time}-${time.end_time}`}
                className="border-b border-r border-slate-200 bg-slate-50 px-2 py-6 text-center text-slate-700"
                style={{ gridColumn: 1, gridRow: index + 2 }}
              >
                {time.start_time} - {time.end_time}
              </div>
            ))}

            {days.map((day, dayIndex) =>
              timeRows.map((time, rowIndex) => (
                <div
                  key={`${day.key}-${time.start_time}-cell`}
                  className="border-b border-r border-slate-200"
                  style={{ gridColumn: dayIndex + 2, gridRow: rowIndex + 2 }}
                />
              ))
            )}

            {days.map((day, dayIndex) =>
              timeRows.map((time) => {
                const cellLessons = getStartLessonsForCell({
                  lessons,
                  day: day.key,
                  time,
                  timeRows,
                });

                if (cellLessons.length === 0) return null;

                const startIndex = getTimeIndex(timeRows, time.start_time);
                let biggestSpan = 1;

                const lessonBlocks = cellLessons.map((lesson) => {
                  const endTime = getLessonEndTime({
                    lesson,
                    day: day.key,
                    lessons,
                    timeRows,
                  });
                  const span = getSpan(timeRows, lesson.start_time, endTime);

                  if (span > biggestSpan) {
                    biggestSpan = span;
                  }

                  return { lesson, span };
                });

                return (
                  <div
                    key={`${day.key}-${time.start_time}-lessons`}
                    className={
                      biggestSpan > 1
                        ? "z-20 border-b border-r border-slate-200 bg-white p-2"
                        : "z-20 p-2"
                    }
                    style={{
                      gridColumn: dayIndex + 2,
                      gridRow: `${startIndex + 2} / span ${biggestSpan}`,
                    }}
                  >
                    <div className="flex h-full flex-col gap-2">
                      {lessonBlocks.map((item) => {
                        return (
                          <div
                            key={item.lesson.id}
                            className="min-h-0 flex-1"
                            style={{
                              flexGrow: item.span,
                            }}
                          >
                            <LessonBlock lesson={item.lesson} selectedType={selectedType} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
