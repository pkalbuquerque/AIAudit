"use client";

/* Fluxo 1 — Criar item PBC · POST /api/pbc-items?cycleId=
   Slide-over à direita (560px), 3 passos. RHF + Zod. */

import { Fragment, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { I } from "@/components/ui/icons";
import { Badge, Priority } from "@/components/ui/badge";
import { Btn } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { FormField, TextField } from "@/components/ui/form";
import { useClientUsers } from "@/hooks/use-audit-clients";
import { useCreatePbcItem } from "@/hooks/use-pbc-items";
import { handleApiError } from "@/lib/error-handler";
import { pushToast } from "@/store/toast-store";
import { fmtDate, MIN_DATE_ISO } from "@/lib/format";
import type { Prioridade } from "@/types";
import type { UserResponse } from "@/types/api";

const PRIORIDADES: { v: Prioridade; l: string; c: string; bg: string }[] = [
  { v: "BAIXA", l: "BAIXA", c: "#6B7280", bg: "rgba(107,114,128,0.12)" },
  { v: "MEDIA", l: "MÉDIA", c: "#B47600", bg: "rgba(240,165,0,0.16)" },
  { v: "ALTA", l: "ALTA", c: "#E5533C", bg: "rgba(229,83,60,0.14)" },
  { v: "CRITICA", l: "CRÍTICA", c: "#B91C1C", bg: "rgba(185,28,28,0.12)" },
];

const createPbcSchema = z.object({
  titulo: z.string().trim().min(1, "Informe um título."),
  descricao: z.string(),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]),
  prazo: z.string().min(1, "Selecione um prazo."),
  responsavelId: z.string().min(1, "Selecione um responsável."),
  criterios: z.array(z.string()),
});

type CreatePbcForm = z.infer<typeof createPbcSchema>;

const STEP_FIELDS: (keyof CreatePbcForm)[][] = [["titulo", "prazo"], ["responsavelId"], []];

function StepDots({
  step,
  maxReached,
  onJump,
}: {
  step: number;
  maxReached: number;
  onJump: (s: number) => void;
}) {
  const labels = ["Identificação", "Responsável", "Critérios de Aceite"];
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center">
        {[0, 1, 2].map((i) => {
          const done = i < step;
          const cur = i === step;
          const reachable = i <= maxReached;
          return (
            <Fragment key={i}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onJump(i)}
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors shrink-0"
                style={{
                  background: done || cur ? "#00C896" : "#E2E8F0",
                  color: done || cur ? "#0D1F2D" : "#9aa4b2",
                  cursor: reachable ? "pointer" : "default",
                }}
              >
                {done ? <I.check size={12} /> : i + 1}
              </button>
              {i < 2 && (
                <span className="w-7 h-px mx-0.5" style={{ background: i < step ? "#00C896" : "#E2E8F0" }} />
              )}
            </Fragment>
          );
        })}
      </div>
      <span className="text-[12px] text-sub">
        Passo {step + 1} de 3 — <span className="text-text font-medium">{labels[step]}</span>
      </span>
    </div>
  );
}

