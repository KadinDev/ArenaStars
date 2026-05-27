import type { TrainingDay } from "@/types/database";

const weekdays: Record<TrainingDay, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
};

const labels: Record<TrainingDay, string> = {
  domingo: "Domingo",
  segunda: "Segunda",
  terca: "Terca",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sabado",
};

export function formatShortDate(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function formatFullDate(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    //weekday: "short", // Dia da semana
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function nextTrainings(limit = 2) {
  const today = new Date();
  const items: Array<{ day: TrainingDay; date: Date }> = [];

  for (let offset = 0; items.length < limit && offset < 14; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const day = (Object.keys(weekdays) as TrainingDay[]).find(
      (key) => weekdays[key] === date.getDay(),
    );

    if (day) {
      items.push({ day, date });
    }
  }

  return items;
}

export function dayLabel(day: TrainingDay | "geral") {
  if (day === "geral") return "Geral";
  return labels[day];
}

export function dayFromDate(value: string | Date): TrainingDay {
  const weekday = new Date(value).getDay();
  const day = (Object.keys(weekdays) as TrainingDay[]).find(
    (key) => weekdays[key] === weekday,
  );
  return day ?? "segunda";
}
