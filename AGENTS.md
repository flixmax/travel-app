# Controle de Viagens e Reembolsos — notas para quem for continuar o projeto

App PWA para um motorista controlar a folha de cada viagem, os gastos e o acerto com a empresa.
Todo o texto da interface é em português do Brasil.

## Estrutura

- `index.html`: o app inteiro (HTML + CSS + JS puro, sem framework nem build).
- `sw.js`: service worker (busca na rede primeiro e usa o cache só quando está offline).
- `manifest.json`, `icon-192.png`, `icon-512.png`: instalação como app no celular.
- `travel_app_prototype.html`: protótipo antigo com dados simulados. **Não é usado pelo app.**

## Publicação (importante)

- Publicado no GitHub Pages: https://flixmax.github.io/travel-app/ (branch `master`, pasta raiz).
- **Todo `git push` no `master` atualiza o app no celular do usuário**, em 1 ou 2 minutos.
- **Sempre que alterar arquivos do app, aumente a versão em `CACHE_NAME` no `sw.js`**
  (ex.: `viagens-app-v4` → `viagens-app-v5`). Sem isso, o celular pode continuar com a versão antiga.
- O repositório precisa continuar **público**: o Pages é gratuito só em repositório público.

## Dados (cuidado ao mudar)

- Os dados ficam no `localStorage` do aparelho, na chave `viagens_data`. Não há servidor nem sincronização.
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
  incomes:  [{ title, amount }],                                   // entradas extras (diárias, depósitos)
  expenses: [{ title, amount, type: "reimbursable" | "personal" }]
}
```

## Regras de negócio (definidas pelo usuário)

Todas estão na função `calcTrip()`.

- **Total Já Depositado** = Adiantamento + Pedágio + entradas extras (a passagem rodoviária já está inclusa no valor depositado, então não soma de novo).
- **Acerto a Receber** = Saldo + Bônus sem ocorrência + excedente da passagem rodoviária (`max(0, gastoComPassagem - busTicket)`). Os demais gastos **não** entram nessa conta.
- **Total de Gastos** = gastos reembolsáveis + gastos pessoais (aparece abaixo dos gastos pessoais), com **Restante do Depositado** = `Total Já Depositado - Total de Gastos`.
- **Lucro Líquido da Viagem** = `Acerto a Receber + Restante do Depositado + Gastos Reembolsáveis` (exibido logo abaixo de Acerto a Receber e no card da tela inicial).
- O "Total Pendente" da tela inicial soma o acerto das viagens com status "Aguardando Acerto".
- **Pedágio e Passagem rodoviária são sempre reembolsáveis (pagos pela empresa)**: o botão "Por minha conta" fica travado. Na passagem rodoviária, a empresa só reembolsa no acerto o que passar do valor depositado.
- Uber, táxi e hospedagem às vezes são pagos pela empresa e às vezes pelo motorista, então o app pede
  confirmação. Almoço, janta e café vêm sugeridos como pessoais.
- **Pergunta em aberto:** como o acerto ficou só Saldo + Bônus, os gastos reembolsáveis não afetam o
  valor do acerto. Ainda não foi confirmado com o usuário se a empresa devolve esses gastos no acerto.

## Comportamento

- Voz (🎤): usa a Web Speech API (`pt-BR`). A frase **não é salva direto**: o app abre um formulário
  preenchido para o usuário confirmar. Frases com "recebi", "depositaram" ou "diária" viram **entrada**;
  as demais viram **gasto**. As regras de interpretação estão em `parseVoiceText()`.
- O microfone só funciona em HTTPS ou em `localhost`, então não funciona abrindo o arquivo direto.
- `tidyTitle()` padroniza as descrições: primeira letra maiúscula e acentos comuns ("diaria" → "Diária").
- Todo texto digitado pelo usuário passa por `escapeHtml()` antes de ir para `innerHTML`.

## Visual

- Layout de celular (máximo de 400px), com cores roxo/azul (`#4f46e5` → `#3b82f6`).
- Nas listas, os valores ficam alinhados à direita. As linhas sem botão "×" usam `.del-spacer`
  para ocupar o mesmo espaço do "×".
- O usuário confere o resultado no celular e se incomoda com detalhes visuais fora do padrão.

## Git

- Branch `master`. Autor configurado: Fabio Santos.
- Faça commit e push só quando o usuário pedir, porque o push publica direto no celular dele.
