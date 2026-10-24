// -------------------------------------------------------------------
// Terms — terms & conditions of use and of carriage.
// -------------------------------------------------------------------

import LegalLayout from "../components/LegalLayout";

import { useBrand } from "../context/SettingsContext";

const buildSections = (brand) => [
  {
    title: "About these terms",
    paragraphs: [
      `These terms apply to anyone using the ${brand.name} website, the public tracking pages and any parcel we carry on behalf of a sender or a recipient. By using the site you accept them. If you do not accept them, please stop using the site.`,
      "The service itself is provided by SwiftTrack Logistics Inc., registered in Delaware, USA. Our principal office is at 350 Fifth Avenue, Suite 4200, New York, NY 10118.",
    ],
  },
  {
    title: "Using the tracking service",
    paragraphs: [
      "A tracking number is personal to the parcel it identifies. It lets you see the status of that shipment — nothing more. You may share the tracking page with the recipient of the parcel, or with anyone who needs to follow the delivery.",
      "Do not use the service to send, request or monitor content that is unlawful, that infringes somebody else’s rights, or that relates to dangerous goods listed in our prohibited items list.",
    ],
    list: [
      "We may suspend access to a tracking number that is being abused, for example to gather information about a person.",
      "The information we publish comes from the scans recorded by our own teams and our carrier partners. We do our best to keep it accurate but we do not guarantee that every scan is complete.",
      "Estimated delivery dates are estimates. They depend on traffic, weather, customs and the recipient’s availability.",
    ],
  },
  {
    title: "Your parcel and your responsibilities",
    paragraphs: [
      "When you hand us a parcel, you confirm that you have the right to send everything inside it, that the contents have been declared correctly, and that you have paid any duty that applies.",
      "We can refuse to carry, or open and inspect, any parcel that we reasonably believe breaks the law, contains dangerous or prohibited goods, or is packed in a way that could damage other parcels or our staff.",
    ],
    list: [
      "Parcels must be packed so that the contents cannot move, leak or break. We provide free packaging at every relay point.",
      "Maximum parcel weight: 30 kg. Maximum size: 120 × 60 × 60 cm. Above that, your shipment is handled as freight.",
      "A wrong or incomplete address, or a recipient who cannot be reached, is not covered by our insurance.",
    ],
  },
  {
    title: "Prices, payment and invoicing",
    paragraphs: [
      "Prices are shown on the pricing page and include tracking, insurance up to $10,000 and delivery notifications. The final amount is confirmed once the parcel has been weighed and measured by our team.",
      "Business customers can pay by bank transfer against a monthly invoice. Private customers pay by card, PayPal or Apple Pay, with cash on delivery where the service is available.",
    ],
  },
  {
    title: "Insurance, loss and refunds",
    paragraphs: [
      "Every parcel is insured up to $10,000 as standard. Extended insurance can be added at the time of booking. The value declared at drop-off is the maximum we will pay in case of loss or damage.",
      "If a parcel is lost, we first resend it if that is what you prefer. If it cannot be resent, we refund the shipping price in full. A claim must be opened within 30 days of the expected delivery date.",
    ],
  },
  {
    title: "Personal data and cookies",
    paragraphs: [
      "We only collect what we need to carry and deliver a parcel, and to answer your questions. You can read the details in our privacy policy.",
    ],
  },
  {
    title: "Liability and governing law",
    paragraphs: [
      "We are responsible for the proper handling of your parcel. We are not responsible for indirect losses such as lost profit, unless the law says otherwise.",
      "These terms are governed by the laws of the State of New York. Any dispute is first brought before the courts of New York County, unless both parties agree to arbitration.",
    ],
  },
  {
    title: "Changes and contact",
    paragraphs: [
      "We may update these terms from time to time. The date at the top of this page shows the last revision, and the new version applies as soon as it is published.",
      `Questions about these terms? Write to us at ${brand.email} or call ${brand.phone}.`,
    ],
  },
];

export default function Terms() {
  const brand = useBrand();
  const sections = buildSections(brand);
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Terms & conditions"
      subtitle="The rules that apply when you use SwiftTrack — our website and our delivery service."
      updated="22 October 2026"
      sections={sections}
    />
  );
}
