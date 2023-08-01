const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();

app.use(express.static(__dirname + '/public'));

const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '@_Heitorchaves13',
    database: 'financeiro',
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Conectado ao banco de dados MySQL.');
});

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/cadastro', (req, res) => {
    res.render('cadastro');
});

app.post('/cadastro', (req, res) => {
    const { nome } = req.body;
    const newUser = { nome };

    connection.query('INSERT INTO usuarios SET ?', newUser, (err, result) => {
        if (err) throw err;
        console.log('Usuário cadastrado com sucesso.');
        res.redirect('/cadastro');
    });
});

app.post('/adicionar-movimentacao', (req, res) => {
    const { data, descricao, tipo, valor, usuario } = req.body;
    const query = 'INSERT INTO movimentacoes (usuario_id, data, descricao, tipo, valor) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [usuario, data, descricao, tipo, valor], (err, result) => {
        if (err) {
            console.error('Erro ao inserir movimentação:', err);
            return res.status(500).send('Erro ao inserir movimentação no banco de dados.');
        }
        console.log('Movimentação adicionada com sucesso!');
        res.redirect('/extrato');
    });
});

app.get('/operacoes', (req, res) => {
    const queryUsuarios = 'SELECT * FROM usuarios';
    connection.query(queryUsuarios, (err, usuarios) => {
        if (err) throw err;
        const queryTiposCredito = 'SELECT * FROM tipos_operacao';
        connection.query(queryTiposCredito, (err, tiposCredito) => {
            if (err) throw err;
            res.render('operacoes', { usuarios, tiposCredito });
        });
    });
});

app.post('/operacoes', (req, res) => {
    const { usuario, valor, tipoOperacao, tipoCredito } = req.body;
    const query = tipoOperacao === 'credito'
        ? 'UPDATE usuarios SET saldo = saldo + ? WHERE id = ?'
        : 'UPDATE usuarios SET saldo = saldo - ? WHERE id = ?';

    connection.query(query, [valor, usuario], (err, result) => {
        if (err) throw err;
        console.log('Operação financeira concluída com sucesso.');
        res.redirect('/operacoes');
    });
});

app.get('/extrato', (req, res) => {
    connection.query('SELECT id, nome FROM usuarios', (err, usuarios) => {
        if (err) throw err;
        res.render('extrato', { usuarios, extrato: [], saldoAtual: 0, usuario: null });
    });
});

app.post('/extrato', (req, res) => {
    const { usuario, dataInicial, dataFinal } = req.body;

    const query = 'SELECT * FROM movimentacoes WHERE usuario_id = ? AND data BETWEEN ? AND ?';
    connection.query(query, [usuario, dataInicial, dataFinal], (err, extrato) => {
        if (err) throw err;

        connection.query('SELECT id, nome FROM usuarios', (err, usuarios) => {
            if (err) throw err;
            const saldoAtual = extrato.reduce((saldo, movimentacao) => {
                return saldo + movimentacao.valor * (movimentacao.tipo === 'credito' ? 1 : -1).toFixed(2);
            }, 0);

            const saldoFormatado = ((saldoAtual / 100) * 100).toFixed(2);

            res.render('extrato', { usuarios, extrato, saldoAtual: saldoFormatado, usuario });
        });
    });
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}.`);
});
