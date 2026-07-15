/**
 * Authoritative geography of Armenia (единый источник правды).
 *
 * Structure of the country (Homy works across ALL of Armenia, not only Yerevan):
 *   Armenia → 11 administrative units = 10 provinces (marzer) + Yerevan (capital, city-region).
 *   Each province has cities/towns (urban communities).
 *   DISTRICTS exist ONLY for Yerevan (its 12 administrative districts) — other cities have no
 *   sub-districts in the platform model.
 *
 * Sources (2024–2025):
 *   - Provinces & structure: Wikipedia "Administrative divisions of Armenia".
 *   - Cities (46 urban communities, ArmStat 2024): Wikipedia "List of cities and towns in Armenia".
 *   - Yerevan 12 districts: yerevan.am (official) / Wikipedia "Districts of Yerevan".
 *
 * Names are trilingual (en/ru/hy) to match the app i18n. Keys are stable ASCII identifiers.
 */

export interface GeoName {
  en: string;
  ru: string;
  hy: string;
}

export interface Province {
  key: string;
  name: GeoName;
  /** City key of the province's administrative centre. */
  capital: string;
  /** Yerevan is a city with province-level status (not a marz). */
  isCity?: boolean;
}

export interface City {
  key: string;
  name: GeoName;
  /** Province key this city belongs to. */
  province: string;
}

// ---------------------------------------------------------------------------
// Provinces (10 marzer + Yerevan)
// ---------------------------------------------------------------------------
export const PROVINCES: Province[] = [
  { key: 'yerevan',     name: { en: 'Yerevan',     ru: 'Ереван',     hy: 'Երևան' },     capital: 'yerevan',      isCity: true },
  { key: 'aragatsotn',  name: { en: 'Aragatsotn',  ru: 'Арагацотн',  hy: 'Արագածոտն' },  capital: 'ashtarak' },
  { key: 'ararat',      name: { en: 'Ararat',      ru: 'Арарат',     hy: 'Արարատ' },     capital: 'artashat' },
  { key: 'armavir',     name: { en: 'Armavir',     ru: 'Армавир',    hy: 'Արմավիր' },    capital: 'armavir' },
  { key: 'gegharkunik', name: { en: 'Gegharkunik', ru: 'Гегаркуник', hy: 'Գեղարքունիք' }, capital: 'gavar' },
  { key: 'kotayk',      name: { en: 'Kotayk',      ru: 'Котайк',     hy: 'Կոտայք' },     capital: 'hrazdan' },
  { key: 'lori',        name: { en: 'Lori',        ru: 'Лори',       hy: 'Լոռի' },       capital: 'vanadzor' },
  { key: 'shirak',      name: { en: 'Shirak',      ru: 'Ширак',      hy: 'Շիրակ' },      capital: 'gyumri' },
  { key: 'syunik',      name: { en: 'Syunik',      ru: 'Сюник',      hy: 'Սյունիք' },    capital: 'kapan' },
  { key: 'tavush',      name: { en: 'Tavush',      ru: 'Тавуш',      hy: 'Տավուշ' },     capital: 'ijevan' },
  { key: 'vayots-dzor', name: { en: 'Vayots Dzor', ru: 'Вайоц Дзор', hy: 'Վայոց Ձոր' },   capital: 'yeghegnadzor' },
];