function UserPicker({
  auditClientId,
  value,
  onChange,
}: {
  auditClientId?: string | null;
  value: UserResponse | null;
  onChange: (u: UserResponse | null) => void;
}) {
  const [q, setQ] = useState("");
  const [openList, setOpenList] = useState(false);
  // GET /api/clients/{id}/users — usuários CLIENTE do cliente deste ciclo
  // (acessível a ADMIN e AUDITOR).
  const usersQ = useClientUsers(auditClientId);

  const clientes = (usersQ.data ?? []).filter((u) => u.ativo && u.perfil === "CLIENTE");
  const list = clientes.filter(
    (u) =>
      u.nome.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase())
  );

  if (value) {
    return (
      <div className="rounded-lg border border-line bg-white p-4 flex items-center gap-3">
        <Avatar name={value.nome} size={40} />
        <div className="leading-tight flex-1 min-w-0">
          <div className="text-[14px] text-text font-medium">{value.nome}</div>
          <div className="text-[12px] text-sub truncate">{value.email}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQ("");
          }}
          className="text-[12.5px] text-ink-900 font-medium hover:underline"
        >
          Alterar
        </button>
      </div>
    );
  }
  return (
    <div className="relative">
      <div className="relative">
        <I.search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpenList(true);
          }}
          onFocus={() => setOpenList(true)}
          placeholder="Buscar usuário do cliente…"
          className="w-full h-11 pl-9 pr-3 rounded-md border border-line bg-white text-[13px] placeholder:text-sub outline-none focus:border-mint focus:ring-2 focus:ring-mint/20"
        />
      </div>
      {openList && (
        <div className="mt-1.5 rounded-md border border-line bg-white overflow-hidden shadow-sm">
          {usersQ.isLoading && (
            <div className="px-3 py-4 text-[12.5px] text-sub text-center">Carregando usuários…</div>
          )}
          {usersQ.isError && (
            <div className="px-3 py-4 text-[12.5px] text-sub text-center">
              {handleApiError(usersQ.error, "Não foi possível listar os usuários.")}
            </div>
          )}
          {list.map((u) => (
            <button
              type="button"
              key={u.id}
              onClick={() => {
                onChange(u);
                setOpenList(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-paper text-left transition-colors border-b border-line/60 last:border-0"
            >
              <Avatar name={u.nome} size={30} />
              <div className="leading-tight">
                <div className="text-[13px] text-text">{u.nome}</div>
                <div className="text-[11.5px] text-sub">{u.email}</div>
              </div>
            </button>
          ))}
          {usersQ.isSuccess && !list.length && (
            <div className="px-3 py-4 text-[12.5px] text-sub text-center">
              Nenhum usuário CLIENTE encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CriteriaList({
  items,
  setItems,
}: {
  items: string[];
  setItems: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const dragIx = useRef<number | null>(null);
  const add = () => {
    if (draft.trim()) {
      setItems([...items, draft.trim()]);
      setDraft("");
    }
  };
  const remove = (i: number) => setItems(items.filter((_, ix) => ix !== i));
  const onDrop = (to: number) => {
    const from = dragIx.current;
    if (from === null || from === to) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setItems(next);
    dragIx.current = null;
  };
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="ex: Formato Excel ou PDF com abas separadas"
          className="flex-1 h-11 px-3 rounded-md border border-line bg-white text-[13px] placeholder:text-sub outline-none focus:border-mint focus:ring-2 focus:ring-mint/20"
        />
        <button
          type="button"
          onClick={add}
          className="h-11 px-4 rounded-md border border-line bg-paper text-text text-[13px] inline-flex items-center gap-1.5 hover:bg-white"
        >
          <I.plus size={14} />
          Adicionar
        </button>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((c, i) => (
          <li
            key={i}
            draggable
            onDragStart={() => (dragIx.current = i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
            className="group flex items-center gap-2.5 px-2.5 py-2.5 rounded-md border border-line bg-white"
          >
            <span className="cursor-grab text-sub/70 active:cursor-grabbing">
              <I.more size={15} className="rotate-90" />
            </span>
            <span className="flex-1 text-[13px] text-text">{c}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-sub hover:text-rust hover:bg-rust/10"
            >
              <I.x size={14} />
            </button>
          </li>
        ))}
      </ul>
      {!items.length && (
        <div className="mt-2 text-[12px] text-sub flex items-center gap-1.5">
          <I.alert size={12} className="text-amber" />
          Recomendado adicionar ao menos 1 critério (não obrigatório).
        </div>
      )}
    </div>
  );
}

export function CreatePbcSlideOver({
  cycleId,
  auditClientId,
  clientName,
  onClose,
}: {
  cycleId: string;
  auditClientId?: string | null;
  clientName?: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [responsavel, setResponsavel] = useState<UserResponse | null>(null);
  const createItem = useCreatePbcItem();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, submitCount },
  } = useForm<CreatePbcForm>({
    resolver: zodResolver(createPbcSchema),
    mode: "onTouched",
    defaultValues: {
      titulo: "",
      descricao: "",
      prioridade: "MEDIA",
      prazo: "",
      responsavelId: "",
      criterios: [],
    },
  });

  const values = watch();
  const prioMeta = PRIORIDADES.find((p) => p.v === values.prioridade)!;

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const goto = (s: number) => {
    setStep(s);
    setMaxReached((m) => Math.max(m, s));
  };
  const next = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (!valid) return;
    goto(step + 1);
  };
  const back = () => goto(step - 1);

  const submit = handleSubmit((data) => {
    createItem.mutate(
      {
        cycleId,
        data: {
          titulo: data.titulo,
          descricao: data.descricao || undefined,
          responsavelId: data.responsavelId,
          prazo: data.prazo,
          prioridade: data.prioridade,
          criteriosDeAceite: data.criterios.filter((c) => c.trim()),
        },
      },
      {
        onSuccess: (item) => {
          pushToast("success", `Item “${item.titulo}” criado e atribuído`);
          onClose();
        },
        onError: (err) => pushToast("error", handleApiError(err)),
      }
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end fade-in" style={{ background: "rgba(13,31,45,0.42)" }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-[560px] max-w-[94vw] bg-white h-full flex flex-col slide-in-right shadow-[-20px_0_60px_rgba(13,31,45,0.18)]">
        {/* cabeçalho */}
        <div className="px-7 pt-6 pb-5 border-b border-line">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[11px] tracking-[0.18em] uppercase text-sub mb-1">
                Lista PBC{clientName ? ` · ${clientName}` : ""}
              </div>
              <h2 className="font-display text-[24px] text-text leading-tight">Novo Item PBC</h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-md border border-line hover:bg-paper flex items-center justify-center"
            >
              <I.x size={16} />
            </button>
          </div>
          <StepDots step={step} maxReached={maxReached} onJump={goto} />
        </div>

        {/* corpo */}
        <div className="flex-1 overflow-auto px-7 py-6">
          {step === 0 && (
            <div className="fade-in">
              <FormField label="Título do item" required>
                <TextField {...register("titulo")} placeholder="ex: Balancete Geral — Dez/2024" />
                {errors.titulo && (
                  <div className="mt-1.5 text-[12px] text-rust flex items-center gap-1.5">
                    <I.alert size={12} />
                    {errors.titulo.message}
                  </div>
                )}
              </FormField>
              <FormField label="Descrição / instrução ao cliente">
                <textarea
                  rows={4}
                  {...register("descricao")}
                  placeholder="Descreva o que precisa ser entregue, formato esperado, referências específicas…"
                  className="w-full p-3 rounded-md border border-line bg-white text-[13px] placeholder:text-sub outline-none focus:border-mint focus:ring-2 focus:ring-mint/20 resize-none"
                />
              </FormField>
              <FormField label="Prioridade" required>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORIDADES.map((p) => {
                    const on = values.prioridade === p.v;
                    return (
                      <button
                        type="button"
                        key={p.v}
                        onClick={() => setValue("prioridade", p.v)}
                        className="h-11 rounded-md border text-[12px] font-semibold tracking-[0.04em] inline-flex items-center justify-center gap-1.5 transition-all"
                        style={
                          on
                            ? { color: p.c, background: p.bg, borderColor: p.c }
                            : { color: "#6B7280", background: "#fff", borderColor: "#E2E8F0" }
                        }
                      >
                        <span className="w-[3px] h-3.5 rounded-sm" style={{ background: on ? p.c : "#C4CCD6" }} />
                        {p.l}
                      </button>
                    );
                  })}
                </div>
              </FormField>
              <FormField label="Prazo de entrega" required hint="não permite datas passadas">
                <div className="relative">
                  <I.cal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
                  <input
                    type="date"
                    min={MIN_DATE_ISO}
                    {...register("prazo")}
                    className="w-full h-11 pl-9 pr-3 rounded-md border border-line bg-white text-[13px] text-text outline-none focus:border-mint focus:ring-2 focus:ring-mint/20"
                  />
                </div>
                {errors.prazo && (
                  <div className="mt-1.5 text-[12px] text-rust flex items-center gap-1.5">
                    <I.alert size={12} />
                    {errors.prazo.message}
                  </div>
                )}
              </FormField>
            </div>
          )}

          {step === 1 && (
            <div className="fade-in">
              <FormField label="Atribuir para" required>
                <UserPicker
                  auditClientId={auditClientId}
                  value={responsavel}
                  onChange={(u) => {
                    setResponsavel(u);
                    setValue("responsavelId", u?.id ?? "", { shouldValidate: submitCount > 0 });
                  }}
                />
                {errors.responsavelId && (
                  <div className="mt-1.5 text-[12px] text-rust flex items-center gap-1.5">
                    <I.alert size={12} />
                    {errors.responsavelId.message}
                  </div>
                )}
              </FormField>
              <div className="mt-6 flex items-start gap-3 p-4 rounded-lg border border-line bg-paper/40">
                <I.mail size={15} className="text-ink-900 mt-0.5 shrink-0" />
                <div className="text-[12px] text-sub leading-relaxed">
                  {responsavel
                    ? `${responsavel.nome} verá este item no Portal do Cliente assim que for criado.`
                    : "O responsável verá este item no Portal do Cliente assim que for criado."}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <p className="text-[13px] text-sub leading-relaxed mb-4">
                Defina os critérios que o documento deve atender para ser aprovado. O cliente verá esta
                lista ao entregar o arquivo.
              </p>
              <CriteriaList items={values.criterios} setItems={(next) => setValue("criterios", next)} />

              {/* prévia ao vivo */}
              <div className="mt-7">
                <div className="text-[11px] tracking-[0.18em] uppercase text-sub mb-2.5">
                  É assim que o cliente vai ver este item
                </div>
                <article className="rounded-lg border border-line overflow-hidden bg-white">
                  <div className="flex">
                    <div style={{ width: 4, background: prioMeta.c }} />
                    <div className="flex-1 p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge kind="pendente" />
                        <Priority level={values.prioridade} />
                        <span className="ml-auto text-[11.5px] text-sub tabular-nums">
                          {values.prazo ? `Prazo: ${fmtDate(values.prazo)}` : "Prazo: —"}
                        </span>
                      </div>
                      <h3 className="font-display text-[18px] text-text leading-tight">
                        {values.titulo || "Título do item"}
                      </h3>
                      {values.descricao && (
                        <p className="text-[12.5px] text-sub mt-1 leading-snug line-clamp-2">{values.descricao}</p>
                      )}
                      {values.criterios.length > 0 && (
                        <div className="mt-3">
                          <div className="text-[10.5px] tracking-[0.16em] uppercase text-sub mb-1">
                            Critérios de aceite
                          </div>
                          <ul className="flex flex-col gap-1 text-[12.5px] text-text">
                            {values.criterios.map((c, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span
                                  className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ background: "#0D1F2D" }}
                                />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              </div>
            </div>
          )}
        </div>

        {/* rodapé */}
        <div className="px-7 py-4 border-t border-line flex items-center justify-between bg-white">
          {step === 0 ? (
            <Btn kind="ghost" onClick={onClose}>
              Cancelar
            </Btn>
          ) : (
            <Btn kind="ghost" icon={<I.arrowL />} onClick={back}>
              Voltar
            </Btn>
          )}
          {step < 2 ? (
            <button
              type="button"
              onClick={next}
              className="h-10 px-5 rounded-md text-[13px] font-medium inline-flex items-center gap-2 bg-ink-900 text-white hover:bg-ink-800"
            >
              Próximo <I.arrowR size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={createItem.isPending}
              className="h-10 px-5 rounded-md text-[13px] font-semibold inline-flex items-center gap-2 text-ink-900 hover:brightness-95 disabled:opacity-60"
              style={{ background: "#00C896" }}
            >
              {createItem.isPending ? "Criando…" : "Criar Item PBC"} <I.check size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
