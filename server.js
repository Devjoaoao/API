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


// Rota de Registro
app.post('/auth//register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Usuário já existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      approved: false // Começa como não aprovado
    });

    await newUser.save();
    res.status(201).json({ message: 'Usuário registrado! Aguarde aprovação do administrador.' });
  } catch (error) {
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
      const user = await User.findOne({ email });
  
      if (!user) return res.status(400).json({ message: 'Usuário não encontrado' });
  
      console.log("Usuário encontrado:", user); // DEBUG: Verifique os dados no terminal
  
      if (user.approved !== true) {
          return res.status(403).json({ message: 'Usuário ainda não aprovado!' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Senha incorreta' });
  
      const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1h' });
  
      res.status(200).json({ message: 'Login bem-sucedido!', token });
    } catch (error) {
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

// Iniciar Servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
})
