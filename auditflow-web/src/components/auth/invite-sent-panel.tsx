"use client";

/* Painel de confirmação reutilizado pelos fluxos de convite.
   O convidado recebe por e-mail um link para definir a própria senha; exibimos o
   link como contingência (copiável) caso o e-mail não chegue. */

import { useState } from "react";
import { I } from "@/components/ui/icons";
import { Btn } from "@/components/ui/button";

export function InviteSentPanel({
  email,
  link,
  onClose,
}: {
  email: string;
  link?: string | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="px-6 py-6 fade-in">
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
        style={{ background: "rgba(0,200,150,0.14)", color: "#0A8F6A" }}
      >
        <I.mail size={20} />
      </div>
      <h3 className="font-display text-[20px] text-text leading-tight">Convite enviado</h3>
      <p className="text-[13px] text-sub mt-1.5 leading-relaxed">
        Enviamos um e-mail para <span className="text-text font-medium">{email}</span> com um link para
        definir a própria senha e ativar o acesso. O link expira em alguns dias.
      </p>

      {link && (
        <div className="mt-5">
          {showLink ? (
            <div className="rounded-md border border-line bg-paper/40 p-3">
              <div className="text-[10.5px] tracking-[0.16em] uppercase text-sub mb-2">
                Link de ativação (contingência)
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11.5px] text-text bg-white border border-line rounded-md px-2.5 py-2 truncate select-all">
                  {link}
                </code>
                <Btn kind="ghost" onClick={copy} icon={copied ? <I.check /> : <I.copy />}>
                  {copied ? "Copiado" : "Copiar"}
                </Btn>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLink(true)}
              className="text-[12px] text-sub hover:text-text underline underline-offset-2"
            >
              Não recebeu o e-mail? Copiar link manualmente
            </button>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Btn kind="primary" icon={<I.check />} onClick={onClose}>
          Concluir
        </Btn>
      </div>
    </div>
  );
}
