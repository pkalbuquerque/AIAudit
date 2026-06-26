"use client";

/* Configurações da Conta / Tenant */

import { useEffect, useState } from "react";
import { I, type IconComponent } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Btn } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { FormField, SelectField, TextField, Toggle } from "@/components/ui/form";
import { Topbar } from "@/components/layout/topbar";
import { usePerfil } from "@/store/perfil-context";
import { useUsers, useDeactivateUser, useUpdateProfile } from "@/hooks/use-users";
import { useTenant, useUpdateTenant } from "@/hooks/use-tenant";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { useAuth } from "@/contexts/auth-context";
import { InviteAuditorModal } from "@/components/settings/invite-auditor-modal";
import { Skeleton, ErrorAlert } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/error-handler";
import { pushToast } from "@/store/toast-store";
import { fmtDate } from "@/lib/format";
import type { Perfil } from "@/types/api";

const MANAGER_TABS: { id: string; label: string; Ic: IconComponent }[] = [
  { id: "perfil", label: "Perfil da Empresa", Ic: I.bldg },
  { id: "usuarios", label: "Usuários e Permissões", Ic: I.users },
  { id: "notif", label: "Notificações", Ic: I.bell },
  { id: "seg", label: "Segurança", Ic: I.lock },
  { id: "plano", label: "Plano e Faturamento", Ic: I.card },
];

const AUDITOR_TABS: { id: string; label: string; Ic: IconComponent }[] = [
  { id: "meuperfil", label: "Meu Perfil", Ic: I.user },
  { id: "notif", label: "Notificações", Ic: I.bell },
  { id: "seg", label: "Segurança", Ic: I.lock },
];

const ROLE_COLORS: Record<string, { c: string; b: string }> = {
  Admin: { c: "#1F5FB4", b: "rgba(44,123,229,0.14)" },
  "Auditor Sênior": { c: "#0A8F6A", b: "rgba(0,200,150,0.16)" },
  Auditor: { c: "#4B5563", b: "rgba(107,114,128,0.16)" },
  Observador: { c: "#B47600", b: "rgba(240,165,0,0.16)" },
};

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_COLORS[role];
  return (
    <span
      className="inline-flex px-2.5 py-1 rounded-full text-[11.5px] font-medium"
      style={{ color: s.c, background: s.b }}
    >
      {role}
    </span>
  );
}

function NotifRow({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3 border-b border-line/70 last:border-0">
      <span className="text-[13px] text-text">{label}</span>
      <Toggle on={on} onChange={setOn} />
    </div>
  );
}

function NotifGroup({ title, items }: { title: string; items: [string, boolean][] }) {
  return (
    <div className="bg-white border border-line rounded-lg p-5 mb-4">
      <div className="text-[11px] tracking-[0.16em] uppercase text-ink-900 font-semibold mb-1">{title}</div>
      <div>
        {items.map((it, i) => (
          <NotifRow key={i} label={it[0]} defaultOn={it[1]} />
        ))}
      </div>
    </div>
  );
}

function SettingsHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="font-display text-[22px] text-text">{title}</h2>
        {hint && <div className="text-[12.5px] text-sub mt-0.5">{hint}</div>}
      </div>
      {action}
    </div>
  );
}