// ---------------------------------------------------------------------------
// Cities / towns (46 urban communities, by province)
// ---------------------------------------------------------------------------
export const CITIES: City[] = [
  // Yerevan (capital)
  { key: 'yerevan', name: { en: 'Yerevan', ru: 'Ереван', hy: 'Երևան' }, province: 'yerevan' },

  // Shirak
  { key: 'gyumri',  name: { en: 'Gyumri',  ru: 'Гюмри',   hy: 'Գյումրի' }, province: 'shirak' },
  { key: 'artik',   name: { en: 'Artik',   ru: 'Артик',   hy: 'Արթիկ' },   province: 'shirak' },
  { key: 'maralik', name: { en: 'Maralik', ru: 'Маралик', hy: 'Մարալիկ' }, province: 'shirak' },

  // Lori
  { key: 'vanadzor',   name: { en: 'Vanadzor',   ru: 'Ванадзор',   hy: 'Վանաձոր' },   province: 'lori' },
  { key: 'spitak',     name: { en: 'Spitak',     ru: 'Спитак',     hy: 'Սպիտակ' },    province: 'lori' },
  { key: 'alaverdi',   name: { en: 'Alaverdi',   ru: 'Алаверди',   hy: 'Ալավերդի' },  province: 'lori' },
  { key: 'stepanavan', name: { en: 'Stepanavan', ru: 'Степанаван', hy: 'Ստեփանավան' }, province: 'lori' },
  { key: 'tashir',     name: { en: 'Tashir',     ru: 'Ташир',      hy: 'Տաշիր' },     province: 'lori' },
  { key: 'akhtala',    name: { en: 'Akhtala',    ru: 'Ахтала',     hy: 'Ախթալա' },    province: 'lori' },
  { key: 'tumanyan',   name: { en: 'Tumanyan',   ru: 'Туманян',    hy: 'Թումանյան' }, province: 'lori' },

  // Kotayk
  { key: 'abovyan',      name: { en: 'Abovyan',      ru: 'Абовян',      hy: 'Աբովյան' },     province: 'kotayk' },
  { key: 'hrazdan',      name: { en: 'Hrazdan',      ru: 'Раздан',      hy: 'Հրազդան' },     province: 'kotayk' },
  { key: 'charentsavan', name: { en: 'Charentsavan', ru: 'Чаренцаван',  hy: 'Չարենցավան' },   province: 'kotayk' },
  { key: 'yeghvard',     name: { en: 'Yeghvard',     ru: 'Егвард',      hy: 'Եղվարդ' },      province: 'kotayk' },
  { key: 'byureghavan',  name: { en: 'Byureghavan',  ru: 'Бюрехаван',   hy: 'Բյուրեղավան' },  province: 'kotayk' },
  { key: 'nor-hachn',    name: { en: 'Nor Hachn',    ru: 'Нор Ачн',     hy: 'Նոր Հաճն' },    province: 'kotayk' },
  { key: 'tsaghkadzor',  name: { en: 'Tsaghkadzor',  ru: 'Цахкадзор',   hy: 'Ծաղկաձոր' },     province: 'kotayk' },

  // Armavir
  { key: 'vagharshapat', name: { en: 'Vagharshapat (Ejmiatsin)', ru: 'Вагаршапат (Эчмиадзин)', hy: 'Վաղարշապատ' }, province: 'armavir' },
  { key: 'armavir',      name: { en: 'Armavir',      ru: 'Армавир',    hy: 'Արմավիր' },    province: 'armavir' },
  { key: 'metsamor',     name: { en: 'Metsamor',     ru: 'Мецамор',    hy: 'Մեծամոր' },    province: 'armavir' },

  // Syunik
  { key: 'kapan',    name: { en: 'Kapan',    ru: 'Капан',    hy: 'Կապան' },    province: 'syunik' },
  { key: 'goris',    name: { en: 'Goris',    ru: 'Горис',    hy: 'Գորիս' },    province: 'syunik' },
  { key: 'sisian',   name: { en: 'Sisian',   ru: 'Сисиан',   hy: 'Սիսիան' },   province: 'syunik' },
  { key: 'kajaran',  name: { en: 'Kajaran',  ru: 'Каджаран', hy: 'Քաջարան' },  province: 'syunik' },
  { key: 'meghri',   name: { en: 'Meghri',   ru: 'Мегри',    hy: 'Մեղրի' },    province: 'syunik' },

  // Ararat
  { key: 'masis',    name: { en: 'Masis',    ru: 'Масис',    hy: 'Մասիս' },    province: 'ararat' },
  { key: 'artashat', name: { en: 'Artashat', ru: 'Арташат',  hy: 'Արտաշատ' },  province: 'ararat' },
  { key: 'ararat',   name: { en: 'Ararat',   ru: 'Арарат',   hy: 'Արարատ' },   province: 'ararat' },
  { key: 'vedi',     name: { en: 'Vedi',     ru: 'Веди',     hy: 'Վեդի' },     province: 'ararat' },

  // Gegharkunik
  { key: 'sevan',     name: { en: 'Sevan',     ru: 'Севан',     hy: 'Սևան' },      province: 'gegharkunik' },
  { key: 'gavar',     name: { en: 'Gavar',     ru: 'Гавар',     hy: 'Գավառ' },     province: 'gegharkunik' },
  { key: 'vardenis',  name: { en: 'Vardenis',  ru: 'Варденис',  hy: 'Վարդենիս' },  province: 'gegharkunik' },
  { key: 'martuni',   name: { en: 'Martuni',   ru: 'Мартуни',   hy: 'Մարտունի' },  province: 'gegharkunik' },
  { key: 'chambarak', name: { en: 'Chambarak', ru: 'Чамбарак',  hy: 'Ճամբարակ' },  province: 'gegharkunik' },

  // Tavush
  { key: 'ijevan',      name: { en: 'Ijevan',      ru: 'Иджеван',    hy: 'Իջևան' },      province: 'tavush' },
  { key: 'dilijan',     name: { en: 'Dilijan',     ru: 'Дилижан',    hy: 'Դիլիջան' },    province: 'tavush' },
  { key: 'berd',        name: { en: 'Berd',        ru: 'Берд',       hy: 'Բերդ' },       province: 'tavush' },
  { key: 'noyemberyan', name: { en: 'Noyemberyan', ru: 'Ноемберян',  hy: 'Նոյեմբերյան' }, province: 'tavush' },
  { key: 'ayrum',       name: { en: 'Ayrum',       ru: 'Айрум',      hy: 'Այրում' },     province: 'tavush' },

  // Aragatsotn
  { key: 'ashtarak', name: { en: 'Ashtarak', ru: 'Аштарак', hy: 'Աշտարակ' }, province: 'aragatsotn' },
  { key: 'aparan',   name: { en: 'Aparan',   ru: 'Апаран',  hy: 'Ապարան' },  province: 'aragatsotn' },
  { key: 'talin',    name: { en: 'Talin',    ru: 'Талин',   hy: 'Թալին' },   province: 'aragatsotn' },

  // Vayots Dzor
  { key: 'yeghegnadzor', name: { en: 'Yeghegnadzor', ru: 'Ехегнадзор', hy: 'Եղեգնաձոր' }, province: 'vayots-dzor' },
  { key: 'vayk',         name: { en: 'Vayk',         ru: 'Вайк',       hy: 'Վայք' },      province: 'vayots-dzor' },
  { key: 'jermuk',       name: { en: 'Jermuk',       ru: 'Джермук',    hy: 'Ջերմուկ' },   province: 'vayots-dzor' },
];

