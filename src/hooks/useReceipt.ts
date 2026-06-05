// Open a backend-generated receipt PDF in a new tab.
export function openReceiptPdf(paymentId: string) {
  const token = localStorage.getItem("chuo-token") || "";
  const schoolId = localStorage.getItem("chuo-school-id") || "";
  const base =
    (import.meta as any).env?.VITE_API_URL || "/api";
  // Use fetch -> blob -> object URL so we can attach auth headers.
  return fetch(`${base}/payments/${paymentId}/receipt.pdf`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "x-school-id": schoolId,
    },
  })
    .then(async (r) => {
      if (!r.ok) throw new Error(`Receipt failed (${r.status})`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      if (!w) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt-${paymentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
}
