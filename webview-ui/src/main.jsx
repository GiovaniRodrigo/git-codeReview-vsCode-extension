import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileDown,
  GitPullRequest,
  Home,
  Info,
  MessageSquare,
  MoreVertical,
  Play,
  RefreshCw,
  Settings,
  Shield,
  Wrench,
  XCircle
} from 'lucide-react';
import './styles.css';

const colors = {
  purple: '#7c4dff',
  green: '#4ade80',
  red: '#ff5c66',
  yellow: '#fbbf24',
  blue: '#3b82f6'
};

function ReviewLeftbar({ view, setView }) {
  const nav = [
    ['dashboard', Home, 'Dashboard', '82'],
    ['analysis', AlertTriangle, 'Diagnósticos', '25'],
    ['conformities', CheckCircle2, 'Conformidades', '68'],
    ['telemetry', BarChart3, 'Telemetria', '94%'],
    ['history', Clock3, 'Histórico', '12'],
    ['settings', Settings, 'Configurações', '']
  ];

  return (
    <aside className="leftbar">
      <div className="brand">
        <div className="brand-icon"><Shield size={22} /></div>
        <div>
          <strong>Code Review</strong>
          <span>Governança arquitetural</span>
        </div>
      </div>

      <section className="review-state">
        <span>Revisão atual</span>
        <strong>PR #42 · Em análise</strong>
        <div className="progress"><i style={{ width: '82%' }} /></div>
      </section>

      <nav className="nav-list">
        {nav.map(([key, Icon, label, badge]) => (
          <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>
            <Icon size={18} />
            <span>{label}</span>
            {badge && <b>{badge}</b>}
          </button>
        ))}
      </nav>

      <section className="rule-groups">
        <h4>Categorias</h4>
        <RuleItem color="red" label="SOLID" count="3" />
        <RuleItem color="red" label="Clean Architecture" count="4" />
        <RuleItem color="yellow" label="DDD" count="2" />
        <RuleItem color="blue" label="Performance" count="1" />
        <RuleItem color="green" label="Testes" count="18" />
      </section>
    </aside>
  );
}

function RuleItem({ color, label, count }) {
  return (
    <div className="rule-item">
      <span className={color}>●</span>
      <p>{label}</p>
      <b>{count}</b>
    </div>
  );
}

function ReviewCenter({ view }) {
  if (view === 'telemetry') return <TelemetryCenter />;
  if (view === 'history') return <HistoryCenter />;
  if (view === 'settings') return <SettingsCenter />;
  if (view === 'conformities') return <ConformitiesCenter />;

  return (
    <main className="center-panel">
      <header className="center-header">
        <div>
          <span className="eyebrow">Análise da revisão</span>
          <h1>{view === 'dashboard' ? 'Dashboard de qualidade' : 'Diagnósticos encontrados'}</h1>
          <p>Resumo da revisão sem recriar Explorer, editor, tabs ou statusbar do VS Code.</p>
        </div>
        <div className="header-actions">
          <button><RefreshCw size={16} /> Atualizar</button>
          <button className="primary"><Play size={16} /> Executar revisão</button>
        </div>
      </header>

      <section className="summary-grid">
        <SummaryCard title="Score" value="82/100" label="Muito bom" color="green" />
        <SummaryCard title="Violações" value="25" label="-12 desde última revisão" color="red" />
        <SummaryCard title="Conformidades" value="68" label="+12 novas regras OK" color="green" />
        <SummaryCard title="Cobertura" value="94%" label="regras avaliadas" color="blue" />
      </section>

      <section className="review-workspace">
        <div className="workspace-main">
          <h2>Arquivos e achados da revisão</h2>
          <p className="muted">Use o editor real do VS Code para abrir o arquivo, diff e comentários. Esta área mostra apenas o resumo navegável.</p>
          <FindingsTable />
        </div>

        <aside className="workspace-side">
          <h3>Fluxo reviewer/developer</h3>
          <Timeline />
        </aside>
      </section>

      <section className="insight-grid">
        <InsightCard title="Inversão de Dependência" severity="Crítico" text="A camada de aplicação depende de repositório concreto. Abrir UserService.ts linha 11." />
        <InsightCard title="Muitas Responsabilidades" severity="Aviso" text="Método getUserById agrega busca, cálculo e montagem de DTO." />
        <InsightCard title="Tratamento de Erro" severity="Erro" text="Erro genérico usado em fluxo de domínio. Padronizar Result/Error." />
      </section>
    </main>
  );
}

function SummaryCard({ title, value, label, color }) {
  return (
    <div className="summary-card">
      <span>{title}</span>
      <strong className={color}>{value}</strong>
      <p>{label}</p>
    </div>
  );
}

