// -------------------------------------------------------------------
// Privacy — privacy policy.
// -------------------------------------------------------------------

import LegalLayout from "../components/LegalLayout";
import { BRAND } from "../data/site";

const SECTIONS = [
  {
    title: "Who we are",
    paragraphs: [
      `${BRAND.name} Logistics SARL is the data controller for the information collected through this website and through our delivery service. Our registered office is at ${BRAND.address}. You can reach our data protection team at ${BRAND.email}.`,
    ],
  },
  {
    title: "What we collect",
    paragraphs: [
      "We collect only what is needed to ship a parcel and to answer your questions.",
    ],
    list: [
      "Sender details: name, phone number, email address and the pickup address.",
      "Recipient details: name, phone number, delivery address and, for international shipments, a copy of the ID required by customs.",
      "Shipment details: weight, dimensions, declared value, description of the contents and the scans recorded while we carry the parcel.",
      "Technical data: your IP address, the browser you use and the pages you visit, so we can keep the site secure and measure how it is used.",
    ],
  },
  {
    title: "Why we use it",
    paragraphs: [
      "We use this information to route, deliver and track your parcel, to keep the service safe, to answer your requests, to send you delivery notifications you have asked for, and to meet our legal and customs obligations.",
      "We never sell your personal information. We share it only with the partners who are strictly needed to complete the delivery — the courier who drives the van, the airline or shipping line, and the customs authority.",
    ],
  },
  {
    title: "How long we keep it",
    paragraphs: [
      "Shipment records are kept for five years, because customs and tax authorities require it. Records that do not have that obligation are deleted or anonymised after twelve months. Your account data is kept until you ask us to delete it, and for three years afterwards in case you come back.",
    ],
  },
  {
    title: "Cookies and measurement",
    paragraphs: [
      "The public tracking pages work without any cookie: you can follow a parcel without being identified. We only set a cookie when you sign in to the admin area, and a small anonymous measurement cookie on the marketing pages so we know which pages are useful.",
      "You can block cookies in your browser settings. Nothing on the tracking pages depends on them.",
    ],
  },
  {
    title: "Your rights",
    paragraphs: [
      "Under the Cameroonian data protection law you have the right to see the information we hold about you, to correct it, to ask us to delete it, to limit how we use it, and to receive a copy of it in a portable format.",
    ],
    list: [
      `Write to ${BRAND.email} with the subject “Data request” and the tracking number or the email address you used.`,
      "We answer within thirty days and we never charge for it.",
      "If you are not satisfied with our answer, you can complain to the competent data protection authority.",
    ],
  },
  {
    title: "Security",
    paragraphs: [
      "Data is encrypted in transit and at rest, access to shipment files is restricted to the teams that need it, and every administrative action is logged. Our staff are trained on data protection, and we audit our suppliers twice a year.",
    ],
  },
  {
    title: "Children",
    paragraphs: [
      "Our service is for businesses and adults. We do not knowingly collect information from children under 16. If you believe a child has given us information, contact us and we will delete it.",
    ],
  },
];

export default function Privacy() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy policy"
      subtitle="What we collect, why we collect it, and how to get it back or have it deleted."
      updated="12 September 2025"
      sections={SECTIONS}
    />
  );
}
