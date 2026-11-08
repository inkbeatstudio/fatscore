import type { L10n } from '../types';

export const STRENGTH: { id: string; name: L10n; bw?: boolean }[] = [
  { id: 'squat', name: { uk: 'Присідання', en: 'Squat' } },
  { id: 'bench', name: { uk: 'Жим лежачи', en: 'Bench press' } },
  { id: 'deadlift', name: { uk: 'Станова тяга', en: 'Deadlift' } },
  { id: 'ohp', name: { uk: 'Жим стоячи', en: 'Overhead press' } },
  { id: 'row', name: { uk: 'Тяга штанги в нахилі', en: 'Barbell row' } },
  { id: 'pullup', name: { uk: 'Підтягування', en: 'Pull-up' }, bw: true },
  { id: 'pushup', name: { uk: 'Віджимання', en: 'Push-up' }, bw: true },
  { id: 'dips', name: { uk: 'Віджимання на брусах', en: 'Dips' }, bw: true },
  { id: 'lunge', name: { uk: 'Випади', en: 'Lunges' } },
  { id: 'rdl', name: { uk: 'Румунська тяга', en: 'Romanian deadlift' } },
  { id: 'legpress', name: { uk: 'Жим ногами', en: 'Leg press' } },
  { id: 'latpull', name: { uk: 'Тяга верхнього блока', en: 'Lat pulldown' } },
  { id: 'db_press', name: { uk: 'Жим гантелей', en: 'Dumbbell press' } },
  { id: 'curl', name: { uk: 'Згинання на біцепс', en: 'Biceps curl' } },
  { id: 'triceps', name: { uk: 'Розгинання на трицепс', en: 'Triceps extension' } },
  { id: 'hipthrust', name: { uk: 'Ягідичний міст', en: 'Hip thrust' } },
  { id: 'plank', name: { uk: 'Планка (секунди)', en: 'Plank (seconds)' }, bw: true },
  { id: 'crunch', name: { uk: 'Скручування', en: 'Crunches' }, bw: true }
];

export const CARDIO: { id: string; name: L10n; met: number; kmh?: number }[] = [
  { id: 'walk', name: { uk: 'Ходьба', en: 'Walking' }, met: 3.5, kmh: 4.8 },
  { id: 'run', name: { uk: 'Біг', en: 'Running' }, met: 9.8, kmh: 9.5 },
  { id: 'bike', name: { uk: 'Велосипед', en: 'Cycling' }, met: 7.5, kmh: 18 },
  { id: 'swim', name: { uk: 'Плавання', en: 'Swimming' }, met: 7 },
  { id: 'yoga', name: { uk: 'Йога', en: 'Yoga' }, met: 2.5 },
  { id: 'dance', name: { uk: 'Танці', en: 'Dancing' }, met: 5 },
  { id: 'hiit', name: { uk: 'Інтервальне тренування', en: 'HIIT' }, met: 8 },
  { id: 'hike', name: { uk: 'Похід', en: 'Hiking' }, met: 6, kmh: 4 },
  { id: 'ski', name: { uk: 'Лижі чи ковзани', en: 'Skiing / skating' }, met: 7 },
  { id: 'team', name: { uk: 'Ігри з м\'ячем', en: 'Ball games' }, met: 7 }
];

