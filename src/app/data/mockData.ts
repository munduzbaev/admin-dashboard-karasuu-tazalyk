export type Status = "new" | "in_progress" | "completed" | "rejected";
export type Category = "waste" | "complaint" | "road" | "lighting" | "other";

export interface MediaItem {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
}

export interface Message {
  id: string;
  sender: "operator" | "user";
  text: string;
  timestamp: string;
}

export interface Application {
  id: string;
  status: Status;
  category: Category;
  address: string;
  phone: string;
  date: string;
  description: string;
  media: MediaItem[];
  messages: Message[];
  assignedTo?: string;
}

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: "REQ-0041",
    status: "new",
    category: "waste",
    address: "ул. Абая 12, Алматы",
    phone: "+7 701 234 5678",
    date: "2026-05-06T08:32:00",
    description:
      "Мусорные баки переполнены уже несколько дней. Неприятный запах распространяется по всему двору. Просьба организовать вывоз мусора как можно скорее.",
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1762805544541-291320022a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc3RyZWV0JTIwZ2FyYmFnZSUyMHdhc3RlJTIwbXVuaWNpcGFsfGVufDF8fHx8MTc3ODA1Mzc1NXww&ixlib=rb-4.1.0&q=80&w=1080",
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1774279596759-ca64d41a4e53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYmFuZG9uZWQlMjB0cmFzaCUyMHBpbGUlMjBzdHJlZXR8ZW58MXx8fHwxNzc4MDUzNzU4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      },
      {
        type: "video",
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        thumbnail:
          "https://images.unsplash.com/photo-1665414649127-cb09b6c710af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMG5laWdoYm9yaG9vZCUyMGNvbXBsYWludCUyMGRhbWFnZXxlbnwxfHx8fDE3NzgwNTM3NTV8MA&ixlib=rb-4.1.0&q=80&w=400",
      },
    ],
    messages: [
      {
        id: "m1",
        sender: "user",
        text: "Здравствуйте! Хочу сообщить о переполненных мусорных баках во дворе.",
        timestamp: "2026-05-06T08:30:00",
      },
      {
        id: "m2",
        sender: "operator",
        text: "Здравствуйте! Заявка принята. Уточните, пожалуйста, точный адрес.",
        timestamp: "2026-05-06T08:35:00",
      },
      {
        id: "m3",
        sender: "user",
        text: "ул. Абая 12, во дворе 3-го подъезда",
        timestamp: "2026-05-06T08:36:00",
      },
    ],
  },
  {
    id: "REQ-0040",
    status: "in_progress",
    category: "road",
    address: "пр. Назарбаева 45, Алматы",
    phone: "+7 702 345 6789",
    date: "2026-05-05T14:15:00",
    description:
      "На проезжей части образовалась большая яма глубиной около 20 см. Опасно для автомобилей, особенно в ночное время.",
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1539034629914-0e70a1243587?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm9rZW4lMjByb2FkJTIwcG90aG9sZSUyMGluZnJhc3RydWN0dXJlfGVufDF8fHx8MTc3ODA1Mzc1NXww&ixlib=rb-4.1.0&q=80&w=1080",
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1665414649127-cb09b6c710af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMG5laWdoYm9yaG9vZCUyMGNvbXBsYWludCUyMGRhbWFnZXxlbnwxfHx8fDE3NzgwNTM3NTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      },
    ],
    messages: [
      {
        id: "m1",
        sender: "user",
        text: "Большая яма на дороге, уже несколько машин пострадало.",
        timestamp: "2026-05-05T14:10:00",
      },
      {
        id: "m2",
        sender: "operator",
        text: "Спасибо за обращение. Передаём информацию в дорожную службу.",
        timestamp: "2026-05-05T14:20:00",
      },
    ],
    assignedTo: "Сергей К.",
  },
  {
    id: "REQ-0039",
    status: "completed",
    category: "lighting",
    address: "ул. Достык 78, Алматы",
    phone: "+7 705 456 7890",
    date: "2026-05-04T11:00:00",
    description:
      "Не работают 3 фонаря подряд вдоль тротуара. Темно и небезопасно вечером.",
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1665414649127-cb09b6c710af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMG5laWdoYm9yaG9vZCUyMGNvbXBsYWludCUyMGRhbWFnZXxlbnwxfHx8fDE3NzgwNTM3NTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      },
    ],
    messages: [
      {
        id: "m1",
        sender: "user",
        text: "Не горят фонари на участке ул. Достык 78-84.",
        timestamp: "2026-05-04T10:55:00",
      },
      {
        id: "m2",
        sender: "operator",
        text: "Заявка выполнена. Освещение восстановлено.",
        timestamp: "2026-05-05T09:00:00",
      },
    ],
    assignedTo: "Айгерим М.",
  },
  {
    id: "REQ-0038",
    status: "new",
    category: "complaint",
    address: "ул. Панфилова 3, Алматы",
    phone: "+7 707 567 8901",
    date: "2026-05-06T07:45:00",
    description:
      "Соседний магазин постоянно выкладывает товар на тротуар, блокируя проход. Просьба принять меры.",
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1762805544541-291320022a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc3RyZWV0JTIwZ2FyYmFnZSUyMHdhc3RlJTIwbXVuaWNpcGFsfGVufDF8fHx8MTc3ODA1Mzc1NXww&ixlib=rb-4.1.0&q=80&w=1080",
      },
    ],
    messages: [
      {
        id: "m1",
        sender: "user",
        text: "Магазин на Панфилова 3 занимает весь тротуар своим товаром.",
        timestamp: "2026-05-06T07:43:00",
      },
    ],
  },
  {
    id: "REQ-0037",
    status: "rejected",
    category: "other",
    address: "ул. Гоголя 22, Алматы",
    phone: "+7 708 678 9012",
    date: "2026-05-03T16:20:00",
    description: "Заявка не относится к компетенции данного отдела.",
    media: [],
    messages: [
      {
        id: "m1",
        sender: "user",
        text: "Вопрос о налоговых льготах для малого бизнеса.",
        timestamp: "2026-05-03T16:18:00",
      },
      {
        id: "m2",
        sender: "operator",
        text: "К сожалению, данный вопрос не входит в нашу компетенцию. Рекомендуем обратиться в налоговый орган.",
        timestamp: "2026-05-03T16:25:00",
      },
    ],
  },
  {
    id: "REQ-0036",
    status: "in_progress",
    category: "waste",
    address: "мкр. Алмагуль 7, Алматы",
    phone: "+7 701 789 0123",
    date: "2026-05-05T09:30:00",
    description:
      "Несанкционированная свалка строительного мусора в микрорайоне. Необходима ликвидация.",
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1774279596759-ca64d41a4e53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYmFuZG9uZWQlMjB0cmFzaCUyMHBpbGUlMjBzdHJlZXR8ZW58MXx8fHwxNzc4MDUzNzU4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1762805544541-291320022a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc3RyZWV0JTIwZ2FyYmFnZSUyMHdhc3RlJTIwbXVuaWNpcGFsfGVufDF8fHx8MTc3ODA1Mzc1NXww&ixlib=rb-4.1.0&q=80&w=1080",
      },
    ],
    messages: [
      {
        id: "m1",
        sender: "user",
        text: "В мкр. Алмагуль 7 образовалась несанкционированная свалка.",
        timestamp: "2026-05-05T09:25:00",
      },
      {
        id: "m2",
        sender: "operator",
        text: "Спасибо, передали в отдел по ликвидации несанкционированных свалок.",
        timestamp: "2026-05-05T09:40:00",
      },
    ],
    assignedTo: "Данияр А.",
  },
  {
    id: "REQ-0035",
    status: "completed",
    category: "complaint",
    address: "ул. Байтурсынова 55, Алматы",
    phone: "+7 702 890 1234",
    date: "2026-05-02T13:10:00",
    description: "Шумные работы проводились после 22:00, нарушение режима тишины.",
    media: [],
    messages: [],
    assignedTo: "Сергей К.",
  },
];

export const MOCK_OPERATORS = [
  {
    id: "op1",
    name: "Айгерим М.",
    email: "aigerim@city.kz",
    role: "Старший оператор",
    status: "active" as const,
    handled: 42,
    avatar: "АМ",
  },
  {
    id: "op2",
    name: "Сергей К.",
    email: "sergey@city.kz",
    role: "Оператор",
    status: "active" as const,
    handled: 31,
    avatar: "СК",
  },
  {
    id: "op3",
    name: "Данияр А.",
    email: "daniyar@city.kz",
    role: "Оператор",
    status: "active" as const,
    handled: 28,
    avatar: "ДА",
  },
  {
    id: "op4",
    name: "Мадина Р.",
    email: "madina@city.kz",
    role: "Оператор",
    status: "inactive" as const,
    handled: 15,
    avatar: "МР",
  },
];
