# ELEVA — Captação de Leads

Sistema mobile para captar leads em feiras, congressos e ações comerciais. O cadastro fica no aparelho se a internet cair e sincroniza com o Supabase quando a conexão volta.

## O que já funciona sem contas

- Telas, máscaras, validações, painel e fila offline
- Geração de Excel e PDF, assim que o Supabase estiver ligado
- Botão de e-mail, que avisa o que falta até o Resend ser configurado

## 1. Instalar e abrir

```bash
npm install
npm run dev
```

No celular, na mesma rede Wi-Fi:

```bash
npm run dev:lan
```

Abra `http://IP-DO-COMPUTADOR:3000`.

## 2. Ligar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, cole e execute [supabase/migrations/001_init.sql](supabase/migrations/001_init.sql).
3. Em **Authentication → Providers → Email**, desative **Confirm email**. Assim a equipe entra na hora.
4. Em **Authentication → Users**, crie um único usuário com e-mail e senha da equipe.
5. Em **Project Settings → API**, copie a URL e a chave `anon` `public`.
6. Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

7. Reinicie o servidor e entre com o usuário da equipe.

Recomendado para evento: em **Authentication → Sessions**, aumente o tempo do JWT para 24 horas, para o celular não pedir senha no meio da feira.

## 3. E-mail (quando quiser)

1. Crie uma conta no [Resend](https://resend.com) e verifique o domínio de envio.
2. No `.env.local`:

```
RESEND_API_KEY=
RESEND_FROM=ELEVA <captacao@seudominio.com.br>
```

Sem essas chaves, Excel e PDF continuam baixando. O envio só avisa que ainda não está ativo.

## Uso no evento

1. Entrar uma vez no celular. A sessão permanece.
2. Cadastrar ou selecionar o evento. Os próximos leads já nascem nele.
3. **Novo lead**, preencher e **Salvar lead**.
4. **+ Cadastrar próximo lead**.
5. No fim: **Encerrar evento**, gerar Excel, PDF ou enviar por e-mail.

Se aparecer **Aguardando sincronização**, o cadastro está no aparelho e sobe sozinho quando a rede voltar. O registro local só sai da fila depois que o servidor confirma.

## Backup

O banco fica no Supabase, não só no navegador. No painel do Supabase, ative os backups do projeto. No fim de cada evento, gere o Excel: ele é a cópia operacional dos leads daquele dia.

## Publicar

O app pode ir para a Vercel com as mesmas variáveis de ambiente. No celular, use **Adicionar à tela inicial** para abrir como aplicativo.