export interface ShortW { id: string; name: L10n; min: number; met: number; moves: L10n[] }
export const SHORT: ShortW[] = [
  { id: 'morning', name: { uk: 'Ранкова зарядка', en: 'Morning wake-up' }, min: 5, met: 4, moves: [
    { uk: 'Кругові рухи руками', en: 'Arm circles' }, { uk: 'Нахили в сторони', en: 'Side bends' }, { uk: 'Присідання', en: 'Squats' },
    { uk: 'Крок на місці', en: 'March in place' }, { uk: 'Потягування вгору', en: 'Reach up and stretch' }] },
  { id: 'office', name: { uk: 'Перерва від екрана', en: 'Screen break' }, min: 7, met: 3.5, moves: [
    { uk: 'Розминка шиї', en: 'Neck rolls' }, { uk: 'Плечі назад', en: 'Shoulder rolls' }, { uk: 'Присідання біля стільця', en: 'Chair squats' },
    { uk: 'Віджимання від столу', en: 'Desk push-ups' }, { uk: 'Крок на місці', en: 'March in place' }, { uk: 'Розтяжка спини', en: 'Back stretch' }, { uk: 'Глибоке дихання', en: 'Deep breathing' }] },
  { id: 'back', name: { uk: 'Розтяжка для спини', en: 'Back stretch' }, min: 10, met: 2.5, moves: [
    { uk: 'Кішка-корова', en: 'Cat-cow' }, { uk: 'Поза дитини', en: 'Child\'s pose' }, { uk: 'Скручування лежачи', en: 'Supine twist' }, { uk: 'Міст', en: 'Glute bridge' },
    { uk: 'Розтяжка стегна', en: 'Hip flexor stretch' }, { uk: 'Нахил сидячи', en: 'Seated forward fold' }, { uk: 'Коліна до грудей', en: 'Knees to chest' }, { uk: 'Повільне дихання', en: 'Slow breathing' }] },
  { id: 'cardio10', name: { uk: 'Кардіо вдома без стрибків', en: 'Quiet home cardio' }, min: 10, met: 5, moves: [
    { uk: 'Марш з високими колінами', en: 'High-knee march' }, { uk: 'Боксерські удари', en: 'Shadow boxing' }, { uk: 'Присідання', en: 'Squats' },
    { uk: 'Крок убік з руками', en: 'Side steps with arms' }, { uk: 'Випади назад', en: 'Reverse lunges' }, { uk: 'Повільний біг на місці', en: 'Slow jog in place' }, { uk: 'Заминка', en: 'Cool-down' }] },
  { id: 'core', name: { uk: 'Прес і стабільність', en: 'Core & balance' }, min: 8, met: 3.8, moves: [
    { uk: 'Мертвий жук', en: 'Dead bug' }, { uk: 'Планка на колінах', en: 'Knee plank' }, { uk: 'Бокова планка', en: 'Side plank' }, { uk: 'Пташка-собака', en: 'Bird dog' },
    { uk: 'Ягідичний міст', en: 'Glute bridge' }, { uk: 'Баланс на одній нозі', en: 'Single-leg balance' }] }
];

export const CITIES: { name: L10n; km: number; souvenir: L10n; fact: L10n }[] = [
  { name: { uk: 'Київ', en: 'Kyiv' }, km: 0, souvenir: { uk: 'Каштан', en: 'Chestnut' }, fact: { uk: 'Старт подорожі.', en: 'Where the journey starts.' } },
  { name: { uk: 'Житомир', en: 'Zhytomyr' }, km: 140, souvenir: { uk: 'Модель ракети', en: 'Toy rocket' }, fact: { uk: 'Тут народився конструктор ракет Сергій Корольов.', en: 'Rocket designer Serhiy Korolyov was born here.' } },
  { name: { uk: 'Рівне', en: 'Rivne' }, km: 330, souvenir: { uk: 'Листівка з тунелем кохання', en: 'Tunnel of Love postcard' }, fact: { uk: 'Поруч міста є «Тунель кохання» із дерев над залізницею.', en: 'Nearby is the «Tunnel of Love», a railway lined with trees.' } },
  { name: { uk: 'Львів', en: 'Lviv' }, km: 540, souvenir: { uk: 'Горнятко кави', en: 'Coffee mug' }, fact: { uk: 'Центр Львова входить до списку спадщини ЮНЕСКО.', en: 'Lviv\'s old town is a UNESCO World Heritage site.' } },
  { name: { uk: 'Краків', en: 'Kraków' }, km: 870, souvenir: { uk: 'Обважанек', en: 'Obwarzanek bagel' }, fact: { uk: 'Ринкова площа Кракова — одна з найбільших середньовічних площ Європи.', en: 'Kraków\'s Main Square is one of Europe\'s largest medieval squares.' } },
  { name: { uk: 'Відень', en: 'Vienna' }, km: 1330, souvenir: { uk: 'Маленька скрипка', en: 'Tiny violin' }, fact: { uk: 'У Відні працювали Моцарт, Бетховен і Гайдн.', en: 'Mozart, Beethoven and Haydn all worked in Vienna.' } },
  { name: { uk: 'Мюнхен', en: 'Munich' }, km: 1760, souvenir: { uk: 'Брецель', en: 'Pretzel' }, fact: { uk: 'Англійський сад у Мюнхені більший за Центральний парк Нью-Йорка.', en: 'Munich\'s English Garden is larger than New York\'s Central Park.' } },
  { name: { uk: 'Париж', en: 'Paris' }, km: 2600, souvenir: { uk: 'Міні-Ейфелева вежа', en: 'Mini Eiffel Tower' }, fact: { uk: 'Ейфелеву вежу планували розібрати через 20 років після побудови.', en: 'The Eiffel Tower was meant to be dismantled after 20 years.' } }
];
