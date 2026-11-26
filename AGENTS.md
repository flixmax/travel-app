# Controle de Viagens e Reembolsos — notas para quem for continuar o projeto

App PWA para um motorista controlar a folha de cada viagem, os gastos e o acerto com a empresa.
Todo o texto da interface é em português do Brasil.

## Estrutura

- `index.html`: o app inteiro (HTML + CSS + JS puro, sem framework nem build).
- `sw.js`: service worker (busca na rede primeiro; se a rede falhar ou demorar mais de 3 s, usa o cache).
- `manifest.json`, `icon-192.png`, `icon-512.png`: instalação como app no celular.
- `travel_app_prototype.html`: protótipo antigo com dados simulados. **Não é usado pelo app.**

## Publicação (importante)

- Publicado no GitHub Pages: https://flixmax.github.io/travel-app/ (branch `master`, pasta raiz).
- **Todo `git push` no `master` atualiza o app no celular do usuário**, em 1 ou 2 minutos.
- **Sempre que alterar arquivos do app, aumente a versão em `CACHE_NAME` no `sw.js`**
  (ex.: `viagens-app-v4` → `viagens-app-v5`). Sem isso, o celular pode continuar com a versão antiga.
- O repositório precisa continuar **público**: o Pages é gratuito só em repositório público.

## Dados (cuidado ao mudar)

- Os dados ficam no `localStorage` do aparelho, na chave `viagens_data` (e `viagens_daily_expenses` para gastos pessoais do dia a dia fora das viagens). Não há servidor nem sincronização.
- **O usuário já tem viagens reais salvas no celular.** Não renomeie a chave nem os campos sem
  migrar os dados antigos. Ao criar um campo novo, use um valor padrão para viagens antigas
  (veja o `trips.forEach(...)` logo depois do carregamento).

Formato de uma viagem:

```js
{
  id, destination, date,
  status: "Aguardando Acerto" | "Pago",
  advance,    // Adiantamento
  toll,       // Pedágio depositado
  busTicket,  // Passagem rodoviária depositada
  bonus,      // Bônus sem ocorrência
  remainder,  // Saldo
  freightNet, // Frete contratado líquido (para NFS-e)
  incomes:  [{ title, amount }],                                   // entradas extras (diárias, depósitos)
  expenses: [{ title, amount, type: "reimbursable" | "personal" }]
}
```

## Regras de negócio (definidas pelo usuário)

Todas estão na função `calcTrip()`.

- **Total Já Depositado** = Adiantamento + Pedágio + entradas extras (a passagem rodoviária já está inclusa no valor depositado, então não soma de novo).
- **Acerto a Receber** = Saldo + Bônus sem ocorrência + Gastos Reembolsáveis (exceto passagem rodoviária) + excedente da passagem rodoviária (`max(0, gastoComPassagem - busTicket)`) + excedente do pedágio (`max(0, gastoComPedagio - toll)`).
- **Total de Gastos** = gastos reembolsáveis + gastos pessoais + pedágio em pessoais (aparece abaixo dos gastos pessoais), com **Restante do Depositado** = `Total Já Depositado - Total de Gastos`. Pedágio não entra na soma de `Pessoais`.
- **Lucro Líquido da Viagem** = `Acerto a Receber + Restante do Depositado` (como os reembolsáveis já entram no Acerto a Receber, o lucro líquido soma por lá).
- O "Total Pendente" da tela inicial soma o acerto das viagens com status "Aguardando Acerto".
- **Passagem rodoviária é sempre reembolsável (paga pela empresa)**: o botão "Por minha conta" fica travado e reembolsa só o que passar do depositado. **Pedágio** pode ser colocado em "Por minha conta" (não soma em gastos pessoais e reembolsa no acerto só o que passar do depositado).
- Uber, táxi e hospedagem às vezes são pagos pela empresa e às vezes pelo motorista, então o app pede
  confirmação. Almoço, janta e café vêm sugeridos como pessoais.
- **Pedágio entra no acerto só pelo excedente**, seja marcado como Empresa ou Por minha conta
  (nunca soma inteiro nos reembolsáveis: isso contava o pedágio duas vezes até a v43).
- **Meu Mês:** Saldo Livre = Lucros das viagens pagas − Gastos do dia a dia. Os gastos pessoais das
  viagens já saem do lucro líquido, então aparecem só como linha informativa (cinza, sem "−"), e no
  resumo contam só as viagens pagas. A lista abaixo mostra todas as viagens do mês e marca as pendentes.

## Comportamento

- Voz (🎤): usa a Web Speech API (`pt-BR`). A frase **não é salva direto**: o app abre um formulário
  preenchido para o usuário confirmar. Frases com "recebi", "depositaram" ou "diária" viram **entrada**;
  as demais viram **gasto**. As regras de interpretação estão em `parseVoiceText()`.
- O microfone só funciona em HTTPS ou em `localhost`, então não funciona abrindo o arquivo direto.
- `tidyTitle()` padroniza as descrições: primeira letra maiúscula e acentos comuns ("diaria" → "Diária").
- Todo texto digitado pelo usuário passa por `escapeHtml()` antes de ir para `innerHTML`.
- Valores em reais (voz, OCR) passam por `parseBrNumber()`: "1.050" é mil e cinquenta, não 1,05.
- Datas continuam salvas como `dd/mm/aaaa`. Os campos usam `type="date"`; converta com
  `setDateInput()` / `getDateInput()` (e `brToIso` / `isoToBr`). A lista ordena pela data, mais nova primeiro.
- Leitura e gravação passam por `loadList()` / `saveList()`. Dados corrompidos não quebram o app:
  o texto original é guardado em `<chave>_corrompido_<timestamp>`.
- **Backup:** cartão "Backup dos dados" no fim do Meu Mês. Exportar gera um JSON
  `{ app, version, exportedAt, trips, dailyExpenses }` (compartilha pelo celular quando dá, ou baixa o arquivo).
  Importar substitui os dados e antes guarda os atuais em `<chave>_antes_import_<timestamp>`.

## Visual

- Tema escuro. **Todas as cores estão nas variáveis do `:root`** no começo do `<style>`. Não escreva
  cor solta no HTML nem no JS: use as classes `.amount.pos / .neg / .muted / .accent`, `.empty-line` etc.
- No celular (até 480px ou instalado) o app ocupa a tela inteira, sem a moldura de "celular" que
  aparece no computador. Respeita as áreas seguras (`env(safe-area-inset-*)`).
- Campos com 16px (abaixo disso o iPhone dá zoom) e alvos de toque com pelo menos 40–44px (`--tap`).
- Nas listas, os valores ficam alinhados à direita. As linhas sem botão "×" usam `.del-spacer`
  (32px) para ocupar o mesmo espaço do "×" (40px de área de toque com margem negativa de 8px).
- O usuário confere o resultado no celular e se incomoda com detalhes visuais fora do padrão.

## Git

- Branch `master`. Autor configurado: Fabio Santos.
- Faça commit e push só quando o usuário pedir, porque o push publica direto no celular dele.
