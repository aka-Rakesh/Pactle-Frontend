import React, { useEffect } from "react";
import { Button } from "../ui/Button";

const PreviewApproveButton: React.FC = () => {
  const [status, setStatus] = React.useState<string | undefined>(
    (window as any).pactlePreview?.getStatus?.()
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ status?: string }>;
      setStatus(custom.detail?.status?.toLowerCase?.());
    };
    window.addEventListener("quotationStatusChange", handler as EventListener);
    setStatus((window as any).pactlePreview?.getStatus?.());
    return () => {
      window.removeEventListener(
        "quotationStatusChange",
        handler as EventListener
      );
    };
  }, []);

  const derived = (status || (window as any).pactlePreview?.getStatus?.()) as string | undefined;
  const isApproved = derived?.toLowerCase?.() === "approved";

  return (
    <Button
      onClick={async () => {
        const prev = status;
        setStatus("approved");
        try {
          await (window as any).pactlePreview?.approve?.();
        } catch (_e) {
          setStatus(prev);
        }
      }}
      className="text-xs sm:text-sm w-full sm:w-auto justify-center"
      disabled={isApproved}
      title={isApproved ? "Already approved" : "Approve this quotation"}
    >
      {isApproved ? "Approved" : "Approve"}
    </Button>
  );
};

export default PreviewApproveButton;