// ---------------------------------------------------------------------------
// Yerevan administrative districts (12) — DISTRICTS EXIST ONLY FOR YEREVAN.
// Coordinates / safety / price live in data/neighborhoods.json (see lib/neighborhoods.ts).
// ---------------------------------------------------------------------------
export const YEREVAN_DISTRICTS: { key: string; name: GeoName }[] = [
  { key: 'Kentron',          name: { en: 'Kentron',          ru: 'Кентрон',         hy: 'Կենտրոն' } },
  { key: 'Arabkir',          name: { en: 'Arabkir',          ru: 'Арабкир',         hy: 'Արաբկիր' } },
  { key: 'Kanaker-Zeytun',   name: { en: 'Kanaker-Zeytun',   ru: 'Канакер-Зейтун',  hy: 'Քանաքեռ-Զեյթուն' } },
  { key: 'Davtashen',        name: { en: 'Davtashen',        ru: 'Давташен',        hy: 'Դավթաշեն' } },
  { key: 'Avan',             name: { en: 'Avan',             ru: 'Аван',            hy: 'Ավան' } },
  { key: 'Erebuni',          name: { en: 'Erebuni',          ru: 'Эребуни',         hy: 'Էրեբունի' } },
  { key: 'Malatia-Sebastia', name: { en: 'Malatia-Sebastia', ru: 'Малатия-Себастия', hy: 'Մալաթիա-Սեբաստիա' } },
  { key: 'Nor-Nork',         name: { en: 'Nor Nork',         ru: 'Нор Норк',        hy: 'Նոր Նորք' } },
  { key: 'Nork-Marash',      name: { en: 'Nork-Marash',      ru: 'Норк-Мараш',      hy: 'Նորք-Մարաշ' } },
  { key: 'Shengavit',        name: { en: 'Shengavit',        ru: 'Шенгавит',        hy: 'Շենգավիթ' } },
  { key: 'Ajapnyak',         name: { en: 'Ajapnyak',         ru: 'Аджапняк',        hy: 'Աջափնյակ' } },
  { key: 'Nubarashen',       name: { en: 'Nubarashen',       ru: 'Нубарашен',       hy: 'Նուբարաշեն' } },
];

