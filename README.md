# Obra em Ordem

Sua obra organizada. Seu dinheiro sob controle.

MVP inicial em Next.js, TypeScript e Supabase.

## Requisitos
- Node.js 20 ou superior
- Projeto Supabase

## Configuração
1. Instale dependências com `npm install`.
2. Copie `.env.example` para `.env.local`.
3. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os dados do seu projeto Supabase.
4. No Supabase, abra SQL Editor e execute `supabase/schema.sql`.
5. Inicie com `npm run dev` e acesse `http://localhost:3000`.

## Observações
Este é um MVP em desenvolvimento, não uma versão pronta para produção. Antes de usar dados reais, faça testes de segurança/RLS, autenticação, backups e privacidade. Não coloque chaves `service_role` no frontend.
