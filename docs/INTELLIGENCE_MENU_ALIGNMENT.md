# Correção do Menu Inteligência

## Objetivo

Adequar o menu **Inteligência** para cumprir seu papel específico dentro da extensão: interpretar dados de revisão e transformar comentários, findings, histórico, Problems e testes em riscos, hotspots e recomendações.

## Ajustes implementados

### 1. Hotspots por arquivo

O menu agora identifica arquivos com maior concentração de:

- comentários públicos;
- findings automáticos;
- severidade alta/crítica;
- comentários ainda abertos.

Cada hotspot possui pontuação de risco e resumo de sinais.

### 2. Hotspots por módulo

Além de arquivos isolados, a inteligência consolida risco por módulo usando o início do caminho do arquivo.

Exemplo:

```text
src/application
src/domain
webview-ui/src
```

### 3. Correlação entre comentários e sinais técnicos

A tela agora cruza:

- comentários humanos;
- findings automáticos;
- comentários abertos;
- sinais altos/críticos.

Isso permite identificar arquivos onde existe discussão humana e evidência técnica no mesmo ponto.

### 4. Risco arquitetural

Foi adicionada análise interpretativa de risco, com mensagens como:

```text
Hotspot de arquivo: src/service/UserService.ts concentra comentários/findings com risco 13.
```

ou:

```text
Há correlação entre comentários abertos e sinais críticos/altos no mesmo arquivo.
```

### 5. Recomendações orientadas por dados

As recomendações agora consideram também:

- hotspots;
- correlações;
- recorrências;
- padrões detectados;
- findings críticos.

## Separação de responsabilidade

O menu Inteligência agora fica mais distante de Dashboard, Diagnósticos e Telemetria.

| Menu | Responsabilidade |
|---|---|
| Dashboard | Estado geral e score atual |
| Diagnósticos | Erros técnicos linha a linha |
| Telemetria | Métricas e eventos registrados |
| Inteligência | Interpretação, risco, hotspots e recomendações |

## Arquivos alterados

- `src/application/assistedIntelligence.ts`
- `webview-ui/src/main.jsx`
- `webview-ui/src/styles.css`
