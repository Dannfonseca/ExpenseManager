# ExpenseManager - Frontend

Este é o frontend do **ExpenseManager**, uma aplicação completa para gerenciamento de finanças pessoais. Desenvolvido com as tecnologias mais modernas para garantir uma experiência de usuário rápida, responsiva e intuitiva.

## ✨ Funcionalidades

- **Dashboard Interativo:** Visão geral da saúde financeira com gráficos de despesas diárias, distribuição por categoria e previsões de gastos.
- **Gerenciamento de Transações:** Adicione, edite e remova receitas ou despesas com facilidade.
- **Modo Planilha:** Insira múltiplas transações de uma só vez de forma rápida e eficiente.
- **Transações Recorrentes:** Automatize o lançamento de contas fixas como salários, aluguéis e assinaturas.
- **Categorias e Tipos de Pagamento:** Personalize categorias de despesa e formas de pagamento para um controle detalhado.
- **Design Responsivo:** A aplicação se adapta perfeitamente a desktops, tablets e celulares.
- **Autenticação Segura:** Sistema de login e registro com proteção de rotas.
- **Painel de Administrador:** Gerenciamento de usuários e visualização de logs do sistema (para usuários com permissão de admin).

## 🚀 Tecnologias Utilizadas

- **React:** Biblioteca principal para a construção da interface.
- **Vite:** Ferramenta de build extremamente rápida para desenvolvimento frontend.
- **TypeScript:** Para um código mais seguro e manutenível.
- **Tailwind CSS:** Framework CSS para estilização rápida e customizável.
- **shadcn/ui:** Coleção de componentes de UI reusáveis e acessíveis.
- **Recharts:** Para a criação dos gráficos do dashboard.
- **React Router:** Para o gerenciamento de rotas da aplicação.
- **Zod:** Para validação de esquemas e formulários.

## ⚙️ Como Executar o Projeto Localmente

Siga os passos abaixo para configurar e rodar o ambiente de desenvolvimento do frontend.

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    ```

2.  **Navegue até o diretório do frontend:**
    ```bash
    cd ExpenseManager-main/frontend
    ```

3.  **Instale as dependências:**
    ```bash
    npm install
    ```

### Executando

1.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:8080` (ou outra porta, se a 8080 estiver em uso).

2.  **Proxy para o Backend:** O projeto está configurado para redirecionar as chamadas de API (`/api`) para `http://localhost:5000`. Certifique-se de que o servidor backend esteja rodando nesta porta.

## 📦 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento com hot-reloading.
- `npm run build`: Compila a aplicação para produção, gerando os arquivos estáticos no diretório `dist/`.
- `npm run lint`: Executa o linter para verificar a qualidade do código.
- `npm run preview`: Inicia um servidor local para visualizar a versão de produção (após executar `npm run build`).
