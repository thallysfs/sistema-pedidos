import amqp from 'amqplib';
import chalk from 'chalk';

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
const QUEUE_NAME = 'orders.created';
const EXCHANGE_NAME = 'orders';
const ROUTING_KEY = 'order.created';
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 3000;

const IS_TTY = process.stdout.isTTY === true;
const pendingOrders = [];

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatTime() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function shortId(id) {
  return id.slice(0, 8).toUpperCase();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SEP = '─'.repeat(58);
const HEADER = '═'.repeat(58);

function printHeader() {
  console.log(chalk.cyan(HEADER));
  console.log(chalk.cyan.bold('  SETOR DE LOGÍSTICA — FILA DE SEPARAÇÃO'));
  console.log(chalk.cyan(HEADER));
}

function printOrder(order, status) {
  const tag = status === 'novo'
    ? chalk.green.bold('🆕 NOVO PEDIDO')
    : chalk.yellow.bold('⏳ EM SEPARAÇÃO');

  const itens = order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ');

  console.log();
  console.log(chalk.gray(SEP));
  console.log(`  ${chalk.gray(`[${order.receivedAt}]`)} ${tag} ${chalk.white.bold(`#${shortId(order.id)}`)}`);
  console.log(`  ${chalk.gray('Cliente :')} ${chalk.white(order.customerName)}`);
  console.log(`  ${chalk.gray('Itens   :')} ${chalk.white(itens)}`);
  console.log(`  ${chalk.gray('Total   :')} ${chalk.green.bold(formatBRL(order.total))}`);

  const statusLabel = status === 'novo'
    ? chalk.green('Aguardando separação')
    : chalk.yellow('Em separação — em andamento');
  console.log(`  ${chalk.gray('Status  :')} ${statusLabel}`);
  console.log(chalk.gray(SEP));
}

function renderAll() {
  if (IS_TTY) process.stdout.write('\x1Bc');
  printHeader();
  if (pendingOrders.length === 0) {
    console.log(chalk.gray('\n  Nenhum pedido na fila no momento.\n'));
    return;
  }
  for (const o of pendingOrders) printOrder(o, o.status);
  console.log(chalk.cyan(`\n  Total na fila: ${chalk.white.bold(pendingOrders.length)} pedido(s)\n`));
}

function onOrderReceived(order) {
  order.receivedAt = formatTime();
  order.status = 'novo';
  pendingOrders.unshift(order);

  if (IS_TTY) {
    renderAll();
  } else {
    printOrder(order, 'novo');
  }

  setTimeout(() => {
    const entry = pendingOrders.find((o) => o.id === order.id);
    if (!entry) return;
    entry.status = 'em_separacao';
    if (IS_TTY) {
      renderAll();
    } else {
      console.log(chalk.yellow(`\n  → Pedido #${shortId(order.id)} movido para separação\n`));
    }
  }, 5000);
}

async function run() {
  printHeader();
  console.log(chalk.gray('  Conectando ao RabbitMQ...\n'));

  let attempt = 0;

  while (true) {
    attempt++;
    let conn;

    try {
      conn = await amqp.connect(RABBITMQ_URL);
      conn.on('error', (err) =>
        console.error(chalk.red(`[RabbitMQ] Erro na conexão: ${err.message}`))
      );

      const channel = await conn.createChannel();
      channel.on('error', (err) =>
        console.error(chalk.red(`[RabbitMQ] Erro no canal: ${err.message}`))
      );

      await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);
      await channel.prefetch(1);

      await channel.consume(QUEUE_NAME, (msg) => {
        if (!msg) return;
        try {
          const order = JSON.parse(msg.content.toString());
          onOrderReceived(order);
          channel.ack(msg);
        } catch (err) {
          console.error(chalk.red(`[Mensagem] Erro ao processar: ${err.message}`));
          channel.nack(msg, false, false);
        }
      });

      console.log(chalk.green.bold('[RabbitMQ] Conexão estabelecida. Aguardando pedidos...'));
      attempt = 0;

      // Aguarda até que conexão ou canal feche para reconectar
      await new Promise((resolve) => {
        conn.on('close', resolve);
        channel.on('close', () => {
          conn.close().catch(() => {});
          resolve();
        });
      });

      console.error(chalk.yellow('[RabbitMQ] Conexão encerrada. Reconectando...'));
    } catch (err) {
      if (conn) conn.close().catch(() => {});

      if (attempt >= MAX_RETRIES) {
        console.error(chalk.red(`[RabbitMQ] Falha após ${MAX_RETRIES} tentativas. Encerrando.`));
        process.exit(1);
      }

      console.error(
        chalk.yellow(
          `[RabbitMQ] Tentativa ${attempt}/${MAX_RETRIES} falhou (${err.message}). Aguardando ${RETRY_DELAY_MS / 1000}s...`
        )
      );
      await sleep(RETRY_DELAY_MS);
    }
  }
}

run();
