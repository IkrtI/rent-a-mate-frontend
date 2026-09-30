import { THAI_PLACE_NAMES } from "./thai-place-names";

const activityNames: Readonly<Record<string, string>> = {
  เดินเล่น: "Walking",
  ดูหนัง: "Watch movies",
  พาเที่ยว: "Explore the city",
  ช่วยเคลื่อนย้าย: "Moving help",
  ช่วยการบ้าน: "Homework help",
  ช่วยเรียน: "Study support",
  เล่นกีฬา: "Play sports",
  ช่วยสัมภาษณ์: "Interview practice",
  ซ่อมบ้าน: "Home repairs",
  ช่วยที่อุบ: "Errands and everyday help",
};

const interestNames: Readonly<Record<string, string>> = {
  ท่องเที่ยว: "Travel",
  กีฬา: "Sports",
  ศิลปะ: "Art",
  เทคโนโลยี: "Technology",
  ดนตรี: "Music",
  การถ่ายภาพ: "Photography",
  อ่านหนังสือ: "Reading",
  การออกแบบ: "Design",
  โยคะ: "Yoga",
  เกม: "Gaming",
  หนังสือการ์ตูน: "Comics",
  อาหาร: "Food",
  ธรรมชาติ: "Nature",
};

export function englishActivityName(name: string) {
  return activityNames[name] ?? name;
}

export function englishInterestName(name: string) {
  return interestNames[name] ?? name;
}

export function englishPlaceName(name: string) {
  return THAI_PLACE_NAMES[name] ?? name;
}

export function englishLookupName(name: string) {
  return englishActivityName(englishInterestName(englishPlaceName(name)));
}
