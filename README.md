# 🍴 Forkable Recipes

Plataforma social de receitas estilo GitHub, onde usuários podem **forkar** receitas e criar suas próprias versões derivadas.

## 🎥 Vídeo de Demonstração

> **[INSERIR LINK DO YOUTUBE/DRIVE AQUI]**

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 18+
- npm

### Instalação

```bash
# 1. Clone o repositório
git clone <url-do-repo>
cd forkable-recipes

# 2. Instale as dependências
npm install

# 3. Configure o ambiente
cp .env.example .env

# 4. Crie o banco de dados e rode as migrações
npx prisma migrate dev --name init

# 5. Popule com dados de exemplo
node prisma/seed.js

# 6. Inicie o servidor
npm run dev
```

Acesse: http://localhost:3000

### Usuários de Teste
| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@forkable.com | admin123 |
| Chef A | maria@forkable.com | chef123 |
| Chef B | joao@forkable.com | chef456 |

## 🧠 Lógica de Fork

- Usuário A posta **Receita ID:10**
- Usuário B pode **Favoritar** (ManyToMany) ou **Forkar** a receita
- Ao forkar, cria-se **Receita ID:11** com `forkedFromId: 10`, pertencente ao Usuário B
- A interface exibe a linhagem: *"Versão de B, derivada da receita de A"*
- **Forks de forks** são suportados: C pode forkar a receita 11

## 🛠 Tecnologias

- **Backend:** Node.js + Express
- **ORM:** Prisma + SQLite
- **Frontend:** EJS (SSR) + CSS customizado
- **Auth:** express-session + bcryptjs

## 📦 Release

Tag: `v3.0.0-rec` — Entrega P3 - Recuperação Final