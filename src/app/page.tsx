import Timetable from "@/components/Timetable";
import { getClasses, getLessons, getRooms, getTeachers, getTimeRows } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function Page() {
  const lessons = getLessons();
  const classes = getClasses();
  const teachers = getTeachers();
  const rooms = getRooms();
  const timeRows = getTimeRows();

  return (
    <Timetable
      lessons={lessons}
      classes={classes}
      teachers={teachers}
      rooms={rooms}
      timeRows={timeRows}
    />
  );
}
