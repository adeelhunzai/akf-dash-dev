import FacilitatorCertificatesContent from "@/components/facilitator/certificates/facilitator-certificates-content";
import { useTranslations } from "next-intl";

export default function FacilitatorCertificatesPage() {
  const t = useTranslations("navigation");

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {t("certificates")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage learner certificates
        </p>
      </div>
      <FacilitatorCertificatesContent />
    </div>
  );
}
