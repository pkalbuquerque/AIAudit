"use client";

/* Template de e-mail — Lembrete de item rejeitado (pré-visualização) */

import { I } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Btn } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Topbar } from "@/components/layout/topbar";

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-line/70 last:border-0">
      <span className="text-[11.5px] text-sub">{label}</span>
      <span className="text-[12.5px] text-text text-right truncate" style={{ maxWidth: 200 }}>
        {value}
      </span>
    </div>
  );
}

const SANS = "'DM Sans', sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

/* janela de cliente de e-mail emoldurando o e-mail HTML responsivo */
function EmailDevice() {
  return (
    <div className="rounded-xl border border-line bg-white overflow-hidden" style={{ width: 640, maxWidth: "100%" }}>
      <div className="h-9 flex items-center gap-1.5 px-3 border-b border-line bg-paper/60">
        <span className="w-2.5 h-2.5 rounded-full bg-[#E5533C]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#F0A500]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#00C896]" />
        <span className="ml-3 text-[11px] text-sub flex-1 text-center">Caixa de entrada — Maria Souza</span>
      </div>
      <div className="px-5 py-3 border-b border-line flex items-center justify-between text-[11.5px]">
        <div className="flex items-center gap-2">
          <Avatar name="AuditFlow" size={28} tone="#0D1F2D" />
          <div className="leading-tight">
            <div className="text-text font-medium">
              AuditFlow Notificações <span className="text-sub font-normal">&lt;auditflow@notificacoes.io&gt;</span>
            </div>
            <div className="text-sub">para mim · 21 mai. 09:02</div>
          </div>
        </div>
        <div className="text-sub tabular-nums">Re: Auditoria 2025</div>
      </div>

      {/* corpo do e-mail */}
      <div className="bg-paper p-6">
        <table
          cellPadding="0"
          cellSpacing="0"
          style={{
            width: "100%",
            maxWidth: 560,
            margin: "0 auto",
            background: "#FFFFFF",
            borderRadius: 10,
            overflow: "hidden",
            border: "1px solid #E2E8F0",
          }}
        >
          <tbody>
            {/* faixa do cabeçalho */}
            <tr>
              <td style={{ background: "#0D1F2D", padding: "26px 28px" }}>
                <table cellPadding="0" cellSpacing="0" width="100%">
                  <tbody>
                    <tr>
                      <td style={{ verticalAlign: "middle" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              width: 30,
                              height: 30,
                              background: "#00C896",
                              borderRadius: 6,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: SERIF,
                              color: "#0D1F2D",
                              fontSize: 17,
                              lineHeight: 1,
                            }}
                          >
                            A
                          </span>
                          <span style={{ fontFamily: SERIF, color: "#FFFFFF", fontSize: 18 }}>AuditFlow</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "right", verticalAlign: "middle" }}>
                        <span
                          style={{
                            color: "rgba(255,255,255,0.55)",
                            fontSize: 10.5,
                            letterSpacing: 2,
                            textTransform: "uppercase",
                          }}
                        >
                          Notificação · Projeto 2025
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* corpo */}
            <tr>
              <td style={{ padding: "32px 32px 8px" }}>
                <p style={{ fontFamily: SANS, fontSize: 14.5, color: "#1C1C1E", margin: 0 }}>Olá, Maria,</p>
                <h1 style={{ fontFamily: SERIF, fontSize: 26, lineHeight: 1.2, color: "#0D1F2D", margin: "12px 0 14px" }}>
                  Você possui <span style={{ color: "#E5533C" }}>1 item rejeitado</span> que precisa de atenção
                  imediata.
                </h1>
                <p style={{ fontFamily: SANS, fontSize: 13.5, color: "#6B7280", margin: 0, lineHeight: 1.55 }}>
                  No projeto <span style={{ color: "#1C1C1E", fontWeight: 500 }}>Auditoria Anual 2025 — Acme Corp</span>,
                  o auditor responsável solicitou um ajuste no documento abaixo. Corrija e reenvie pelo portal para
                  manter o projeto no prazo.
                </p>
              </td>
            </tr>

            {/* card do item */}
            <tr>
              <td style={{ padding: "20px 32px 8px" }}>
                <table
                  cellPadding="0"
                  cellSpacing="0"
                  width="100%"
                  style={{ border: "1px solid #E2E8F0", borderRadius: 8, borderLeft: "3px solid #E5533C" }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: "16px 18px" }}>
                        <table cellPadding="0" cellSpacing="0" width="100%">
                          <tbody>
                            <tr>
                              <td>
                                <span
                                  style={{
                                    background: "rgba(229,83,60,0.14)",
                                    color: "#E5533C",
                                    padding: "3px 9px",
                                    borderRadius: 99,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    fontFamily: SANS,
                                  }}
                                >
                                  ● REJEITADO
                                </span>
                                <span
                                  style={{
                                    color: "#E5533C",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    fontFamily: SANS,
                                    marginLeft: 10,
                                  }}
                                >
                                  PRIORIDADE ALTA
                                </span>
                              </td>
                              <td style={{ textAlign: "right", color: "#6B7280", fontSize: 11.5, fontFamily: SANS }}>
                                Prazo 20/05/2025 · 3d atraso
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ fontFamily: SERIF, fontSize: 19, color: "#0D1F2D", marginTop: 12, lineHeight: 1.25 }}>
                          Balancete Geral — Dez/2024
                        </div>
                        <div
                          style={{
                            fontFamily: SANS,
                            fontSize: 13,
                            color: "#1C1C1E",
                            marginTop: 12,
                            padding: "12px 14px",
                            background: "#F4F6F8",
                            borderRadius: 6,
                            lineHeight: 1.5,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10.5,
                              color: "#6B7280",
                              textTransform: "uppercase",
                              letterSpacing: 2,
                              marginBottom: 4,
                            }}
                          >
                            Comentário do auditor
                          </div>
                          <em style={{ color: "#1C1C1E", fontStyle: "italic" }}>
                            “O arquivo enviado anteriormente não possuía assinatura digital do contador responsável.
                            Por favor reenviar a versão assinada.”
                          </em>
                        </div>
                        <div style={{ marginTop: 16 }}>
                          <a
                            href="#"
                            style={{
                              display: "inline-block",
                              padding: "10px 16px",
                              borderRadius: 6,
                              background: "#FFFFFF",
                              border: "1px solid #E2E8F0",
                              color: "#0D1F2D",
                              textDecoration: "none",
                              fontSize: 12.5,
                              fontFamily: SANS,
                              fontWeight: 500,
                            }}
                          >
                            Acessar item →
                          </a>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* CTA */}
            <tr>
              <td style={{ padding: "24px 32px 8px", textAlign: "center" }}>
                <p style={{ fontFamily: SANS, fontSize: 13, color: "#6B7280", margin: "0 0 14px" }}>
                  Acesse o portal para corrigir e reenviar o documento.
                </p>
                <a
                  href="#"
                  style={{
                    display: "inline-block",
                    background: "#00C896",
                    color: "#0D1F2D",
                    padding: "13px 28px",
                    borderRadius: 6,
                    textDecoration: "none",
                    fontFamily: SANS,
                    fontWeight: 600,
                    fontSize: 13.5,
                  }}
                >
                  Acessar Portal do Cliente →
                </a>
              </td>
            </tr>

            {/* texto secundário */}
            <tr>
              <td style={{ padding: "20px 32px 28px", borderTop: "1px solid #E2E8F0" }}>
                <table width="100%" cellPadding="0" cellSpacing="0">
                  <tbody>
                    <tr>
                      <td>
                        <div
                          style={{
                            fontSize: 10.5,
                            color: "#6B7280",
                            textTransform: "uppercase",
                            letterSpacing: 2,
                            marginBottom: 4,
                            fontFamily: SANS,
                          }}
                        >
                          Auditor responsável
                        </div>
                        <div style={{ fontSize: 13, color: "#0D1F2D", fontFamily: SANS, fontWeight: 500 }}>
                          Rafael Andrade
                        </div>
                        <div style={{ fontSize: 11.5, color: "#6B7280", fontFamily: SANS }}>
                          rafael.andrade@auditflow.io
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: 10.5,
                            color: "#6B7280",
                            textTransform: "uppercase",
                            letterSpacing: 2,
                            marginBottom: 4,
                            fontFamily: SANS,
                          }}
                        >
                          SLA do projeto
                        </div>
                        <div style={{ fontSize: 13, color: "#0D1F2D", fontFamily: SANS, fontWeight: 500 }}>
                          92% no prazo
                        </div>
                        <div style={{ fontSize: 11.5, color: "#6B7280", fontFamily: SANS }}>últimos 30 dias</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* rodapé */}
            <tr>
              <td style={{ background: "#F4F6F8", padding: "18px 32px", borderTop: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#6B7280", fontFamily: SANS, textAlign: "center", lineHeight: 1.7 }}>
                  Este é um e-mail automático — você está recebendo porque foi designada responsável neste projeto.
                  <br />
                  <a href="#" style={{ color: "#6B7280", textDecoration: "underline" }}>
                    AuditFlow
                  </a>{" "}
                  ·{" "}
                  <a href="#" style={{ color: "#6B7280", textDecoration: "underline" }}>
                    Suporte
                  </a>{" "}
                  ·{" "}
                  <a href="#" style={{ color: "#6B7280", textDecoration: "underline" }}>
                    Cancelar notificações
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function EmailTemplatePage() {
  return (
    <div className="min-h-screen bg-paper">
      <Topbar
        breadcrumb={["Templates", "E-mail de lembrete"]}
        title="Lembrete — Item Rejeitado"
        subtitle="Disparado automaticamente quando um item PBC é rejeitado pelo auditor."
        action={
          <>
            <Btn kind="ghost" icon={<I.send />}>Enviar teste</Btn>
            <Btn kind="primary" icon={<I.check />}>Salvar template</Btn>
          </>
        }
      />

      <div className="px-10 py-8 grid gap-7" style={{ gridTemplateColumns: "320px minmax(0, 1fr)" }}>
        {/* sidebar de especificação */}
        <aside className="min-w-0">
          <div className="bg-white border border-line rounded-lg p-5">
            <div className="text-[10.5px] tracking-[0.18em] uppercase text-sub mb-3">Detalhes do envio</div>
            <SpecRow label="De" value="auditflow@notificacoes.io" />
            <SpecRow label="Para" value="maria.souza@acme.com.br" />
            <SpecRow label="Assunto" value="Você tem 1 item rejeitado para corrigir" />
            <SpecRow label="Gatilho" value="status → rejeitado" />
            <SpecRow label="Idioma" value="pt-BR" />
          </div>
          <div className="bg-white border border-line rounded-lg p-5 mt-4">
            <div className="text-[10.5px] tracking-[0.18em] uppercase text-sub mb-3">Variáveis dinâmicas</div>
            <ul className="flex flex-col gap-1.5 text-[12.5px] font-mono">
              {[
                "{{ collaborator.first_name }}",
                "{{ cycle.name }}",
                "{{ cycle.client }}",
                "{{ item.title }}",
                "{{ item.due_date }}",
                "{{ item.last_comment }}",
                "{{ portal.url }}",
              ].map((v) => (
                <li key={v} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-sub" />
                  <code className="text-text">{v}</code>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-line rounded-lg p-5 mt-4">
            <div className="text-[10.5px] tracking-[0.18em] uppercase text-sub mb-3">Histórico de disparos</div>
            <ul className="flex flex-col gap-3 text-[12px]">
              {[
                { d: "21/05 09:02", to: "maria.souza@acme.com.br", st: "entregue" },
                { d: "19/05 17:48", to: "maria.souza@acme.com.br", st: "aberto" },
                { d: "15/05 11:13", to: "joao.lima@acme.com.br", st: "entregue" },
              ].map((e, i) => (
                <li key={i} className="flex items-center justify-between">
                  <div>
                    <div className="text-text">{e.to}</div>
                    <div className="text-sub tabular-nums">{e.d}</div>
                  </div>
                  <Badge kind={e.st === "aberto" ? "aprovado" : "andamento"} size="sm">
                    {e.st}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* canvas do e-mail */}
        <main className="min-w-0">
          <div className="flex items-center justify-center">
            <EmailDevice />
          </div>
        </main>
      </div>
    </div>
  );
}
