#Ai notes

## Como IA me ajudou
- Popular o banco (criou seeds)
- Criou todo boilerplait do projeto, configurações básicas, organização de pastas etc.
- Criar testes unitários

## O que você decidiu escrever à mão, e por quê.

**Query SQL de faturamento (`OrderService.GetBillingByPeriodAsync`)**
A IA gerou uma versão inicial com subquery desnecessária para calcular o total por pedido antes de agregar por dia. Reescrevi diretamente com `INNER JOIN` e `SUM(oi."Quantity" * oi."UnitPrice")` em uma única passagem — mais simples, mais legível e com um plano de execução melhor. A decisão de usar Dapper aqui (ao invés de LINQ com EF Core) também foi minha: query analítica com `GROUP BY` e agregação é mais clara e controlável em SQL explícito.

**Lógica de validação do pedido (`OrderService.Validate`)**
Escrevi manualmente os critérios de validação: nome do cliente obrigatório, pelo menos um item, quantidade > 0, preço > 0 e nome do produto obrigatório. A IA não errou nisso, mas preferi manter essa lógica sob controle — ela reflete regras de negócio que precisam ser legíveis e testáveis sem ambiguidade. Os testes unitários de `Validate` também foram ajustados manualmente para cobrir casos de borda como `null`, string vazia e espaços em branco.

**Correção da paginação do frontend**
Após a IA gerar uma paginação horizontal com todos os números de página enfileirados (criando barra de rolagem gigante em 251 páginas), reescrevi a função `getPaginationItems` manualmente: quebrando essa paginação em duas linhas. Solução direta que resolve o overflow sem biblioteca externa.

## Qualquer artefato do seu fluxo de IA que faça parte de como você trabalha.
- Leio com atenção o que precisa ser feito, repasso esse contexto para a IA criando uma skill que possua essas regras de negócio e contexto.
- Adiciono skills especialistas de boas práticas de códigos das stacks envolvidas no projeto.
- Adiciono minhas regras em uma skill. Exemplo: não alterar nada o banco sem solicitar permissão, qualquer dúvida ou ambiguidade sempre pergunte, execute testes unitários para features com regras de negócios etc.

## Observações
- Colocar execução de testes unitários foi importante, mas foi crucial adicionar camada de testes em um banco totalmente isolado. Por mais que adicione 5 a 10 segundos para subir o container, acredito que é um preço que vale a pena pagar.

## Onde a IA errou e você corrigiu (e como percebeu).
- Como disse acima, na renderização da tabela, a paginação ficou horizontal criando uma barra de rolamento gingante e deixando a tabela espaçada acompanhando esse rodapé de paginação que ia do 1 até 251. Percebi ao abrir a tela. Após aguns comandos de ajuste o problema persistiu. 
Como era um ajuste simples, acabei fazendo na mão.
- Solicitei a IA que criasse um docker-compose para subir tudo com um só comando. Ela não errou nisso também, porém a forma de subir estava independente e mais complexa navegando pasta a pasta e subindo os containers. Então eu solicitei esse ajuste para que tudo ficasse no docker compose, assim garanti a ordem correta de subir tudo e a praticidade executando apenas um comando.