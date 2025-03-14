const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User'); // Importa o modelo de usuário

dotenv.config(); // Carrega variáveis de ambiente

const app = express();

// Middleware para processar JSON
app.use(express.json());

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Conectado ao MongoDB Atlas'))
    .catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

    app.post('/auth/register', async (req, res) => {
        const { name, email, password } = req.body;
    
        try {
            // Verifica se o email já está em uso
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ msg: 'Email já está em uso.' });
            }
    
            // Cria um novo usuário
            const user = new User({ name, email, password });
            await user.save();
    
            res.status(201).json({ msg: 'Usuário registrado com sucesso! Aguarde aprovação.' });
        } catch (error) {
            res.status(500).json({ msg: 'Erro ao registrar usuário.', error });
        }
    });
// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});