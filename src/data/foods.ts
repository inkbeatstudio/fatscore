import type { Cat, Food } from '../types';

// Значення на 100 г — усереднені довідкові дані (USDA, таблиці хімічного складу продуктів).
// Для страв домашньої кухні це орієнтир: рецепти різняться.
type Row = [string, string, string, number, number, number, number, number, Cat, number, string, string, 1?];

const ROWS: Row[] = [
  // ——— Українська та східноєвропейська кухня
  ['borsch', 'Борщ український', 'Ukrainian borsch', 50, 2.2, 2.5, 5, 1.3, 'veg', 300, 'тарілка', 'bowl', 1],
  ['borsch_green', 'Зелений борщ', 'Green sorrel borsch', 45, 2.5, 2.2, 4, 1, 'veg', 300, 'тарілка', 'bowl', 1],
  ['kapusniak', 'Капусняк', 'Sauerkraut soup (kapusniak)', 40, 1.5, 2, 4.5, 1.4, 'veg', 300, 'тарілка', 'bowl', 1],
  ['chicken_soup', 'Курячий суп з локшиною', 'Chicken noodle soup', 45, 3.5, 1.6, 4.5, 0.4, 'protein', 300, 'тарілка', 'bowl', 1],
  ['yushka', 'Юшка рибна', 'Fish soup (yushka)', 45, 5, 1.5, 3, 0.4, 'protein', 300, 'тарілка', 'bowl', 1],
  ['soljanka', 'Солянка', 'Solyanka', 70, 4.5, 4.5, 3, 0.6, 'protein', 300, 'тарілка', 'bowl', 1],
  ['okroshka', 'Окрошка на кефірі', 'Okroshka (kefir)', 60, 3.3, 3, 4.5, 0.6, 'dairy', 300, 'тарілка', 'bowl', 1],
  ['varenyky_potato', 'Вареники з картоплею', 'Varenyky with potato', 150, 4, 3.5, 26, 1.3, 'grain', 200, 'порція', 'serving', 1],
  ['varenyky_cabbage', 'Вареники з капустою', 'Varenyky with cabbage', 130, 3.5, 3, 22, 1.8, 'grain', 200, 'порція', 'serving', 1],
  ['varenyky_cherry', 'Вареники з вишнею', 'Varenyky with cherries', 180, 4.5, 1.5, 37, 1.2, 'grain', 200, 'порція', 'serving', 1],
  ['varenyky_cheese', 'Вареники з сиром', 'Varenyky with cottage cheese', 200, 10, 5, 28, 0.9, 'dairy', 200, 'порція', 'serving', 1],
  ['pelmeni', 'Пельмені', 'Pelmeni (meat dumplings)', 250, 11, 12, 25, 1, 'protein', 200, 'порція', 'serving', 1],
  ['syrnyky', 'Сирники', 'Syrnyky (cottage cheese pancakes)', 220, 15, 9, 19, 0.5, 'dairy', 150, '3 штуки', '3 pieces', 1],
  ['nalysnyky', 'Налисники з сиром', 'Crepes with cottage cheese', 190, 9, 8, 21, 0.6, 'dairy', 150, '2 штуки', '2 pieces', 1],
  ['mlyntsi', 'Млинці', 'Thin pancakes (mlyntsi)', 230, 6, 9, 31, 0.9, 'grain', 120, '3 штуки', '3 pieces', 1],
  ['oladky', 'Оладки', 'Small fluffy pancakes (oladky)', 250, 6.5, 10, 33, 1, 'grain', 120, '4 штуки', '4 pieces', 1],
  ['holubtsi', 'Голубці', 'Holubtsi (cabbage rolls)', 110, 6, 5, 10, 1.4, 'protein', 250, '2 штуки', '2 pieces', 1],
  ['deruny', 'Деруни', 'Deruny (potato pancakes)', 180, 3.5, 10, 20, 2, 'grain', 150, '3 штуки', '3 pieces', 1],
  ['plov', 'Плов з куркою', 'Chicken plov', 160, 8, 5, 21, 0.8, 'grain', 250, 'порція', 'serving', 1],
  ['banosh', 'Банош', 'Banosh (cornmeal porridge)', 240, 6, 12, 26, 1.5, 'grain', 200, 'порція', 'serving', 1],
  ['kulish', 'Куліш', 'Kulish (millet stew)', 110, 4, 4, 15, 1.2, 'grain', 250, 'порція', 'serving', 1],
  ['pampushky', 'Пампушки з часником', 'Garlic pampushky', 300, 8, 8, 48, 2, 'grain', 60, '2 штуки', '2 pieces', 1],
  ['pyrizhky_cabbage', 'Пиріжок з капустою', 'Cabbage pyrizhok', 230, 5.5, 8, 34, 2, 'grain', 70, '1 штука', '1 piece', 1],
  ['kyiv_cutlet', 'Котлета по-київськи', 'Chicken Kyiv', 260, 16, 18, 9, 0.5, 'protein', 160, '1 штука', '1 piece', 1],
  ['kotleta', 'Котлета домашня', 'Homemade meat patty', 230, 15, 15, 9, 0.5, 'protein', 100, '1 штука', '1 piece', 1],
  ['zrazy', 'Зрази картопляні з м\'ясом', 'Potato zrazy with meat', 170, 7, 7, 20, 1.5, 'grain', 150, '2 штуки', '2 pieces', 1],
  ['kholodets', 'Холодець', 'Kholodets (meat aspic)', 120, 15, 6, 1, 0, 'protein', 150, 'порція', 'serving', 1],
  ['shashlyk', 'Шашлик зі свинини', 'Pork shashlik', 250, 22, 18, 0, 0, 'protein', 200, 'порція', 'serving', 1],
  ['liver', 'Печінка смажена', 'Fried liver', 200, 23, 9, 6, 0, 'protein', 120, 'порція', 'serving', 1],
  ['vinegret', 'Вінегрет', 'Vinegret (beet salad)', 75, 1.5, 4, 8, 2.2, 'veg', 150, 'порція', 'serving', 1],
  ['shuba', 'Оселедець під шубою', 'Herring under a fur coat', 190, 5, 15, 8, 1.4, 'protein', 150, 'порція', 'serving', 1],
  ['olivie', 'Олів\'є', 'Olivier salad', 200, 5, 17, 7, 1.4, 'protein', 150, 'порція', 'serving', 1],
  ['salad_ct', 'Салат з огірків і помідорів з олією', 'Cucumber & tomato salad', 60, 1, 4, 4, 1.2, 'veg', 200, 'миска', 'bowl', 1],
  ['beet_salad', 'Буряк з часником', 'Beet & garlic salad', 110, 1.8, 7, 9, 2.4, 'veg', 150, 'порція', 'serving', 1],
  ['sauerkraut', 'Квашена капуста', 'Sauerkraut', 20, 1, 0.1, 4, 2.9, 'veg', 100, 'порція', 'serving', 1],
  ['pickles', 'Малосольні огірки', 'Pickled cucumbers', 12, 0.5, 0.1, 2.3, 1, 'veg', 100, '2 штуки', '2 pieces', 1],
  ['ikra_kabach', 'Кабачкова ікра', 'Zucchini spread', 90, 1.2, 7, 7, 1.2, 'veg', 80, '2 ложки', '2 spoons', 1],
  ['salo', 'Сало', 'Salo (cured pork fat)', 770, 2, 85, 0, 0, 'fat', 20, 'шматочок', 'slice', 1],
  ['uzvar', 'Узвар', 'Uzvar (dried fruit drink)', 40, 0.2, 0, 10, 0, 'drink', 250, 'склянка', 'glass', 1],
  ['kompot', 'Компот', 'Kompot', 45, 0.2, 0, 11, 0.3, 'drink', 250, 'склянка', 'glass', 1],
  ['kvas', 'Квас', 'Kvass', 30, 0.2, 0, 7, 0, 'drink', 330, 'склянка', 'glass', 1],
  ['kyiv_cake', 'Київський торт', 'Kyiv cake', 450, 6, 22, 57, 1, 'sweet', 100, 'шматок', 'slice', 1],
  ['medivnyk', 'Медівник', 'Honey cake (medivnyk)', 420, 5.5, 20, 55, 0.8, 'sweet', 100, 'шматок', 'slice', 1],
  ['makivnyk', 'Маківник', 'Poppy seed roll', 380, 7, 15, 52, 3, 'sweet', 80, 'шматок', 'slice', 1],
  ['kutia', 'Кутя', 'Kutia', 220, 6, 8, 32, 4, 'grain', 150, 'порція', 'serving', 1],
  // ——— Каші й гарніри
  ['buckwheat', 'Гречка варена', 'Buckwheat, cooked', 110, 4, 1, 21, 2.7, 'grain', 180, 'порція', 'serving'],
  ['oat_water', 'Вівсянка на воді', 'Oatmeal with water', 70, 2.5, 1.5, 12, 1.7, 'grain', 250, 'миска', 'bowl'],
  ['oat_milk', 'Вівсянка на молоці', 'Oatmeal with milk', 105, 3.6, 3.5, 15, 1.5, 'grain', 250, 'миска', 'bowl'],
  ['millet', 'Пшоняна каша', 'Millet porridge', 90, 3, 0.7, 17, 1.2, 'grain', 200, 'порція', 'serving'],
  ['bulgur', 'Булгур варений', 'Bulgur, cooked', 83, 3.1, 0.2, 18.6, 4.5, 'grain', 180, 'порція', 'serving'],
  ['potato', 'Картопля варена', 'Boiled potatoes', 80, 2, 0.4, 17, 1.8, 'grain', 200, 'порція', 'serving'],
  ['potato_baked', 'Картопля запечена', 'Baked potatoes', 120, 2.5, 4, 19, 2.2, 'grain', 200, 'порція', 'serving'],
  ['mash', 'Картопляне пюре', 'Mashed potatoes', 105, 2.2, 4, 15, 1.5, 'grain', 200, 'порція', 'serving'],
  ['fries', 'Картопля фрі', 'French fries', 312, 3.4, 15, 41, 3.8, 'grain', 120, 'порція', 'serving'],
  ['rice', 'Рис варений', 'Rice, cooked', 130, 2.7, 0.3, 28, 0.4, 'grain', 180, 'порція', 'serving'],
  ['pasta', 'Макарони варені', 'Pasta, cooked', 158, 5.8, 0.9, 31, 1.8, 'grain', 200, 'порція', 'serving'],
  ['bread_rye', 'Житній хліб', 'Rye bread', 210, 6.5, 1.2, 41, 5.8, 'grain', 30, 'скибка', 'slice'],
  ['bread_white', 'Білий хліб', 'White bread', 265, 8, 3, 49, 2.7, 'grain', 30, 'скибка', 'slice'],
  ['bread_whole', 'Цільнозерновий хліб', 'Wholegrain bread', 250, 12, 3.5, 41, 7, 'grain', 35, 'скибка', 'slice'],
  ['lavash', 'Лаваш', 'Lavash', 275, 9, 1.2, 56, 2.2, 'grain', 60, 'половина', 'half'],
  ['granola', 'Гранола', 'Granola', 470, 10, 20, 62, 7, 'grain', 50, 'порція', 'serving'],
  ['cornflakes', 'Кукурудзяні пластівці', 'Corn flakes', 357, 7.5, 0.4, 84, 3.3, 'grain', 40, 'порція', 'serving'],
  // ——— Білок
  ['chicken', 'Куряче філе запечене', 'Chicken breast, baked', 165, 31, 3.6, 0, 0, 'protein', 150, 'порція', 'serving'],
  ['chicken_thigh', 'Куряче стегно запечене', 'Chicken thigh, baked', 210, 26, 11, 0, 0, 'protein', 150, 'порція', 'serving'],
  ['turkey', 'Індичка запечена', 'Turkey, baked', 150, 29, 3, 0, 0, 'protein', 150, 'порція', 'serving'],
  ['beef', 'Яловичина тушкована', 'Beef stew meat', 230, 25, 14, 0, 0, 'protein', 150, 'порція', 'serving'],
  ['pork', 'Свинина запечена', 'Pork, roasted', 240, 27, 14, 0, 0, 'protein', 150, 'порція', 'serving'],
  ['salmon', 'Лосось запечений', 'Salmon, baked', 206, 22, 12, 0, 0, 'protein', 150, 'порція', 'serving'],
  ['hake', 'Хек запечений', 'Hake, baked', 90, 19, 1.2, 0, 0, 'protein', 150, 'порція', 'serving'],
  ['herring', 'Оселедець', 'Herring, salted', 220, 18, 16, 0, 0, 'protein', 60, 'шматочки', 'pieces'],
  ['tuna', 'Тунець консервований', 'Canned tuna', 116, 26, 1, 0, 0, 'protein', 100, 'банка', 'can'],
  ['sausage', 'Сосиски', 'Frankfurters', 260, 11, 23, 2, 0, 'protein', 100, '2 штуки', '2 pieces'],
  ['ham', 'Шинка', 'Ham', 145, 21, 6, 1.5, 0, 'protein', 40, '2 скибочки', '2 slices'],
  ['beans', 'Квасоля варена', 'Beans, cooked', 127, 8.7, 0.5, 22.8, 6.4, 'protein', 150, 'порція', 'serving'],
  ['lentils', 'Сочевиця варена', 'Lentils, cooked', 116, 9, 0.4, 20, 7.9, 'protein', 150, 'порція', 'serving'],
  ['chickpeas', 'Нут варений', 'Chickpeas, cooked', 164, 8.9, 2.6, 27, 7.6, 'protein', 150, 'порція', 'serving'],
  ['tofu', 'Тофу', 'Tofu', 76, 8, 4.8, 1.9, 0.3, 'protein', 100, 'порція', 'serving'],
  ['egg', 'Яйце варене', 'Boiled egg', 155, 13, 11, 1.1, 0, 'protein', 55, '1 штука', '1 egg'],
  ['omelet', 'Омлет', 'Omelette', 155, 10, 12, 2, 0, 'protein', 150, 'порція', 'serving'],
  ['fried_eggs', 'Яєчня з 2 яєць', 'Fried eggs', 196, 13.6, 15, 0.8, 0, 'protein', 110, 'порція', 'serving'],
  ['protein_bar', 'Протеїновий батончик', 'Protein bar', 350, 30, 10, 35, 5, 'protein', 60, '1 штука', '1 bar'],
  ['whey', 'Протеїн сироватковий', 'Whey protein', 380, 75, 6, 8, 0, 'protein', 30, 'мірна ложка', 'scoop'],
  // ——— Молочне
  ['tvorog', 'Кисломолочний сир 5%', 'Cottage cheese 5%', 121, 17, 5, 1.8, 0, 'dairy', 150, 'порція', 'serving'],
  ['tvorog0', 'Кисломолочний сир 0,5%', 'Cottage cheese 0.5%', 80, 17, 0.5, 2, 0, 'dairy', 150, 'порція', 'serving'],
  ['kefir', 'Кефір 2,5%', 'Kefir 2.5%', 53, 2.9, 2.5, 4, 0, 'dairy', 250, 'склянка', 'glass'],
  ['ryazhanka', 'Ряжанка', 'Baked fermented milk', 67, 2.8, 4, 4.2, 0, 'dairy', 250, 'склянка', 'glass'],
  ['milk', 'Молоко 2,5%', 'Milk 2.5%', 52, 2.8, 2.5, 4.7, 0, 'dairy', 250, 'склянка', 'glass'],
  ['yogurt', 'Грецький йогурт 2%', 'Greek yogurt 2%', 66, 9, 2, 3.5, 0, 'dairy', 150, 'стаканчик', 'cup'],
  ['yogurt_fruit', 'Фруктовий йогурт', 'Fruit yogurt', 95, 3.5, 2.5, 15, 0.2, 'dairy', 150, 'стаканчик', 'cup'],
  ['cheese', 'Твердий сир', 'Hard cheese', 350, 25, 27, 0, 0, 'dairy', 30, '2 скибочки', '2 slices'],
  ['brynza', 'Бринза', 'Brynza (feta-style)', 260, 18, 20, 0.5, 0, 'dairy', 40, 'шматочок', 'piece'],
  ['smetana', 'Сметана 15%', 'Sour cream 15%', 160, 2.6, 15, 3, 0, 'dairy', 30, 'ложка', 'spoon'],
  ['glazed_curd', 'Сирок глазурований', 'Glazed curd snack', 410, 8, 27, 33, 0.5, 'sweet', 45, '1 штука', '1 piece'],
  ['coffee_milk', 'Кава з молоком', 'Coffee with milk', 30, 1.6, 1.5, 2.5, 0, 'drink', 250, 'чашка', 'cup'],
  ['cappuccino', 'Капучино', 'Cappuccino', 40, 2.2, 2, 3.3, 0, 'drink', 300, 'чашка', 'cup'],
  ['tea_sugar', 'Чай з цукром', 'Tea with sugar', 20, 0, 0, 5, 0, 'drink', 250, 'чашка', 'cup'],
  // ——— Фрукти й овочі
  ['apple', 'Яблуко', 'Apple', 52, 0.3, 0.2, 14, 2.4, 'fruit', 180, '1 штука', '1 apple'],
  ['banana', 'Банан', 'Banana', 89, 1.1, 0.3, 23, 2.6, 'fruit', 120, '1 штука', '1 banana'],
  ['pear', 'Груша', 'Pear', 57, 0.4, 0.1, 15, 3.1, 'fruit', 170, '1 штука', '1 pear'],
  ['orange', 'Апельсин', 'Orange', 47, 0.9, 0.1, 12, 2.4, 'fruit', 200, '1 штука', '1 orange'],
  ['mandarin', 'Мандарин', 'Mandarin', 53, 0.8, 0.3, 13, 1.8, 'fruit', 80, '1 штука', '1 mandarin'],
  ['grapes', 'Виноград', 'Grapes', 69, 0.7, 0.2, 18, 0.9, 'fruit', 150, 'гроно', 'bunch'],
  ['strawberry', 'Полуниця', 'Strawberries', 32, 0.7, 0.3, 7.7, 2, 'fruit', 150, 'жменька', 'handful'],
  ['cherries', 'Вишні', 'Sour cherries', 50, 1, 0.3, 12, 1.6, 'fruit', 150, 'жменька', 'handful'],
  ['watermelon', 'Кавун', 'Watermelon', 30, 0.6, 0.2, 7.6, 0.4, 'fruit', 300, 'скибка', 'slice'],
  ['plums', 'Сливи', 'Plums', 46, 0.7, 0.3, 11, 1.4, 'fruit', 150, '4 штуки', '4 plums'],
  ['dried_fruit', 'Сухофрукти', 'Dried fruit mix', 280, 2.5, 0.5, 66, 7, 'fruit', 40, 'жменька', 'handful'],
  ['cucumber', 'Огірок', 'Cucumber', 15, 0.7, 0.1, 3.6, 0.5, 'veg', 100, '1 штука', '1 cucumber'],
  ['tomato', 'Помідор', 'Tomato', 18, 0.9, 0.2, 3.9, 1.2, 'veg', 120, '1 штука', '1 tomato'],
  ['carrot', 'Морква', 'Carrot', 41, 0.9, 0.2, 9.6, 2.8, 'veg', 80, '1 штука', '1 carrot'],
  ['pepper', 'Солодкий перець', 'Bell pepper', 26, 1, 0.3, 6, 2.1, 'veg', 120, '1 штука', '1 pepper'],
  ['broccoli', 'Броколі', 'Broccoli', 34, 2.8, 0.4, 7, 2.6, 'veg', 150, 'порція', 'serving'],
  ['cabbage_stew', 'Капуста тушкована', 'Braised cabbage', 60, 1.8, 3, 7, 2.5, 'veg', 200, 'порція', 'serving'],
  ['zucchini', 'Кабачок запечений', 'Baked zucchini', 30, 1.2, 0.8, 4.5, 1, 'veg', 200, 'порція', 'serving'],
  ['greens', 'Зелень і листя салату', 'Leafy greens', 18, 1.5, 0.3, 3, 1.8, 'veg', 50, 'жменька', 'handful'],
  ['beetroot', 'Буряк варений', 'Boiled beetroot', 44, 1.7, 0.2, 10, 2, 'veg', 100, 'порція', 'serving'],
  ['mushrooms', 'Гриби смажені', 'Fried mushrooms', 90, 3.5, 6, 5, 2, 'veg', 150, 'порція', 'serving'],
  // ——— Жири, горіхи, солодке
  ['walnuts', 'Волоські горіхи', 'Walnuts', 654, 15, 65, 14, 6.7, 'fat', 30, 'жменька', 'handful'],
  ['sunflower_seeds', 'Насіння соняшника', 'Sunflower seeds', 584, 21, 51, 20, 8.6, 'fat', 30, 'жменька', 'handful'],
  ['peanut_butter', 'Арахісова паста', 'Peanut butter', 588, 25, 50, 20, 6, 'fat', 20, 'ложка', 'spoon'],
  ['oil', 'Соняшникова олія', 'Sunflower oil', 884, 0, 100, 0, 0, 'fat', 10, 'ложка', 'spoon'],
  ['butter', 'Вершкове масло', 'Butter', 717, 0.9, 81, 0.1, 0, 'fat', 10, 'шматочок', 'pat'],
  ['avocado', 'Авокадо', 'Avocado', 160, 2, 15, 9, 6.7, 'fat', 100, 'половинка', 'half'],
  ['dark_choc', 'Чорний шоколад', 'Dark chocolate', 550, 7, 35, 48, 9, 'sweet', 25, 'кілька квадратиків', 'a few squares'],
  ['milk_choc', 'Молочний шоколад', 'Milk chocolate', 535, 7.6, 30, 59, 3.4, 'sweet', 25, 'кілька квадратиків', 'a few squares'],
  ['candy', 'Цукерка', 'Chocolate candy', 500, 4, 25, 65, 2, 'sweet', 15, '1 штука', '1 piece'],
  ['cookies', 'Печиво', 'Cookies', 450, 6.5, 17, 68, 2, 'sweet', 30, '3 штуки', '3 cookies'],
  ['ice_cream', 'Морозиво пломбір', 'Ice cream', 230, 3.5, 15, 21, 0, 'sweet', 80, 'ріжок', 'cone'],
  ['honey', 'Мед', 'Honey', 304, 0.3, 0, 82, 0.2, 'sweet', 20, 'ложка', 'spoon'],
  ['jam', 'Варення', 'Jam', 260, 0.4, 0.1, 65, 1, 'sweet', 20, 'ложка', 'spoon'],
  ['pizza', 'Піца', 'Pizza', 266, 11, 10, 33, 2.3, 'grain', 200, '2 шматки', '2 slices'],
  ['burger', 'Бургер', 'Burger', 255, 13, 12, 24, 1.5, 'protein', 220, '1 штука', '1 burger'],
  ['shawarma', 'Шаурма', 'Shawarma', 210, 10, 10, 20, 1.6, 'protein', 300, '1 штука', '1 wrap'],
  ['sushi', 'Роли', 'Sushi rolls', 150, 6, 3.5, 24, 0.8, 'grain', 200, '8 штук', '8 pieces'],
  ['juice', 'Апельсиновий сік', 'Orange juice', 45, 0.7, 0.2, 10.4, 0.2, 'drink', 250, 'склянка', 'glass'],
  ['soda', 'Солодкий газований напій', 'Soda', 42, 0, 0, 10.6, 0, 'drink', 330, 'банка', 'can'],
  ['beer', 'Пиво', 'Beer', 43, 0.5, 0, 3.6, 0, 'drink', 500, 'келих', 'pint'],
  ['wine', 'Вино сухе', 'Dry wine', 83, 0.1, 0, 2.6, 0, 'drink', 150, 'келих', 'glass']
];

