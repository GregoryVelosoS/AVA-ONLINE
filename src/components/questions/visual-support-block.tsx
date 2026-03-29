import Image from "next/image";
import { getQuestionSupportAssetUrl } from "@/lib/assets";

type VisualSupportType = "NONE" | "ASSET" | "CODE";

export function VisualSupportBlock({
  visualSupportType,
  supportCode,
  supportImagePath,
  supportImageName,
  supportFilePath,
  supportFileName
}: {
  visualSupportType?: VisualSupportType | null;
  supportCode?: string | null;
  supportImagePath?: string | null;
  supportImageName?: string | null;
  supportFilePath?: string | null;
  supportFileName?: string | null;
}) {
  const hasCode = Boolean(supportCode?.trim());
  const hasAsset = Boolean(supportImagePath || supportFilePath);

  if (!hasCode && !hasAsset) {
    return null;
  }

  const shouldRenderCode = visualSupportType === "CODE" || (!visualSupportType || visualSupportType === "NONE") && hasCode;
  const shouldRenderAsset = visualSupportType === "ASSET" || (!visualSupportType || visualSupportType === "NONE") && hasAsset;

  return (
    <section className="space-y-3 rounded-[28px] border border-red-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,245,245,0.98)_100%)] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Suporte visual</p>
      </div>

      {shouldRenderCode ? (
        <pre className="overflow-x-auto rounded-2xl border border-black/10 bg-[#0f0f11] p-4 font-mono text-sm leading-6 text-red-50 shadow-inner">
          <code>{supportCode}</code>
        </pre>
      ) : null}

      {shouldRenderAsset ? (
        <div className="space-y-4">
          {supportImagePath ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <Image
                alt={supportImageName || "Imagem de apoio"}
                className="h-auto w-full object-cover"
                height={420}
                src={getQuestionSupportAssetUrl(supportImagePath) || ""}
                unoptimized
                width={900}
              />
            </div>
          ) : null}

          {supportFilePath ? (
            <a
              className="inline-flex rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
              href={getQuestionSupportAssetUrl(supportFilePath) || "#"}
              rel="noreferrer"
              target="_blank"
            >
              Abrir apoio complementar: {supportFileName || "arquivo"}
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
