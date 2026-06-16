export function getRoomFloor(room: string) {
  if (!room) return "Ruum puudub";

  const first = room.trim().charAt(0);

  if (first === "1") return "1. korrus";
  if (first === "2") return "2. korrus";
  if (first === "3") return "3. korrus";
  if (first === "4") return "4. korrus";

  return "Korrust ei leitud";
}
