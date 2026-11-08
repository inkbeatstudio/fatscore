import type { CharId, L10n } from '../types';

export type LineKind = 'hello' | 'empty' | 'meal' | 'water' | 'workout' | 'rest' | 'tap' | 'sleep' | 'mood' | 'habit' | 'back' | 'night' | 'record' | 'steps';

export interface CharDef {
  name: L10n; kind: L10n; vibe: L10n;
  fur: [string, string, string]; belly: [string, string]; feet: string; ear: string;
  lines: Record<LineKind, { uk: string[]; en: string[] }>;
}

export const CHARS: Record<CharId, CharDef> = {
  bear: {
    name: { uk: 'Бурко', en: 'Burko' }, kind: { uk: 'ведмідь', en: 'bear' },
    vibe: { uk: 'Спокійний добряк. Підтримує і ніколи не підганяє.', en: 'A calm big-hearted bear. Supportive, never pushy.' },
    fur: ['#D99467', '#B06A3E', '#8A4C2A'], belly: ['#FFE4C4', '#F4BE8E'], feet: '#9A5530', ear: '#F4BE8E',
    lines: {
      hello: { uk: ['Я тут. Без поспіху, крок за кроком.', 'Доброго дня! Почнемо з чогось маленького?', 'Радий тебе бачити.'], en: ['I\'m here. No rush, one step at a time.', 'Good day! Shall we start small?', 'So glad to see you.'] },
      empty: { uk: ['Що сьогодні на тарілці? Мені цікаво.', 'Почнемо зі склянки води?', 'Порожня тарілка — чиста сторінка.'], en: ['What\'s on the plate today? I\'m curious.', 'Start with a glass of water?', 'An empty plate is a fresh page.'] },
      meal: { uk: ['Смачно записали. Тарілка стає яскравішою.', 'Гарний вибір. Я б теж скуштував.', 'Записано! Будь-яка їжа — це енергія.'], en: ['Logged. The plate is getting brighter.', 'Nice choice. I\'d have a bite too.', 'Got it! All food is energy.'] },
      water: { uk: ['Ковток води, і м\'ята потягнулась угору.', 'Дякую! Листочок підріс.', 'Вода — моя улюблена звичка.'], en: ['A sip of water and the mint stretches up.', 'Thanks! A new leaf.', 'Water is my favourite habit.'] },
      workout: { uk: ['Ти рухався, і я відчуваю силу в лапах.', 'Чудова робота. Тепер можна видихнути.', 'Тренування записано. Я пишаюся.'], en: ['You moved and I feel strong in my paws.', 'Great work. Now breathe out.', 'Workout logged. I\'m proud of you.'] },
      rest: { uk: ['Відпочинок — теж частина плану.', 'Сьогодні відновлюємось. М\'язи кажуть дякую.', 'Тиша і плед. Ідеально.'], en: ['Rest is part of the plan too.', 'Recovery day. Your muscles say thanks.', 'Quiet and a blanket. Perfect.'] },
      tap: { uk: ['Хе-хе, лоскотно.', 'Я тут, поруч.', 'Обійми? Обійми.', 'Ти вже зробив щось для себе. Це важливо.'], en: ['Hehe, that tickles.', 'I\'m right here.', 'A hug? A hug.', 'You already did something for yourself. That matters.'] },
      sleep: { uk: ['Добре виспатись — половина справи.', 'Сон записано. Я теж позіхаю.'], en: ['Good sleep is half the work.', 'Sleep logged. Now I\'m yawning too.'] },
      mood: { uk: ['Дякую, що поділився. Будь-який настрій нормальний.', 'Я запам\'ятав. Подивимось, що тобі допомагає.'], en: ['Thanks for sharing. Every mood is okay.', 'Noted. Let\'s see what helps you.'] },
      habit: { uk: ['Ще одна маленька перемога.', 'Звичка за звичкою — і ось ти вже інший.'], en: ['Another small win.', 'Habit by habit, you grow.'] },
      back: { uk: ['Ти повернувся! Я сумував. Почнемо легенько?', 'Як добре, що ти тут. Ніяких докорів, просто продовжуємо.'], en: ['You\'re back! I missed you. Shall we start easy?', 'So good to see you. No guilt, we just carry on.'] },
      night: { uk: ['Хр-р... О, привіт. Я вже майже сплю.', 'Пізно. Може, теж час відпочити?'], en: ['Zzz... oh, hi. I\'m almost asleep.', 'It\'s late. Maybe time to rest too?'] },
      record: { uk: ['Новий рекорд! Я аж підстрибнув.', 'Сильніше, ніж учора. Вау.'], en: ['A new record! I jumped up.', 'Stronger than yesterday. Wow.'] },
      steps: { uk: ['Ходімо далі, мені цікаво, що за поворотом.', 'Кроки записано, мандруємо!'], en: ['Let\'s keep walking, I want to see what\'s next.', 'Steps logged, off we go!'] }
    }
  },
  hare: {
    name: { uk: 'Шустра', en: 'Zippy' }, kind: { uk: 'зайчиха', en: 'hare' },
    vibe: { uk: 'Енергійна тренерка. Жартує і кидає виклики.', en: 'An energetic coach. Jokes and friendly challenges.' },
    fur: ['#CBB8CC', '#A089A5', '#7B6481'], belly: ['#FBF3F5', '#E6D6DD'], feet: '#8E7593', ear: '#F4A7A0',
    lines: {
      hello: { uk: ['Розімнемось? Я вже на старті!', 'О, ти тут! Сьогодні буде гарний день.', 'Кросівки в мене завжди на лапах.'], en: ['Warm-up time? I\'m on the start line!', 'Oh, you\'re here! It\'s going to be a good day.', 'My sneakers are always on.'] },
      empty: { uk: ['Табло чисте. Почнемо з малого?', 'Спершу склянка води, потім підкорюємо світ.', 'Перше очко дня чекає на тебе.'], en: ['Scoreboard\'s empty. Start small?', 'Water first, then we conquer the world.', 'The first point of the day is waiting.'] },
      meal: { uk: ['Паливо прийнято! Біжимо далі.', 'Ням. М\'язи радіють.', 'Записали швидше, ніж я стрибаю.'], en: ['Fuel received! Let\'s go.', 'Yum. Muscles are happy.', 'Logged faster than I can jump.'] },
      water: { uk: ['Пити — це теж спорт. Ну майже.', 'Гідратація на рівні!', 'Ще ковток, і буде рекорд з води.'], en: ['Drinking is a sport too. Almost.', 'Hydration on point!', 'One more sip for the water record.'] },
      workout: { uk: ['Оце темп! Я ледь встигала.', 'Ще один день у копилку сили.', 'Тренування є! Дай лапу!'], en: ['What a pace! I could barely keep up.', 'Another day in the strength bank.', 'Workout done! High five!'] },
      rest: { uk: ['Навіть чемпіони відпочивають. Особливо чемпіони.', 'День відновлення. Завтра стрибнемо вище.'], en: ['Even champions rest. Especially champions.', 'Recovery day. Tomorrow we jump higher.'] },
      tap: { uk: ['Гей, я рахую стрибки!', 'Хочеш наввипередки?', 'Мої вуха чують, що ти класний.'], en: ['Hey, I\'m counting hops!', 'Race you?', 'My ears tell me you\'re awesome.'] },
      sleep: { uk: ['Сон — найкраще відновлення. Плюс бал!', 'Записала. Сонні м\'язи ростуть.'], en: ['Sleep is top-tier recovery. Point!', 'Logged. Muscles grow while you sleep.'] },
      mood: { uk: ['Прийнято! Знання — сила.', 'Дякую. Тренер має знати, як команда.'], en: ['Got it! Knowledge is power.', 'Thanks. A coach should know how the team feels.'] },
      habit: { uk: ['Галочка! Обожнюю галочки.', 'Звичка виконана, бонус зараховано.'], en: ['Check! I love checkmarks.', 'Habit done, bonus counted.'] },
      back: { uk: ['Камбек! Почнемо з розминки, без тиску.', 'Ти тут, і це головне. Поїхали легенько.'], en: ['Comeback! Easy warm-up, no pressure.', 'You\'re here, that\'s what counts. Let\'s go easy.'] },
      night: { uk: ['Тренерка спить... Ти теж лягай!', 'Пізно для спринту. Завтра.'], en: ['Coach is sleeping... you should too!', 'Too late for sprints. Tomorrow.'] },
      record: { uk: ['РЕКОРД! Я знала, що ти можеш.', 'Нова планка! Стрибаємо вище!'], en: ['RECORD! I knew you could.', 'New bar! Let\'s jump higher!'] },
      steps: { uk: ['Кроки! Мої улюблені одиниці виміру.', 'Ще трохи, і будемо в новому місті.'], en: ['Steps! My favourite unit.', 'A bit more and we reach a new city.'] }
    }
  },
  raccoon: {
    name: { uk: 'Пампух', en: 'Dumpling' }, kind: { uk: 'єнот', en: 'raccoon' },
    vibe: { uk: 'Лінивий гурман. Самоіронія і свято кожного кроку.', en: 'A lazy foodie. Self-irony and a party for every step.' },
    fur: ['#C2B6AB', '#91857C', '#6B6059'], belly: ['#F5ECE1', '#DCCDBE'], feet: '#5E534C', ear: '#3B2F35',
    lines: {
      hello: { uk: ['Я прокинувся. Це вже досягнення.', 'Привіт! Що смачненького сьогодні?', 'Ми молодці вже тому, що тут.'], en: ['I woke up. That\'s an achievement.', 'Hi! What\'s tasty today?', 'We\'re doing great just by being here.'] },
      empty: { uk: ['Тарілка порожня, а уява повна. Запишемо щось?', 'Почнімо з води. Це найлегше.'], en: ['Empty plate, full imagination. Log something?', 'Let\'s start with water. It\'s the easiest.'] },
      meal: { uk: ['Записано! Я б попросив добавки.', 'Ммм, звучить смачно.', 'Їжа — це радість. І трохи досвіду.'], en: ['Logged! I\'d ask for seconds.', 'Mmm, sounds tasty.', 'Food is joy. And a bit of XP.'] },
      water: { uk: ['Вода. Не какао, але теж нічого.', 'Сьорб! Листочок підріс.', 'Бачу, як м\'ята росте. Чи це мені сниться?'], en: ['Water. Not cocoa, but fine.', 'Slurp! A new leaf.', 'I can see the mint growing. Or am I dreaming?'] },
      workout: { uk: ['Ти тренувався, а я дивився. Ми команда.', 'Вау. Я аж утомився, дивлячись.', 'Пишаюсь тобою, чесно.'], en: ['You trained, I watched. Teamwork.', 'Wow. I got tired just watching.', 'Honestly proud of you.'] },
      rest: { uk: ['День відпочинку? Моя улюблена дисципліна.', 'Відпочиваємо з гідністю. Плед уже чекає.'], en: ['Rest day? My favourite sport.', 'Resting with dignity. The blanket awaits.'] },
      tap: { uk: ['Хто це мене тицьнув?', 'У мене є печиво. Уявне.', 'Я не лінивий, я енергоефективний.'], en: ['Who poked me?', 'I have a cookie. An imaginary one.', 'I\'m not lazy, I\'m energy-efficient.'] },
      sleep: { uk: ['Сон! Нарешті тема, в якій я експерт.', 'Записав. Подушка схвалює.'], en: ['Sleep! Finally a topic I\'m expert in.', 'Logged. The pillow approves.'] },
      mood: { uk: ['Дякую. Я теж іноді «так собі», і це окей.', 'Записав. Обійняти?'], en: ['Thanks. I\'m «meh» sometimes too, and that\'s okay.', 'Noted. Hug?'] },
      habit: { uk: ['Звичка виконана. Я б відсвяткував печивом.', 'Ти робиш, а я надихаюсь.'], en: ['Habit done. I\'d celebrate with a cookie.', 'You do, I get inspired.'] },
      back: { uk: ['О, ти повернувся! Я якраз прокинувся.', 'Перерви бувають. Головне — ти тут.'], en: ['Oh, you\'re back! I just woke up.', 'Breaks happen. You\'re here, that\'s what matters.'] },
      night: { uk: ['Хр-р... какао... хр-р...', 'Ніч. Найкращий час для сну, повір експерту.'], en: ['Zzz... cocoa... zzz...', 'Night. Best time to sleep, trust the expert.'] },
      record: { uk: ['Рекорд?! Я впав з крісла від радості.', 'Оце так. Я б так не зміг. А ти зміг.'], en: ['A record?! I fell off my chair.', 'Wow. I couldn\'t. But you did.'] },
      steps: { uk: ['Кроки. Багато кроків. Я втомився за тебе.', 'Ти ходиш, а я мандрую в твоїй кишені.'], en: ['Steps. So many steps. I\'m tired for you.', 'You walk, I travel in your pocket.'] }
    }
  }
};