export const LOCAL_FOODS: Food[] = ROWS.map(r => ({
  id: r[0], name: { uk: r[1], en: r[2] }, kcal: r[3], p: r[4], f: r[5], c: r[6], fiber: r[7], cat: r[8], g: r[9],
  por: { uk: r[10], en: r[11] }, ua: !!r[12], src: 'local'
}));
export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(LOCAL_FOODS.map(f => [f.id, f]));

export const CATS: Record<Cat, { uk: string; en: string; c: [string, string] }> = {
  veg: { uk: 'овочі', en: 'veggies', c: ['#A9BC52', '#5E6E22'] },
  fruit: { uk: 'фрукти', en: 'fruit', c: ['#FF8A6B', '#C9361E'] },
  protein: { uk: 'білок', en: 'protein', c: ['#B98060', '#7A4A2C'] },
  grain: { uk: 'злаки', en: 'grains', c: ['#FFD58A', '#D98B32'] },
  dairy: { uk: 'молочне', en: 'dairy', c: ['#FFFFFF', '#E8D9C2'] },
  sweet: { uk: 'солодке', en: 'sweets', c: ['#F7A8C4', '#C0567F'] },
  fat: { uk: 'горіхи й жири', en: 'nuts & fats', c: ['#F6E07A', '#B8962A'] },
  drink: { uk: 'напої', en: 'drinks', c: ['#BFE3E8', '#5FA3AE'] }
};
/** «Кольори тарілки», які рахуються для різноманітності */
export const COLOR_CATS: (keyof typeof CATS)[] = ['veg', 'fruit', 'protein', 'grain', 'dairy'];

/** Пошук без урахування регістру й апострофів, по обох мовах */
export function norm(s: string) {
  return s.toLowerCase().replace(/[’'ʼ`]/g, '').replace(/ё/g, 'е').trim();
}
export function searchFoods(list: Food[], q: string, limit = 40): Food[] {
  const n = norm(q);
  if (!n) return [];
  const words = n.split(/\s+/);
  const scored: [number, Food][] = [];
  for (const f of list) {
    const hay = norm(f.name.uk + ' ' + f.name.en + ' ' + (f.brand || ''));
    if (!words.every(w => hay.includes(w))) continue;
    const starts = norm(f.name.uk).startsWith(n) || norm(f.name.en).startsWith(n);
    scored.push([(starts ? 0 : 1) + (f.src === 'local' ? 0 : 0.5), f]);
  }
  return scored.sort((a, b) => a[0] - b[0]).slice(0, limit).map(x => x[1]);
}
