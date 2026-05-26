# Nossa Pelada

MVP Expo SDK 56 com Expo Router, TypeScript, Supabase, Zustand, React Query Persist, AsyncStorage e NativeWind v4.

## Rodar

```bash
npm install
npx expo start
```

## Cache e economia Supabase

- React Query persiste em AsyncStorage.
- `staleTime`: 12 horas.
- `gcTime`: 24 horas.
- As telas renderizam cache local primeiro e revalidam em background.
- Sem realtime subscriptions, polling ou `select *`.
- Histórico paginado em 20 itens.
- Imagens de jogadores usam cache `memory-disk`.
- Upload de foto comprime para largura máxima de 500px com qualidade 0.7.

## Supabase

O SQL completo está em `supabase/schema.sql`.

Observação: o valor informado em `EXPO_PUBLIC_SUPABASE_URL` não tem formato de URL `https://*.supabase.co`. O app não quebra com isso, mas login, leitura remota e upload só funcionarão quando a URL real do projeto for configurada no `.env`.