// ---------------------------------------------------------------------------
// Lookups & helpers
// ---------------------------------------------------------------------------
export const YEREVAN_PROVINCE_KEY = 'yerevan';

const norm = (s: string) => (s || '').trim().toLowerCase();

/** All province keys. */
export function getProvinceKeys(): string[] {
  return PROVINCES.map((p) => p.key);
}

/** Cities of a province (or all cities if no province given). */
export function getCities(provinceKey?: string): City[] {
  return provinceKey ? CITIES.filter((c) => c.province === provinceKey) : CITIES;
}

/** True if this name/key refers to Yerevan (city or province). */
export function isYerevan(nameOrKey: string | null | undefined): boolean {
  if (!nameOrKey) return false;
  const n = norm(nameOrKey);
  return n === 'yerevan' || n === 'ереван' || n === 'երևան' || n === 'երեվան';
}

/** Yerevan district keys (canonical). Districts apply ONLY to Yerevan. */
export function getYerevanDistrictKeys(): string[] {
  return YEREVAN_DISTRICTS.map((d) => d.key);
}

/** Find a province by any of its trilingual names or key. */
export function findProvince(nameOrKey: string | null | undefined): Province | undefined {
  if (!nameOrKey) return undefined;
  const n = norm(nameOrKey);
  return PROVINCES.find(
    (p) => norm(p.key) === n || norm(p.name.en) === n || norm(p.name.ru) === n || norm(p.name.hy) === n
  );
}

/** Find a city by any of its trilingual names or key. */
export function findCity(nameOrKey: string | null | undefined): City | undefined {
  if (!nameOrKey) return undefined;
  const n = norm(nameOrKey);
  return CITIES.find(
    (c) => norm(c.key) === n || norm(c.name.en) === n || norm(c.name.ru) === n || norm(c.name.hy) === n
  );
}

/** Province key for a given city (by name or key). */
export function getCityProvince(cityNameOrKey: string | null | undefined): string | undefined {
  return findCity(cityNameOrKey)?.province;
}

/** Localize a GeoName to a language (fallback en → ru → hy). */
export function localizeGeo(name: GeoName | undefined, lang: string): string {
  if (!name) return '';
  const key: keyof GeoName = lang === 'ru' ? 'ru' : lang === 'hy' ? 'hy' : 'en';
  return name[key] || name.en || name.ru || name.hy || '';
}
