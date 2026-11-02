"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Building2, LayoutDashboard, Wallet, LogOut, Plus, HardHat, ReceiptText, Menu, X, ArrowUpRight, CircleDollarSign, FolderKanban } from "lucide-react";

type Profile = { id: string; company_id: string | null; full_name: string | null; role: string };
type Project = { id: string; name: string; client_name: string | null; address: string | null; budget: number; status: string; start_date: string | null; end_date: string | null };
type Expense = { id: string; project_id: string; description: string; amount: number; expense_date: string; category: string | null };
const money = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n || 0));

export default function Home() {
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [view, setView] = useState<"dashboard" | "projects" | "finance">("dashboard");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); const [companyName, setCompanyName] = useState("");
  const [register, setRegister] = useState(false);
  const [projectForm, setProjectForm] = useState(false); const [expenseForm, setExpenseForm] = useState(false);
  const [pName, setPName] = useState(""); const [pClient, setPClient] = useState(""); const [pBudget, setPBudget] = useState(""); const [pAddress, setPAddress] = useState("");
  const [eProject, setEProject] = useState(""); const [eDescription, setEDescription] = useState(""); const [eAmount, setEAmount] = useState(""); const [eCategory, setECategory] = useState("Materiais");
  const [eDate, setEDate] = useState(new Date().toISOString().slice(0,10)); const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => { setSession(s); if (!s) { setProfile(null); setProjects([]); setExpenses([]); setLoading(false); } });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);
  useEffect(() => { if (session?.user) loadData(); }, [session]);

  async function loadData() {
    setLoading(true); setNotice("");
    const { data: prof, error: pErr } = await supabase.from("profiles").select("id,company_id,full_name,role").eq("id", session.user.id).single();
    if (pErr) { setNotice("Não foi possível carregar seu perfil. Confira se executou o SQL de instalação."); setLoading(false); return; }
    setProfile(prof);
    const [{ data: ps, error: psErr }, { data: es, error: esErr }] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("expense_date", { ascending: false })
    ]);
    if (psErr || esErr) setNotice("Erro ao carregar dados. Verifique as políticas e tabelas do banco.");
    setProjects(ps || []); setExpenses(es || []); setLoading(false);
  }
  async function signIn(e: React.FormEvent) { e.preventDefault(); setNotice("Entrando..."); const { error } = await supabase.auth.signInWithPassword({ email, password }); setNotice(error ? error.message : ""); }
  async function signUp(e: React.FormEvent) {
    e.preventDefault(); setNotice("Criando conta...");
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, company_name: companyName } } });
    if (error) setNotice(error.message); else if (data.session) setNotice("Conta criada! Carregando seu ambiente..."); else setNotice("Conta criada. Confirme seu e-mail e depois entre no sistema.");
  }
  async function addProject(e: React.FormEvent) {
    e.preventDefault(); if (!pName.trim() || Number(pBudget) < 0) return;
    const { error } = await supabase.from("projects").insert({ name: pName, client_name: pClient || null, budget: Number(pBudget || 0), address: pAddress || null, status: "em_andamento" });
    if (error) setNotice(error.message); else { setProjectForm(false); setPName(""); setPClient(""); setPBudget(""); setPAddress(""); await loadData(); }
  }
  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("expenses").insert({ project_id: eProject, description: eDescription, amount: Number(eAmount), category: eCategory, expense_date: eDate });
    if (error) setNotice(error.message); else { setExpenseForm(false); setEDescription(""); setEAmount(""); await loadData(); }
  }
  async function signOut() { await supabase.auth.signOut(); }
  const totalBudget = useMemo(() => projects.reduce((s,p) => s + Number(p.budget), 0), [projects]);
  const totalSpent = useMemo(() => expenses.reduce((s,e) => s + Number(e.amount), 0), [expenses]);
  const spentByProject = (id: string) => expenses.filter(e => e.project_id === id).reduce((s,e) => s + Number(e.amount), 0);

  if (loading && session) return <main className="center"><div className="loader" /><p>Carregando Obra em Ordem...</p></main>;
  if (!session) return <main className="auth-shell"><section className="auth-card">
    <div className="brand-mark"><Building2 size={26}/></div><div className="eyebrow">GESTÃO DA CONSTRUÇÃO CIVIL</div>
    <h1>Obra em <span>Ordem.</span></h1><p className="muted">Sua obra organizada. Seu dinheiro sob controle.</p>
    <form onSubmit={register ? signUp : signIn} className="form-stack">
      {register && <><label>Seu nome<input required value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Nome completo"/></label><label>Nome da empresa ou seu nome<input required value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="Ex.: Construtora Silva"/></label></>}
      <label>E-mail<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@empresa.com"/></label>
      <label>Senha<input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres"/></label>
      <button className="primary full" type="submit">{register ? "Criar minha conta" : "Entrar"}</button>
    </form>
    <button className="text-button" onClick={()=>{setRegister(!register);setNotice("");}}>{register ? "Já tenho conta — entrar" : "Primeiro acesso? Criar empresa"}</button>
    {notice && <div className="notice">{notice}</div>}<p className="tiny">Ambiente demonstrativo. Configure o Supabase antes do primeiro acesso.</p>
  </section></main>;

  return <main className="app-shell">
    <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
      <div className="side-brand"><div className="brand-mark small"><Building2 size={20}/></div><div><b>Obra em Ordem</b><small>GESTÃO DE OBRAS</small></div><button className="close-menu" onClick={()=>setMobileMenu(false)}><X/></button></div>
      <div className="company-chip"><HardHat size={16}/><span>{session.user.user_metadata?.company_name || "Minha empresa"}</span></div>
      <nav>
        <button className={view==="dashboard"?"active":""} onClick={()=>{setView("dashboard");setMobileMenu(false)}}><LayoutDashboard/> Visão geral</button>
        <button className={view==="projects"?"active":""} onClick={()=>{setView("projects");setMobileMenu(false)}}><FolderKanban/> Minhas obras</button>
        <button className={view==="finance"?"active":""} onClick={()=>{setView("finance");setMobileMenu(false)}}><Wallet/> Financeiro</button>
      </nav>
      <div className="side-bottom"><div className="user-info"><div className="avatar">{(profile?.full_name || session.user.email || "U").slice(0,1).toUpperCase()}</div><div><b>{profile?.full_name || "Usuário"}</b><small>{session.user.email}</small></div></div><button className="logout" onClick={signOut}><LogOut size={17}/> Sair</button></div>
    </aside>
    {mobileMenu && <button className="scrim" onClick={()=>setMobileMenu(false)} aria-label="Fechar menu"/>}
    <section className="main-area">
      <header className="topbar"><button className="menu-button" onClick={()=>setMobileMenu(true)}><Menu/></button><div><span className="eyebrow">PAINEL DE CONTROLE</span><h2>{view==="dashboard"?"Visão geral":view==="projects"?"Minhas obras":"Financeiro"}</h2></div><div className="top-user">{profile?.full_name || session.user.email}</div></header>
      <div className="content">
        {notice && <div className="notice">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
        {view==="dashboard" && <>
          <div className="welcome-row"><div><h1>Olá, {profile?.full_name?.split(" ")[0] || "bem-vindo"} 👋</h1><p className="muted">Aqui está o resumo da sua operação.</p></div><button className="primary" onClick={()=>setProjectForm(true)}><Plus size={17}/> Nova obra</button></div>
          <div className="stats-grid">
            <Stat icon={<Building2/>} label="Obras cadastradas" value={String(projects.length)} hint="Total no seu ambiente"/>
            <Stat icon={<CircleDollarSign/>} label="Orçamento total" value={money(totalBudget)} hint="Soma dos orçamentos"/>
            <Stat icon={<ReceiptText/>} label="Despesas lançadas" value={money(totalSpent)} hint={`${expenses.length} lançamentos`}/>
            <Stat icon={<Wallet/>} label="Saldo orçamentário" value={money(totalBudget-totalSpent)} hint="Orçado menos despesas"/>
          </div>
          <div className="section-heading"><div><h3>Obras recentes</h3><p className="muted">Acompanhe o orçamento e as despesas por obra.</p></div><button className="link-button" onClick={()=>setView("projects")}>Ver todas <ArrowUpRight size={15}/></button></div>
          <ProjectList projects={projects.slice(0,4)} spentByProject={spentByProject} money={money}/>
        </>}
        {view==="projects" && <><div className="welcome-row"><div><h1>Minhas obras</h1><p className="muted">Cadastre e acompanhe cada empreendimento.</p></div><button className="primary" onClick={()=>setProjectForm(true)}><Plus size={17}/> Nova obra</button></div><ProjectList projects={projects} spentByProject={spentByProject} money={money}/></>}
        {view==="finance" && <>
          <div className="welcome-row"><div><h1>Financeiro</h1><p className="muted">Registre despesas vinculadas a cada obra.</p></div><button className="primary" disabled={!projects.length} onClick={()=>{setEProject(projects[0]?.id || "");setExpenseForm(true)}}><Plus size={17}/> Nova despesa</button></div>
          <div className="stats-grid two"><Stat icon={<Wallet/>} label="Total de despesas" value={money(totalSpent)} hint="Despesas cadastradas"/><Stat icon={<CircleDollarSign/>} label="Saldo orçamentário" value={money(totalBudget-totalSpent)} hint="Orçamento menos despesas"/></div>
          <div className="table-card"><div className="table-title">Últimas despesas</div>{expenses.length===0?<Empty text="Nenhuma despesa cadastrada."/>:<div className="table-wrap"><table><thead><tr><th>Descrição</th><th>Obra</th><th>Categoria</th><th>Data</th><th>Valor</th></tr></thead><tbody>{expenses.map(x=><tr key={x.id}><td>{x.description}</td><td>{projects.find(p=>p.id===x.project_id)?.name || "—"}</td><td>{x.category || "—"}</td><td>{new Date(x.expense_date+"T12:00:00").toLocaleDateString("pt-BR")}</td><td className="amount">{money(x.amount)}</td></tr>)}</tbody></table></div>}</div>
        </>}
      </div>
    </section>
    {projectForm && <Modal title="Cadastrar nova obra" close={()=>setProjectForm(false)}><form onSubmit={addProject} className="form-stack"><label>Nome da obra<input required value={pName} onChange={e=>setPName(e.target.value)} placeholder="Ex.: Residência Jardim das Flores"/></label><label>Cliente / proprietário<input value={pClient} onChange={e=>setPClient(e.target.value)} placeholder="Nome do cliente"/></label><label>Endereço<input value={pAddress} onChange={e=>setPAddress(e.target.value)} placeholder="Endereço da obra"/></label><label>Orçamento previsto (R$)<input required type="number" min="0" step="0.01" value={pBudget} onChange={e=>setPBudget(e.target.value)} placeholder="250000"/></label><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setProjectForm(false)}>Cancelar</button><button className="primary">Salvar obra</button></div></form></Modal>}
    {expenseForm && <Modal title="Registrar despesa" close={()=>setExpenseForm(false)}><form onSubmit={addExpense} className="form-stack"><label>Obra<select required value={eProject} onChange={e=>setEProject(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Descrição<input required value={eDescription} onChange={e=>setEDescription(e.target.value)} placeholder="Ex.: Compra de cimento"/></label><label>Categoria<select value={eCategory} onChange={e=>setECategory(e.target.value)}>{["Materiais","Mão de obra","Equipamentos","Serviços","Transporte","Outros"].map(x=><option key={x}>{x}</option>)}</select></label><label>Data<input required type="date" value={eDate} onChange={e=>setEDate(e.target.value)}/></label><label>Valor (R$)<input required type="number" min="0.01" step="0.01" value={eAmount} onChange={e=>setEAmount(e.target.value)} placeholder="1500"/></label><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setExpenseForm(false)}>Cancelar</button><button className="primary">Salvar despesa</button></div></form></Modal>}
  </main>;
}
function Stat({icon,label,value,hint}:{icon:React.ReactNode;label:string;value:string;hint:string}) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><i>{icon}</i></div><strong>{value}</strong><small>{hint}</small></div>; }
function Empty({text}:{text:string}) { return <div className="empty"><FolderKanban size={25}/><p>{text}</p></div>; }
function ProjectList({projects,spentByProject,money}:{projects:Project[];spentByProject:(id:string)=>number;money:(n:number)=>string}) {
  if(!projects.length) return <Empty text="Você ainda não cadastrou obras. Clique em “Nova obra” para começar."/>;
  return <div className="project-grid">{projects.map(p=>{const spent=spentByProject(p.id);const budget=Number(p.budget);const pct=budget>0?Math.min(100,spent/budget*100):0;return <article className="project-card" key={p.id}><div className="project-card-head"><div className="project-icon"><Building2/></div><span className="status">{p.status==="em_andamento"?"Em andamento":p.status}</span></div><h3>{p.name}</h3><p className="muted">{p.client_name || "Cliente não informado"}</p><div className="progress-label"><span>Orçamento consumido</span><b>{pct.toFixed(1)}%</b></div><div className="progress"><span style={{width:`${pct}%`}}/></div><div className="project-values"><div><small>Gasto</small><b>{money(spent)}</b></div><div><small>Orçamento</small><b>{money(budget)}</b></div></div></article>})}</div>;
}
function Modal({title,close,children}:{title:string;close:()=>void;children:React.ReactNode}) { return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="modal"><div className="modal-head"><h3>{title}</h3><button onClick={close}><X/></button></div>{children}</div></div>; }
