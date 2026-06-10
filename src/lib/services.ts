import luxxSignatureSet from "@/assets/services/luxx-signature-set.jpg";
import clusterLashSet from "@/assets/services/cluster-lash-set.jpg";
import freeStyle from "@/assets/services/free-style.jpg";
import wispyVolumeSet from "@/assets/services/wispy-volume-set.png";
import volumeSet from "@/assets/services/volume-set.png";
import hybridSet from "@/assets/services/hybrid-set.png";
import wetSet from "@/assets/services/wet-set.png";
import classicSet from "@/assets/services/classic-set.png";
import catEye from "@/assets/services/cat-eye.png";

export type Service = {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  category: string;
  image?: string;
};

export const serviceImages: Record<string, string> = {
  "luxx-signature-set": luxxSignatureSet,
  "cluster-lash-set": clusterLashSet,
  "free-style": freeStyle,
  "wispy-volume-set": wispyVolumeSet,
  "volume-set": volumeSet,
  "hybrid-set": hybridSet,
  "wet-set": wetSet,
  "classic-set": classicSet,
  "cat-eye": catEye,
};

export const categories = [
  "Lashes",
  "Refills",
  "Add-ons",
  "Waxing",
  "Facials",
  "Brows",
  "Combo Deals",
] as const;

export const services: Service[] = [
  // Lashes
  { id: "luxx-signature-set", name: "Luxx Signature Set", price: 165, duration: "3 hrs", description: "Our signature mega volume set for the ultimate glam.", category: "Lashes" },
  { id: "wispy-volume-set", name: "Wispy Volume Set", price: 150, duration: "3 hrs", description: "Soft, fluttery wisps for a doll-like effect.", category: "Lashes" },
  { id: "volume-set", name: "Volume Set", price: 140, duration: "3 hrs", description: "Full volume fans for dramatic density.", category: "Lashes" },
  { id: "cat-eye", name: "Cat Eye", price: 140, duration: "3 hrs", description: "Lifted outer corners for a sultry feline shape.", category: "Lashes" },
  { id: "free-style", name: "Free Style", price: 140, duration: "3 hrs", description: "Customized lash styling tailored to your eyes.", category: "Lashes" },
  { id: "hybrid-set", name: "Hybrid Set", price: 135, duration: "2 hrs", description: "A blend of classic and volume for the perfect mix.", category: "Lashes" },
  { id: "wet-set", name: "Wet Set", price: 135, duration: "2 hrs", description: "Spiked, glossy lash effect — trendy and bold.", category: "Lashes" },
  { id: "classic-set", name: "Classic Set", price: 120, duration: "2 hrs", description: "One extension per natural lash for everyday elegance.", category: "Lashes" },
  { id: "cluster-lash-set", name: "Cluster Lash Set", price: 35, duration: "45 mins", description: "Quick-glam cluster lashes for an instant fuller look.", category: "Lashes" },

  // Refills
  { id: "refill", name: "Refill", price: 100, duration: "1.5 hrs", description: "Maintain your lash fullness within 2–3 weeks.", category: "Refills" },
  { id: "luxx-signature-refill", name: "Luxx Signature Refill", price: 125, duration: "2 hrs", description: "Refill specifically for the Luxx Signature Set.", category: "Refills" },

  // Add-ons
  { id: "removals", name: "Removals", price: 35, duration: "30 mins", description: "Gentle, safe removal of existing lash extensions.", category: "Add-ons" },
  { id: "bottom-lashes", name: "Bottom Lashes", price: 30, duration: "30 mins", description: "Add definition with bottom lash extensions.", category: "Add-ons" },
  { id: "vip-upgrade", name: "VIP Upgrade", price: 50, duration: "—", description: "Premium upgrade — extra fullness, added length & care.", category: "Add-ons" },

  // Waxing
  { id: "luxx-brazilian-butt", name: "Luxx Brazilian + Butt", price: 65, duration: "50 mins", description: "Premium Brazilian wax including full butt strip.", category: "Waxing" },
  { id: "brazilian-butt", name: "Brazilian Wax + Butt", price: 50, duration: "40 mins", description: "Classic Brazilian wax with butt strip.", category: "Waxing" },
  { id: "underarm", name: "Underarm", price: 20, duration: "15 mins", description: "Smooth underarms in minutes.", category: "Waxing" },
  { id: "bikini-line", name: "Bikini Line", price: 20, duration: "25 mins", description: "Clean bikini line shaping.", category: "Waxing" },
  { id: "half-leg", name: "Half Leg", price: 35, duration: "30 mins", description: "Knee to ankle smooth finish.", category: "Waxing" },
  { id: "full-leg", name: "Full Leg", price: 60, duration: "50 mins", description: "Full leg wax for silky skin.", category: "Waxing" },
  { id: "half-arm", name: "Half Arm", price: 20, duration: "30 mins", description: "Elbow to wrist arm wax.", category: "Waxing" },
  { id: "full-arm", name: "Full Arm", price: 40, duration: "50 mins", description: "Full arm wax for total smoothness.", category: "Waxing" },
  { id: "inner-thighs", name: "Inner Thighs", price: 15, duration: "15 mins", description: "Targeted inner thigh wax.", category: "Waxing" },
  { id: "stomach-strip", name: "Stomach Strip", price: 10, duration: "15 mins", description: "Quick stomach strip clean-up.", category: "Waxing" },
  { id: "chin", name: "Chin", price: 15, duration: "15 mins", description: "Smooth chin wax.", category: "Waxing" },
  { id: "lip", name: "Lip", price: 10, duration: "10 mins", description: "Upper lip wax.", category: "Waxing" },
  { id: "eyebrow", name: "Eyebrow", price: 15, duration: "15 mins", description: "Brow shape & clean-up wax.", category: "Waxing" },

  // Facials
  { id: "luxx-signature-facial", name: "Luxx Signature Facial", price: 90, duration: "1 hr", description: "Our signature glow facial — cleanse, exfoliate, mask, massage.", category: "Facials" },
  { id: "express-facial", name: "Express Facial", price: 50, duration: "30 mins", description: "Quick refresh facial for radiant skin.", category: "Facials" },
  { id: "anti-aging-facial", name: "Anti-Aging Facial", price: 130, duration: "1 hr", description: "Targeted treatment for fine lines and firmness.", category: "Facials" },
  { id: "acne-facial", name: "Acne Treatment Facial", price: 130, duration: "1 hr", description: "Deep cleanse and clarify for breakout-prone skin.", category: "Facials" },
  { id: "brightening-facial", name: "Brightening Facial", price: 120, duration: "1 hr", description: "Even out tone and reveal a luminous complexion.", category: "Facials" },
  { id: "hydra-facial", name: "Hydra Facial", price: 115, duration: "1 hr 15 mins", description: "Deep hydration with our Hydra system.", category: "Facials" },
  { id: "vagacial", name: "Vagacial", price: 50, duration: "30 mins", description: "Soothing intimate area facial — ingrowns & smoothing.", category: "Facials" },
  { id: "back-facial", name: "Back Facial", price: 70, duration: "1 hr", description: "Deep cleanse and clear the back.", category: "Facials" },

  // Brows
  { id: "brow-lam-wax", name: "Brow Lamination + Wax", price: 70, duration: "30 mins", description: "Sculpted, brushed-up laminated brows.", category: "Brows" },
  { id: "brow-lam-wax-tint", name: "Brow Lamination + Wax + Tint", price: 90, duration: "45 mins", description: "Full brow service with custom tint.", category: "Brows" },
  { id: "tint", name: "Tint", price: 20, duration: "15 mins", description: "Custom brow tint.", category: "Brows" },
  { id: "tint-wax", name: "Tint + Wax", price: 35, duration: "30 mins", description: "Brow shape and tint duo.", category: "Brows" },

  // Combo Deals
  { id: "facial-full-set", name: "Facial + Full Set", price: 185, duration: "3 hrs 30 mins", description: "Glow facial paired with a full lash set.", category: "Combo Deals" },
  { id: "full-set-brow-wax", name: "Full Set + Brow Wax", price: 150, duration: "3 hrs 15 mins", description: "Lash set with brow shaping.", category: "Combo Deals" },
  { id: "full-set-brow-tint", name: "Full Set + Brow Tint", price: 155, duration: "3 hrs 15 mins", description: "Lash set with brow tint.", category: "Combo Deals" },
  { id: "full-set-brow-tint-wax", name: "Full Set + Brow Tint + Wax", price: 160, duration: "3 hrs 30 mins", description: "The complete eye-frame package.", category: "Combo Deals" },
  { id: "brazilian-underarm", name: "Brazilian Wax + Underarm", price: 60, duration: "40 mins", description: "Brazilian and underarm bundle.", category: "Combo Deals" },
  { id: "brazilian-vagacial", name: "Brazilian Wax + Vagacial", price: 90, duration: "1 hr", description: "Brazilian wax followed by a soothing vagacial.", category: "Combo Deals" },
];

export const getServiceById = (id: string) => services.find((s) => s.id === id);
