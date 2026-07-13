"use client";

import { useState } from "react";
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
  const [textSize, setTextSize] = useState<"sm" | "base" | "lg">("sm");

  const hasCode = Boolean(supportCode?.trim());
  const hasAsset = Boolean(supportImagePath || supportFilePath);

  if (!hasCode && !hasAsset) {
    return null;
  }

  const shouldRenderCode = visualSupportType === "CODE" || (!visualSupportType || visualSupportType === "NONE") && hasCode;
  const shouldRenderAsset = visualSupportType === "ASSET" || (!visualSupportType || visualSupportType === "NONE") && hasAsset;

  return (
    <section className="space-y-3 rounded-[28px] border border-red-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,245,245,0.98)_100%)] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Suporte visual</p>
        
        {shouldRenderCode && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTextSize("sm")}
              className={`rounded px-2 py-1 text-xs font-bold transition ${textSize === "sm" ? "bg-red-200 text-red-900" : "text-red-600 hover:bg-red-50"}`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setTextSize("base")}
              className={`rounded px-2 py-1 text-sm font-bold transition ${textSize === "base" ? "bg-red-200 text-red-900" : "text-red-600 hover:bg-red-50"}`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setTextSize("lg")}
              className={`rounded px-2 py-1 text-base font-bold transition ${textSize === "lg" ? "bg-red-200 text-red-900" : "text-red-600 hover:bg-red-50"}`}
            >
              A+
            </button>
          </div>
        )}
      </div>

      {shouldRenderCode ? (
        <pre className={`overflow-x-auto rounded-2xl border border-black/10 bg-[#0f0f11] p-4 font-mono leading-relaxed text-red-50 shadow-inner ${textSize === 'sm' ? 'text-xs md:text-sm' : textSize === 'base' ? 'text-sm md:text-base' : 'text-base md:text-lg'}`}>
          <code>{supportCode}</code>
        </pre>
      ) : null}

      {shouldRenderAsset ? (
        <div className="space-y-4">
          {supportImagePath ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <Image
                alt={supportImageName || "Imagem de apoio"}
                className="h-auto w-full max-h-[60vh] object-contain"
                height={600}
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
