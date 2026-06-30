#Ai notes

## Como IA me ajudou
- Popular o banco (criou seeds)
- Criou todo boilerplait do projeto, configurações básicas, organização de pastas etc.
- Criar testes unitários

## O que você decidiu escrever à mão, e por quê.

## Qualquer artefato do seu fluxo de IA que faça parte de como você trabalha.
- Leio com atenção o que precisa ser feito, repasso esse contexto para a IA criando uma skill que possua essas regras de negócio e contexto.
- Adiciono skills especialistas de boas práticas de códigos das stacks envolvidas no projeto.
- Adiciono minhas regras em uma skill. Exemplo: não alterar nada o banco sem solicitar permissão, qualquer dúvida ou ambiguidade sempre pergunte, execute testes unitários para features com regras de negócios etc.

## Observações
- Colocar execução de testes unitários foi importante, mas foi crucial adicionar camada de testes em um banco totalmente isolado. Por mais que adicione 5 a 10 segundos para subir o container, acredito que é um preço que vale a pena pagar.

## Onde a IA errou e você corrigiu (e como percebeu).
- Na renderização da tabela, a paginação ficou horizontal criando uma barra de rolamento gingante e deixando a tabela espaçada acompanhando esse rodapé de paginação que ia do 1 até 251. Percebi ao abrir a tela. Após aguns comandos de ajuste o problema persistiu. 
Como era uma juste simples acabei fazendo na mão.
- Solicitei a IA que criasse um docker-compose para subir tudo com um só comando. Ela não errou nisso, porém a forma de subir estava independente e mais complexa. Então eu solicitei esse ajuste.