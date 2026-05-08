# Paradigmas de Programação e Design Patterns

Este documento descreve os paradigmas e padrões de projeto aplicados no **Code Review Extension** para garantir manutenibilidade, extensibilidade e clareza do código.

## 1. SOLID Principles

### Open-Closed Principle (OCP)
O sistema de provedores remotos foi desenhado para ser aberto a extensões mas fechado para modificações.
- **Implementação**: A interface `RemoteProvider` define o contrato. Novos provedores (ex: Bitbucket) podem ser adicionados criando uma nova classe que implementa esta interface, sem alterar a `BranchTreeProvider` ou os comandos principais.

### Dependency Inversion Principle (DIP)
Módulos de alto nível não dependem de módulos de baixo nível, mas de abstrações.
- **Implementação**: `BranchTreeProvider` e `extension.ts` dependem da interface `RemoteProvider`, e não diretamente das classes `GitHubService` ou `GitLabService`.

## 2. Design Patterns

### Strategy Pattern
Utilizado para unificar o comportamento de diferentes hosts de código (GitHub, GitLab).
- **Onde**: Localizado em `src/remote/`. Cada provedor encapsula sua própria lógica de API, mas expõe os mesmos métodos para a aplicação.

### Registry Pattern
Gerencia a coleção de provedores disponíveis e ativos.
- **Onde**: `ProviderRegistry` em `src/remote/providerRegistry.ts`. Centraliza a detecção de remotes e o acesso aos provedores registrados.

### Command Pattern (Em transição)
O objetivo é mover a lógica de cada comando registrado no VS Code para classes ou serviços específicos, reduzindo a complexidade do `extension.ts`.

## 3. DRY (Don't Repeat Yourself)

### ConfigService
Centralização de acesso às configurações do VS Code.
- **Implementação**: `src/utils/config.ts`. Evita a repetição de `vscode.workspace.getConfiguration("codeReview")` e o uso de strings mágicas espalhadas pelo código.

## 4. Clean Code

### Funções Pequenas e Especializadas
Refatoração constante para evitar funções "deus" e arquivos gigantes (bloated).
- **Exemplo**: A refatoração do `extension.ts` para usar métodos auxiliares de submissão de review unificados.

### Nomenclatura Semântica
Uso de nomes descritivos para classes, métodos e variáveis que revelem a intenção do código.
- **Exemplo**: `CodeReviewSummary` em vez de tipos genéricos, facilitando o entendimento do fluxo de dados entre provedores e UI.

## 5. Próximos Passos (Melhorias Arquiteturais)

- **Observer Pattern**: Implementar um barramento de eventos para notificar mudanças de estado (ex: arquivo revisado) entre diferentes componentes da UI (TreeView e Webview).
- **Service Locator/Injeção de Dependência**: Refinar como os serviços são instanciados e compartilhados para facilitar testes unitários.
