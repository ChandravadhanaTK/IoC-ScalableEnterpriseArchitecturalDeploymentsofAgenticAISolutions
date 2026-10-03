import butterChicken from "@/assets/dish-butter-chicken.jpg";
import biryani from "@/assets/dish-biryani.jpg";
import paneerTikka from "@/assets/dish-paneer-tikka.jpg";
import gulabJamun from "@/assets/dish-gulab-jamun.jpg";

const map: Record<string, string> = {
  "Butter Chicken": butterChicken,
  "Hyderabadi Chicken Biryani": biryani,
  "Paneer Tikka": paneerTikka,
  "Gulab Jamun": gulabJamun,
};

export function dishImage(name: string): string | null {
  return map[name] ?? null;
}