export default function SettingsPage() {
  const { perfil } = usePerfil();
  const isM = perfil === "manager";
  const tabs = isM ? MANAGER_TABS : AUDITOR_TABS;
  const [tab, setTab] = useState(isM ? "perfil" : "meuperfil");
  const [mfaAdmin, setMfaAdmin] = useState(true);
  const [mfaAll, setMfaAll] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Usuários internos reais (GET /api/users) — só carrega para o manager (ADMIN).
  const usersQ = useUsers(isM);
  const logsQ = useAuditLogs(isM);
  const deactivate = useDeactivateUser();
  const perfilLabel = (p: Perfil) => (p === "ADMIN" ? "Admin" : "Auditor");
  const handleDeactivate = (id: string, nome: string) => {
    if (typeof window !== "undefined" && !window.confirm(`Desativar ${nome}? O usuário perderá o acesso.`))
      return;
    deactivate.mutate(id, {
      onSuccess: () => pushToast("success", `${nome} desativado`),
      onError: (err) => pushToast("error", handleApiError(err)),
    });
  };

  // Perfil da empresa (tenant) — dados reais
  const tenantQ = useTenant(isM);
  const updateTenant = useUpdateTenant();
  const [company, setCompany] = useState({
    nome: "",
    emailContato: "",
    cnpj: "",
    site: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
  });
  useEffect(() => {
    const t = tenantQ.data;
    if (t)
      setCompany({
        nome: t.nome ?? "",
        emailContato: t.emailContato ?? "",
        cnpj: t.cnpj ?? "",
        site: t.site ?? "",
        endereco: t.endereco ?? "",
        cidade: t.cidade ?? "",
        estado: t.estado ?? "",
        cep: t.cep ?? "",
      });
  }, [tenantQ.data]);
  const setC = (k: keyof typeof company) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCompany((c) => ({ ...c, [k]: e.target.value }));
  const saveCompany = () =>
    updateTenant.mutate(company, {
      onSuccess: () => pushToast("success", "Perfil da empresa salvo"),
      onError: (err) => pushToast("error", handleApiError(err)),
    });

  // Meu perfil — dados reais
  const { user, updateUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const [meName, setMeName] = useState("");
  useEffect(() => {
    if (user) setMeName(user.nome);
  }, [user]);
  const saveProfile = () =>
    updateProfile.mutate(
      { nome: meName },
      {
        onSuccess: (u) => {
          updateUser(u);
          pushToast("success", "Perfil atualizado");
        },
        onError: (err) => pushToast("error", handleApiError(err)),
      }
    );

  // mantém a aba válida ao trocar de perfil
  useEffect(() => {
    if (!tabs.find((t) => t.id === tab)) setTab(tabs[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil]);

  return (
    <div>
      <Topbar
        perfil={perfil}
        title="Configurações"
        subtitle={isM ? "Administração da firma · AuditFlow Professional" : "Suas preferências pessoais"}
      />
      <div className="px-10 py-8 flex gap-8">
        {/* navegação interna */}
        <nav className="w-[200px] shrink-0">
          <div className="flex flex-col gap-0.5 sticky top-6">
            {tabs.map((t) => {
              const A = t.Ic;
              const is = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] text-left transition-colors ${
                    is
                      ? "bg-white border border-line text-text shadow-sm"
                      : "text-sub hover:text-text hover:bg-white/60 border border-transparent"
                  }`}
                >
                  <A size={16} className={is ? "text-ink-900" : "text-sub"} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0 max-w-[820px]">
          {tab === "meuperfil" && (
            <div>
              <SettingsHeader title="Meu Perfil" hint="Seus dados pessoais." />
              <div className="bg-white border border-line rounded-lg p-6">
                <div className="flex items-center gap-5 pb-6 border-b border-line">
                  <Avatar name={user?.nome ?? "—"} size={72} tone="#1A3A4A" />
                  <div className="leading-tight">
                    <div className="text-[15px] text-text font-medium">{user?.nome}</div>
                    <div className="text-[12.5px] text-sub">{user?.email}</div>
                  </div>
                </div>
                <div className="pt-6 grid grid-cols-2 gap-x-4">
                  <FormField label="Nome completo" required>
                    <TextField value={meName} onChange={(e) => setMeName(e.target.value)} />
                  </FormField>
                  <FormField label="E-mail" hint="o e-mail de login não pode ser alterado aqui">
                    <TextField value={user?.email ?? ""} icon={<I.mail />} disabled readOnly />
                  </FormField>
                </div>
                <div className="pt-2 flex justify-end">
                  <Btn
                    kind="primary"
                    icon={<I.check />}
                    onClick={saveProfile}
                    disabled={updateProfile.isPending || !meName.trim()}
                  >
                    {updateProfile.isPending ? "Salvando…" : "Salvar Alterações"}
                  </Btn>
                </div>
              </div>
            </div>
          )}

          {tab === "perfil" && (
            <div>
              <SettingsHeader title="Perfil da Empresa" hint="Informações da firma de auditoria." />
              {tenantQ.isError && (
                <ErrorAlert message={handleApiError(tenantQ.error)} onRetry={() => tenantQ.refetch()} />
              )}
              {tenantQ.isLoading && <Skeleton className="h-[320px]" />}
              {tenantQ.isSuccess && (
                <div className="bg-white border border-line rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-x-4">
                    <FormField label="Nome da firma" required className="col-span-2">
                      <TextField value={company.nome} onChange={setC("nome")} />
                    </FormField>
                    <FormField label="E-mail de contato">
                      <TextField value={company.emailContato} onChange={setC("emailContato")} icon={<I.mail />} />
                    </FormField>
                    <FormField label="CNPJ">
                      <TextField value={company.cnpj} onChange={setC("cnpj")} placeholder="00.000.000/0000-00" />
                    </FormField>
                    <FormField label="Site">
                      <TextField value={company.site} onChange={setC("site")} icon={<I.globe />} placeholder="https://" />
                    </FormField>
                    <FormField label="Endereço">
                      <TextField value={company.endereco} onChange={setC("endereco")} />
                    </FormField>
                    <FormField label="Cidade">
                      <TextField value={company.cidade} onChange={setC("cidade")} />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Estado">
                        <SelectField
                          value={company.estado}
                          onChange={setC("estado")}
                          options={["", "SP", "RJ", "MG", "RS", "PR", "SC", "BA", "PE", "CE"]}
                        />
                      </FormField>
                      <FormField label="CEP">
                        <TextField value={company.cep} onChange={setC("cep")} placeholder="00000-000" />
                      </FormField>
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Btn
                      kind="primary"
                      icon={<I.check />}
                      onClick={saveCompany}
                      disabled={updateTenant.isPending || !company.nome.trim()}
                    >
                      {updateTenant.isPending ? "Salvando…" : "Salvar Alterações"}
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "usuarios" && (
            <div>
              <SettingsHeader
                title="Usuários e Permissões"
                hint="Auditores internos da firma."
                action={
                  <Btn kind="primary" size="sm" icon={<I.plus />} onClick={() => setInviteOpen(true)}>
                    Convidar Auditor
                  </Btn>
                }
              />
              {usersQ.isError && (
                <ErrorAlert message={handleApiError(usersQ.error)} onRetry={() => usersQ.refetch()} />
              )}
              {usersQ.isLoading && <Skeleton className="h-[220px]" />}
              {usersQ.isSuccess && (
                <div className="bg-white border border-line rounded-lg overflow-hidden">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-left text-[11px] tracking-[0.12em] uppercase text-sub border-b border-line bg-paper/40">
                        <th className="px-5 py-3 font-medium">Nome</th>
                        <th className="px-5 py-3 font-medium">Perfil</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Adicionado em</th>
                        <th className="px-5 py-3 font-medium text-right pr-6">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersQ.data.map((u) => (
                        <tr key={u.id} className="row-hover border-b border-line/70 last:border-0">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={u.nome} size={30} />
                              <div className="leading-tight">
                                <div className="text-text">{u.nome}</div>
                                <div className="text-[11.5px] text-sub">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <RoleBadge role={perfilLabel(u.perfil)} />
                          </td>
                          <td className="px-5 py-4">
                            {u.ativo ? (
                              <Badge kind="encerrado" size="sm">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge size="sm">Inativo</Badge>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sub tabular-nums">{fmtDate(u.criadoEm)}</td>
                          <td className="px-5 py-4 text-right pr-5">
                            {u.ativo ? (
                              <button
                                onClick={() => handleDeactivate(u.id, u.nome)}
                                disabled={deactivate.isPending}
                                className="text-[12px] text-sub hover:text-rust disabled:opacity-40"
                              >
                                Desativar
                              </button>
                            ) : (
                              <span className="text-[12px] text-sub">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!usersQ.data.length && (
                        <tr>
                          <td colSpan={5} className="px-5 py-10 text-center text-sub text-[13px]">
                            Nenhum auditor cadastrado. Use “Convidar Auditor”.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-3 flex items-center gap-2 flex-wrap text-[11.5px] text-sub">
                <span>Perfis:</span>
                {Object.keys(ROLE_COLORS).map((r) => (
                  <RoleBadge key={r} role={r} />
                ))}
              </div>
            </div>
          )}

          {tab === "notif" && (
            <div>
              <SettingsHeader
                title="Notificações"
                hint={isM ? "Controle o que dispara e-mails automáticos." : "Suas notificações pessoais."}
              />
              <NotifGroup
                title={isM ? "Para auditores" : "Minhas notificações"}
                items={[
                  ["Item PBC aprovado pelo auditor", true],
                  ["Item PBC rejeitado pelo auditor", true],
                  ["Novo documento enviado pelo cliente", true],
                  ["Cliente aceitou convite", false],
                ]}
              />
              {isM && (
                <NotifGroup
                  title="Lembretes automáticos ao cliente"
                  items={[
                    ["5 dias antes do prazo", true],
                    ["1 dia antes do prazo", true],
                    ["No dia do vencimento", true],
                    ["Dia seguinte ao atraso", true],
                    ["Lembrete semanal para itens pendentes", false],
                  ]}
                />
              )}
              {isM && (
                <NotifGroup
                  title="Relatórios automáticos"
                  items={[
                    ["Resumo semanal por e-mail (toda segunda-feira)", false],
                    ["Alerta de projetos sem atividade há mais de 7 dias", false],
                  ]}
                />
              )}
            </div>
          )}

          {tab === "seg" && (
            <div>
              <SettingsHeader
                title="Segurança"
                hint={isM ? "Políticas de acesso da firma." : "Senha e autenticação da sua conta."}
              />
              {!isM && (
                <div className="bg-white border border-line rounded-lg p-6 mb-4">
                  <div className="text-[11px] tracking-[0.16em] uppercase text-ink-900 font-semibold mb-4">
                    Minha conta
                  </div>
                  <div className="grid grid-cols-2 gap-x-5">
                    <FormField label="Senha atual">
                      <TextField type="password" defaultValue="········" />
                    </FormField>
                    <FormField label="Nova senha">
                      <TextField type="password" placeholder="Mínimo 12 caracteres" />
                    </FormField>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-line/70">
                    <div>
                      <div className="text-[13px] text-text">Autenticação em dois fatores (MFA)</div>
                      <div className="text-[11.5px] text-sub">Proteja sua conta com um segundo fator</div>
                    </div>
                    <Toggle on={mfaAdmin} onChange={setMfaAdmin} />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Btn kind="primary" icon={<I.check />}>
                      Atualizar senha
                    </Btn>
                  </div>
                </div>
              )}
              {isM && (
                <div className="bg-white border border-line rounded-lg p-6 mb-4">
                  <div className="text-[11px] tracking-[0.16em] uppercase text-ink-900 font-semibold mb-4">
                    Autenticação
                  </div>
                  <div className="grid grid-cols-2 gap-x-5">
                    <FormField label="Política de senha">
                      <SelectField
                        defaultValue="Mínimo 12 caracteres"
                        options={["Mínimo 8 caracteres", "Mínimo 12 caracteres", "Mínimo 16 caracteres"]}
                      />
                    </FormField>
                    <FormField label="Expiração de senha">
                      <SelectField defaultValue="90 dias" options={["90 dias", "180 dias", "Nunca"]} />
                    </FormField>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-line/70">
                    <div>
                      <div className="text-[13px] text-text">MFA obrigatório para admins</div>
                      <div className="text-[11.5px] text-sub">Autenticação em dois fatores para perfis Admin</div>
                    </div>
                    <Toggle on={mfaAdmin} onChange={setMfaAdmin} />
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-line/70">
                    <div>
                      <div className="text-[13px] text-text">MFA obrigatório para todos</div>
                      <div className="text-[11.5px] text-sub">Exige MFA de todos os usuários internos</div>
                    </div>
                    <Toggle on={mfaAll} onChange={setMfaAll} />
                  </div>
                </div>
              )}
              {isM && (
                <div className="bg-white border border-line rounded-lg p-6 mb-4">
                  <div className="text-[11px] tracking-[0.16em] uppercase text-ink-900 font-semibold mb-4">
                    Sessão
                  </div>
                  <div className="grid grid-cols-2 gap-x-5">
                    <FormField label="Timeout de inatividade">
                      <SelectField defaultValue="1 hora" options={["30 minutos", "1 hora", "4 horas", "8 horas"]} />
                    </FormField>
                    <FormField label="Máximo de sessões simultâneas">
                      <SelectField defaultValue="3" options={["1", "3", "Ilimitado"]} />
                    </FormField>
                  </div>
                </div>
              )}
              <div className="bg-white border border-line rounded-lg p-6">
                <div className="text-[11px] tracking-[0.16em] uppercase text-ink-900 font-semibold mb-3">
                  Atividade recente
                </div>
                {!isM ? (
                  <div className="text-[12.5px] text-sub py-2">
                    A trilha de auditoria completa está disponível para administradores.
                  </div>
                ) : (
                  <>
                    {logsQ.isError && (
                      <ErrorAlert message={handleApiError(logsQ.error)} onRetry={() => logsQ.refetch()} />
                    )}
                    {logsQ.isLoading && <Skeleton className="h-[160px]" />}
                    {logsQ.isSuccess && (
                      <table className="w-full text-[12.5px]">
                        <thead>
                          <tr className="text-left text-[10.5px] tracking-[0.1em] uppercase text-sub border-b border-line">
                            <th className="py-2 font-medium">Data/Hora</th>
                            <th className="py-2 font-medium">Usuário</th>
                            <th className="py-2 font-medium">Ação</th>
                            <th className="py-2 font-medium">Descrição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logsQ.data.map((l) => (
                            <tr key={l.id} className="border-b border-line/60 last:border-0">
                              <td className="py-2.5 tabular-nums text-text whitespace-nowrap">
                                {new Date(l.criadoEm).toLocaleString("pt-BR")}
                              </td>
                              <td className="py-2.5 text-text">{l.usuarioNome}</td>
                              <td className="py-2.5">
                                <span className="text-[11px] px-2 py-0.5 rounded bg-paper text-ink-900">
                                  {l.acao}
                                </span>
                              </td>
                              <td className="py-2.5 text-sub">{l.descricao ?? l.entidade}</td>
                            </tr>
                          ))}
                          {!logsQ.data.length && (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-sub text-[12.5px]">
                                Nenhuma atividade registrada ainda.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {tab === "plano" && (
            <div>
              <SettingsHeader title="Plano e Faturamento" hint="Assinatura e histórico de cobranças." />
              <div className="rounded-lg p-6 mb-5 text-white" style={{ background: "#0D1F2D" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-3"
                      style={{ background: "rgba(0,200,150,0.18)", color: "#00C896" }}
                    >
                      Plano Professional
                    </div>
                    <div className="flex items-center gap-6 text-[13px] text-white/80">
                      <span>
                        <span className="text-white font-medium">5</span> auditores
                      </span>
                      <span>
                        <span className="text-white font-medium">20</span> clientes ativos
                      </span>
                      <span>
                        Armazenamento <span className="text-white font-medium">50 GB</span>
                      </span>
                    </div>
                  </div>
                  <Btn kind="accent" size="sm">
                    Gerenciar Plano
                  </Btn>
                </div>
                <div className="border-t border-white/10 mt-5 pt-4 flex items-end justify-between">
                  <div>
                    <span className="font-display text-[32px]">R$ 490</span>
                    <span className="text-white/60 text-[14px]">/mês</span>
                  </div>
                  <div className="text-[12.5px] text-white/60">
                    Próxima cobrança: <span className="text-white tabular-nums">01/06/2025</span>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-line rounded-lg p-6">
                <div className="text-[11px] tracking-[0.16em] uppercase text-ink-900 font-semibold mb-3">
                  Histórico de faturas
                </div>
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-[10.5px] tracking-[0.1em] uppercase text-sub border-b border-line">
                      <th className="py-2 font-medium">Data</th>
                      <th className="py-2 font-medium">Valor</th>
                      <th className="py-2 font-medium">Status</th>
                      <th className="py-2 font-medium text-right">NF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["01/05/2025", "R$ 490,00"],
                      ["01/04/2025", "R$ 490,00"],
                      ["01/03/2025", "R$ 490,00"],
                      ["01/02/2025", "R$ 390,00"],
                    ].map((f, i) => (
                      <tr key={i} className="border-b border-line/60 last:border-0">
                        <td className="py-3 tabular-nums text-text">{f[0]}</td>
                        <td className="py-3 tabular-nums text-text">{f[1]}</td>
                        <td className="py-3">
                          <Badge kind="encerrado" size="sm">
                            Pago
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <button className="text-[12px] text-ink-900 hover:underline inline-flex items-center gap-1">
                            <I.download size={12} />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {inviteOpen && <InviteAuditorModal onClose={() => setInviteOpen(false)} />}
    </div>
  );
}