function FindingsTable() {
  const rows = [
    ['Crítico', 'SOLID/DIP', 'UserService.ts', '11', 'Ajuste obrigatório'],
    ['Aviso', 'SRP', 'UserService.ts', '16', 'Separar responsabilidades'],
    ['Erro', 'Error Handling', 'UserService.ts', '24', 'Padronizar retorno'],
    ['Sugestão', 'Performance', 'UserRepository.ts', '38', 'Otimizar consulta'],
    ['Conforme', 'Clean Architecture', 'AuthController.ts', '8', 'Sem ação']
  ];

  return (
    <table className="findings-table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Regra</th>
          <th>Arquivo</th>
          <th>Linha</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.join('-')}>
            <td><Severity label={row[0]} /></td>
            <td>{row[1]}</td>
            <td>{row[2]}</td>
            <td>{row[3]}</td>
            <td>{row[4]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Severity({ label }) {
  const map = {
    Crítico: 'critical',
    Aviso: 'warning',
    Erro: 'error',
    Sugestão: 'info',
    Conforme: 'success'
  };
  return <span className={`severity ${map[label]}`}>{label}</span>;
}

function InsightCard({ title, severity, text }) {
  return (
    <article className="insight-card">
      <div>
        <Severity label={severity === 'Crítico' ? 'Crítico' : severity === 'Erro' ? 'Erro' : 'Aviso'} />
        <MoreVertical size={18} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      <button>Abrir no editor real do VS Code</button>
    </article>
  );
}

function Timeline() {
  const steps = [
    ['PR criada', 'feature/auth-refactor'],
    ['Review executada', '25 violações encontradas'],
    ['Comentários gerados', '3 críticos, 7 avisos'],
    ['Aguardando correção', 'Responsável: Developer'],
    ['Revalidação pendente', 'Após novos commits']
  ];

  return <div className="timeline">{steps.map(([title, text]) => <div key={title}><b>{title}</b><p>{text}</p></div>)}</div>;
}

function Rightbar() {
  return (
    <aside className="rightbar">
      <header>
        <span>Revisão atual</span>
        <div><RefreshCw size={17} /><MoreVertical size={17} /></div>
      </header>

      <section className="quality-card">
        <h4>Score de Qualidade</h4>
        <Ring />
        <strong>Muito Bom</strong>
      </section>

      <section className="kpi-stack">
        <Metric title="Conformidades" value="68" color="green" />
        <Metric title="Violações" value="25" color="red" />
        <Metric title="Cobertura de Regras" value="94%" color="green" bar />
      </section>

      <section>
        <h3>Principais problemas <a>Ver todos</a></h3>
        <Issue icon={<XCircle size={17} />} title="Inversão de Dependência" text="UserService.ts:11" label="Crítico" />
        <Issue icon={<AlertTriangle size={17} />} title="Muitas Responsabilidades" text="UserService.ts:16" label="Aviso" />
        <Issue icon={<Info size={17} />} title="Tratamento de Erro" text="UserService.ts:24" label="Erro" />
      </section>

      <section>
        <h3>Ações rápidas</h3>
        <div className="actions">
          <button><Play size={18} />Executar</button>
          <button><Wrench size={18} />Corrigir</button>
          <button><FileDown size={18} />Relatório</button>
          <button><MessageSquare size={18} />Comentar</button>
        </div>
      </section>

      <section className="telemetry-card">
        <h3>Telemetria <a>Ver dashboard</a></h3>
        <div className="telemetry-chart"><div className="donut" /><span>⌁⌁⌁⌁⌁</span></div>
      </section>
    </aside>
  );
}

function Ring() {
  return (
    <div className="ring" style={{ background: `conic-gradient(${colors.green} 0 45%, ${colors.yellow} 45% 76%, ${colors.red} 76% 82%, #253044 82% 100%)` }}>
      <div><b>82</b><small>/100</small></div>
    </div>
  );
}

function Metric({ title, value, color, bar }) {
  return (
    <div className="metric">
      <p>{title}</p>
      <strong className={color}>{value}</strong>
      {bar ? <div className="bar"><i /></div> : <small>↗ 12</small>}
    </div>
  );
}

function Issue({ icon, title, text, label }) {
  return (
    <div className="issue">
      <span>{icon}</span>
      <div><b>{title}</b><p>{text}</p></div>
      <Severity label={label === 'Crítico' ? 'Crítico' : label === 'Erro' ? 'Erro' : 'Aviso'} />
    </div>
  );
}

function TelemetryCenter() {
  return <SimpleCenter title="Telemetria de engenharia" subtitle="Reincidências, regras mais violadas, tempo médio de correção e evolução por PR." />;
}
function HistoryCenter() {
  return <SimpleCenter title="Histórico de revisões" subtitle="Linha do tempo de reviews, correções, revalidações e decisões de aprovação." />;
}
function SettingsCenter() {
  return <SimpleCenter title="Configurações de regras" subtitle="Perfis de arquitetura, severidades, exclusões e padrões obrigatórios por projeto." />;
}
function ConformitiesCenter() {
  return <SimpleCenter title="Conformidades detectadas" subtitle="Lista de boas práticas atendidas pelo projeto e evidências de aderência arquitetural." />;
}
function SimpleCenter({ title, subtitle }) {
  return (
    <main className="center-panel simple">
      <header className="center-header">
        <div><span className="eyebrow">Code Review</span><h1>{title}</h1><p>{subtitle}</p></div>
      </header>
      <section className="summary-grid">
        <SummaryCard title="Itens" value="68" label="mapeados" color="green" />
        <SummaryCard title="Pendências" value="12" label="aguardando ação" color="yellow" />
        <SummaryCard title="Críticos" value="3" label="bloqueantes" color="red" />
        <SummaryCard title="Evolução" value="+18%" label="últimos 7 dias" color="blue" />
      </section>
      <FindingsTable />
    </main>
  );
}

function App() {
  const initialView = document.body?.dataset?.initialView || 'dashboard';
  const [view, setView] = useState(initialView);

  return (
    <div className="app-shell">
      <ReviewLeftbar view={view} setView={setView} />
      <ReviewCenter view={view} />
      <Rightbar />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
