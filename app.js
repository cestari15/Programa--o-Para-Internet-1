const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  const { idade, sexo, salario_base, anoContratacao, matricula, anoReferencia } = req.query;

  // Se não enviou parâmetros, mostra as instruções
  if (!idade && !sexo && !salario_base && !anoContratacao && !matricula) {
    return res.sendFile(path.join(__dirname, 'views', 'instructions.html'));
  }

  const erros = [];
  const idadeNum = Number(idade);
  const sexoNorm = (sexo || '').toString().trim().toUpperCase();
  const salarioNum = Number(salario_base);
  const anoNum = Number(anoContratacao);
  const matNum = Number(matricula);

  // Ano fixo de referência (não usa o ano atual)
  const anoRefNum = anoReferencia ? Number(anoReferencia) : 2024;

  if (!Number.isInteger(idadeNum) || idadeNum <= 16) erros.push('Idade inválida: deve ser maior que 16.');
  if (!['M', 'F'].includes(sexoNorm)) erros.push("Sexo inválido: use 'M' ou 'F'.");
  if (!Number.isFinite(salarioNum) || salarioNum <= 0) erros.push('Salário base inválido.');
  if (!Number.isInteger(anoNum) || anoNum <= 1960 || anoNum > anoRefNum) erros.push('Ano de contratação inválido.');
  if (!Number.isInteger(matNum) || matNum <= 0) erros.push('Matrícula inválida.');

  if (erros.length > 0) {
    return res.status(400).send(`
      <html lang="pt-BR"><head><meta charset="utf-8"><title>Erro</title>
      <link rel="stylesheet" href="/style.css"></head><body>
      <div class="container"><h1>Erro nos dados informados</h1>
      <ul>${erros.map(e => `<li>${e}</li>`).join('')}</ul>
      <a href="/">Voltar</a></div></body></html>
    `);
  }

  const tempoCasa = anoRefNum - anoNum;

  // Faixas de idade
  let faixa;
  if (idadeNum >= 18 && idadeNum <= 39) faixa = 1;
  else if (idadeNum >= 40 && idadeNum <= 69) faixa = 2;
  else if (idadeNum >= 70 && idadeNum <= 99) faixa = 3;
  else faixa = 0;

  if (faixa === 0) {
    return res.status(400).send(`<html><body><h1>Faixa etária fora do intervalo válido (18 a 99 anos)</h1></body></html>`);
  }

  // Tabela de reajustes (seguindo o quadro da atividade)
  let reajuste, desconto, acrescimo;
  if (faixa === 1) {
    if (sexoNorm === 'M') { reajuste = 10; desconto = 10; acrescimo = 17; }
    else { reajuste = 8; desconto = 11; acrescimo = 16; }
  } else if (faixa === 2) {
    if (sexoNorm === 'M') { reajuste = 8; desconto = 5; acrescimo = 15; }
    else { reajuste = 10; desconto = 7; acrescimo = 14; }
  } else if (faixa === 3) {
    if (sexoNorm === 'M') { reajuste = 15; desconto = 15; acrescimo = 13; }
    else { reajuste = 17; desconto = 17; acrescimo = 12; }
  }

  const valorReajuste = salarioNum * (reajuste / 100);
  const ajusteFixo = tempoCasa > 10 ? acrescimo : desconto;
  const novoSalario = salarioNum + valorReajuste - ajusteFixo;

  const formatBR = (n) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  res.send(`
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>Resultado - Reajuste Salarial</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <div class="container">
        <h1>Resultado do Reajuste Salarial</h1>
        <h2>Dados do Funcionário</h2>
        <table>
          <tr><th>Matrícula:</th><td>${matNum}</td></tr>
          <tr><th>Idade:</th><td>${idadeNum} anos</td></tr>
          <tr><th>Sexo:</th><td>${sexoNorm}</td></tr>
          <tr><th>Salário base:</th><td>R$ ${formatBR(salarioNum)}</td></tr>
          <tr><th>Ano de contratação:</th><td>${anoNum}</td></tr>
          <tr><th>Tempo de casa:</th><td>${tempoCasa} anos</td></tr>
        </table>

        <h2>Detalhes do cálculo</h2>
        <ul>
          <li>Reajuste aplicado: <b>${reajuste}%</b></li>
          <li>${tempoCasa > 10 ? 'Acréscimo' : 'Desconto'} aplicado: <b>R$ ${formatBR(ajusteFixo)}</b></li>
          <li>Valor do reajuste: R$ ${formatBR(valorReajuste)}</li>
        </ul>

        <p class="highlight">Novo salário: <strong>R$ ${formatBR(novoSalario)}</strong></p>
        <a href="/">Voltar</a>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
