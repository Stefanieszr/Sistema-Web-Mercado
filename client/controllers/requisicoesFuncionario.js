const express = require('express'); // Chamando a biblioteca express
const router = express.Router(); // Exportando para fora;
const mysql = require('../aa.db').pool; // chamando as credenciais do banco de dados;
const path = require('path');
const bcrypt = require('bcrypt'); // Chamando a biblioteca que irá fazer a criptografia da senha;


exports.chamandoFuncionarios = (req, res, next) => {

    mysql.getConnection((err, conn) => {
        if (err) return res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'pages', '08.funcionarios.html'));

        const query = `SELECT * FROM tbl_User;`;

        conn.query(query, (err, result) => {
            conn.release();
            if (err) return res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'pages', '08.funcionarios.html'))

            if (result.length == 0) return res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'pages', '08.funcionarios.html'))

            const response = {
                quantidade: result.length,
                usuarios: result.map(user => {
                    return {
                        user: user.id_User,
                        nome: user.nome,
                        email: user.email_Login,
                        telefone: user.telefone,
                        tipo_funcionario: user.admin,
                        status: user.ativo
                    }
                })
            }

            return res.json(response);
        })
    })
}

exports.chamadaFuncionarioEspec = (req, res, next) => {

    // const email = req.query.buscaFuncionario; // Corrigindo para req.query.buscaFuncionario
    const email = req.params.email; 
    mysql.getConnection((err, conn) => {
        if (err) return res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'pages', '08.funcionarios.html'));

        const query = `SELECT * FROM tbl_User WHERE email_Login = ?`

            conn.query(query, [email], (err, results) => {
                conn.release();
                if (err) return res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'pages', '08.funcionarios.html'))

                const response = {
                    quantidade: results.length,
                    usuarios: results.map(user => {
                        return {
                            user: user.id_User,
                            nome: user.nome,
                            email: user.email_Login,
                            telefone: user.telefone,
                        }
                    })
                }

                return res.json(response);
            })
    })
}

exports.deletandoUser = (req, res, next) => {

    const email = req.query.email_user;

    mysql.getConnection((err, conn) => {
        if (err) return res.json({message: "Erro ao conectar com o banco de dados!", status: "default"});

        const query = `DELETE from tbl_User WHERE email_Login = ?`

            conn.query(query, [email], (err, result) => {
                if (err) return res.json({message: "Erro na requisição MySQL!", status: "default"});

                if (result.affectedRows == 0) return res.json({message: "Funcionário excluído com sucesso!", status: "default"}); 

                return res.json({message: "Funcionário excluído com sucesso!", status: "sucesso!"}); 
            })        
    })
}

exports.atualizandoUser = (req, res, next) => {
    const { nome, sobrenome, email, telefone, status_ativo, status_desativo} = req.body;

    if(telefone.length != 11) return res.json({message: "Tamanho de número inválido!"});

    let retorno = "Dados do funcionário atualizado com sucesso!";
    let query;
    let body;

    if (nome, telefone) {
        query = `
            UPDATE tbl_User
            SET nome = ?, telefone = ?
            WHERE email_Login = ?;
        `
        body = [nome + ' ' + sobrenome, telefone, email];
    }

    if (nome, !telefone) {
        query = `
            UPDATE tbl_User
            SET nome = ?
            WHERE email_Login = ?;
        `
        body = [nome + ' ' + sobrenome, email];
    }

    if (telefone, !nome) {
        query = `
            UPDATE tbl_User
            SET telefone = ?
            WHERE email_Login = ?;
        `
        body = [telefone, email];
    }

    mysql.getConnection((err, conn) => {
        if (err) return res.json({message: "Erro ao conectar com o banco de dados!"});
        
        conn.query(query, body, (err, results) => {
            if (err) return res.json({message: "Erro na requisição"});

            if (results.affectedRows == 0) return res.json({message: "Funcionário não localizado"});

            if(status_ativo == 'on' || status_desativo == 'on'){

                const query = `UPDATE tbl_user SET ativo = ? WHERE email_Login = ?;`
                
                if(status_ativo == 'on'){
        
                    conn.query(query, [1, email], (err, result) => {
                        if(err) return res.json({message: "Erro ao ativar usuário!"});
            
                        if(result.affectedRows == 0) return res.json({message: "Funcionário não localizado!"})
                        
                    })
                }

                if(status_desativo == 'on'){

                    conn.query(query, [0, email], (err, result) => {
                        if(err) return res.json({message: "Erro ao desativar usuário!"});
            
                        if(result.affectedRows == 0) return res.json({message: "Funcionário não localizado!"})
            
                    })
            
                }

            }

            if (status_ativo == 'on') retorno = "Funcionário ativado com sucesso!"
            if (status_desativo == 'on') retorno = "Funcionário desativado com sucesso!"

            return res.json({message: retorno}); 
            
        })

    })

}

// API do sistema "store" para o usuário
exports.atualizaStore = async (req, res, next) => {
    const { nome, email, senha, telefone} = req.body;

    // Regex validar de senha;
    let regex_senha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&]{8,}$/;

    let validando_senha = regex_senha.test(senha);

    if(!validando_senha && senha != '') return res.json({message: "Senha inválida! A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial."})


    if(telefone.length != 11) return res.json({message: "Tamanho de número inválido!"});

    let retorno = "Dados do funcionário atualizados com sucesso!";
    let query = "";
    let body = [];

    let hashPassword = await bcrypt.hash(senha, 8);

    // Construção da query e parâmetros dinamicamente
    if (nome && telefone && senha) {
        query = `
            UPDATE tbl_User
            SET nome = ?, telefone = ?, password_Login = ?
            WHERE email_Login = ?;
        `;
        body = [nome, telefone, hashPassword, email];
    } else if (nome && telefone && !senha) {
        query = `
            UPDATE tbl_User
            SET nome = ?, telefone = ?
            WHERE email_Login = ?;
        `;
        body = [nome, telefone, email];
    } else if (nome && !telefone && senha) {
        query = `
            UPDATE tbl_User
            SET nome = ?, password_Login = ?
            WHERE email_Login = ?;
        `;
        body = [nome, hashPassword, email];
    } else if (nome && !telefone && !senha) {
        query = `
            UPDATE tbl_User
            SET nome = ?
            WHERE email_Login = ?;
        `;
        body = [nome, email];
    } else if (!nome && telefone && senha) {
        query = `
            UPDATE tbl_User
            SET telefone = ?, password_Login = ?
            WHERE email_Login = ?;
        `;
        body = [telefone, hashPassword, email];
    } else if (!nome && telefone && !senha) {
        query = `
            UPDATE tbl_User
            SET telefone = ?
            WHERE email_Login = ?;
        `;
        body = [telefone, email];
    } else if (!nome && !telefone && senha) {
        query = `
            UPDATE tbl_User
            SET password_Login = ?
            WHERE email_Login = ?;
        `;
        body = [hashPassword, email];
    } else {
        return res.json({ message: "Nenhum dado para atualizar!" });
    }

    mysql.getConnection((err, conn) => {
        if (err) return res.json({ message: "Erro ao conectar com o banco de dados!" });

        conn.query(query, body, (err, results) => {
            conn.release();

            if (err) return res.json({ message: "Erro ao atualizar os dados no banco de dados!" });

            if (results.affectedRows === 0) {
                return res.json({ message: "Funcionário não localizado" });
            }

            return res.json({ message: retorno });
        });
    });

}

