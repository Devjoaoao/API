require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./models/User');


const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = 'chave_secreta_super_segura';

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('🔥 Conectado ao MongoDB'))
  .catch(err => console.error('❌ Erro ao conectar:', err));

  app.get('/db-test', async (req, res) => {
    try {
        const dbName = mongoose.connection.name;
        res.json({ message: "✅ Conectado ao MongoDB!", database: dbName });
    } catch (error) {
        res.status(500).json({ error: "❌ Erro ao conectar ao banco!" });
    }
});

// Rota de Registro (corrigida)
app.post('/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Normaliza o e-mail (remove espaços e converte para minúsculas)
        const normalizedEmail = email.trim().toLowerCase();
        
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) return res.status(400).json({ message: 'Usuário já existe' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email: normalizedEmail,  // Armazena o e-mail formatado
            password: hashedPassword,
            approved: false
        });

        await newUser.save();
        res.status(201).json({ message: 'Usuário registrado! Aguarde aprovação do administrador.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor', error });
    }
});

// Rota de Aprovação de Usuário
app.post('/auth/approve/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    if (user.approved) return res.status(400).json({ message: 'Usuário já foi aprovado' });

    user.approved = true;
    await user.save();

    res.status(200).json({ message: 'Usuário aprovado com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao aprovar usuário', error });
  }
});

// Rota de Login corrigida
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 🔥 Aqui estamos garantindo que o campo "approved" será retornado
        const user = await User.findOne({ email }).select("+approved");

        if (!user) {
            return res.status(400).json({ message: 'Usuário não encontrado' });
        }

        console.log("DEBUG - Usuário encontrado:", user); // Verifica se o usuário está sendo encontrado
        console.log("DEBUG - Approved:", user.approved); // Mostra no log se o campo approved está correto

        // 🔥 Verifica se o usuário está aprovado
        if (user.approved !== true) {  
            return res.status(403).json({ message: 'Usuário ainda não foi aprovado!' });
        }

        // Verifica se a senha está correta
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha incorreta' });
        }

        // Gera o token de autenticação
        const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login bem-sucedido!', token });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: 'Erro no servidor', error });
    }
});



  
// Rota Protegida para Dashboard
app.get('/dashboard', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Acesso negado' });

    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    res.status(200).json({ message: 'Bem-vindo ao dashboard', user });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao acessar o dashboard', error });
  }
});

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/db-test', async (req, res) => {
    try {
        await mongoose.connection.db.admin().ping();
        res.json({ message: "Conectado ao MongoDB no Render!", database: mongoose.connection.name });
    } catch (error) {
        res.status(500).json({ error: "Erro ao conectar ao banco de dados no Render!" });
    }
});

module.exports = router;


// Iniciar Servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
})
