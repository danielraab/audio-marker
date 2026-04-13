import type { Metadata } from "next";
import LegalPage from "~/app/_components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Legal Information - Audio Marker",
  description: "Legal information for Audio Marker application",
};

export default function Legal() {
  return <LegalPage />;
}
