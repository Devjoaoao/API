require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const cors     = require('cors');

const User     = require('./models/User');

const SECRET_KEY = process.env.SECRET || 'MEU_SEGREDO_SEGURO';

const app = express();
app.use(express.json());
app.use(cors());

// Conecta à base "test" conforme sua MONGO_URI
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('🔥 Conectado ao MongoDB'))
.catch(err => console.error('❌ Erro ao conectar:', err));

// Rota de teste da conexão
app.get('/db-test', async (req, res) => {
  try {
    const dbName = mongoose.connection.name;
    res.json({ message: "✅ Conectado ao MongoDB!", database: dbName });
  } catch (error) {
    res.status(500).json({ error: "❌ Erro ao conectar ao banco!" });
  }
});

// Rota de Cadastro
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }
    
    // Normaliza o e-mail
    const normalizedEmail = email.trim().toLowerCase();
    
    // Verifica se já existe um usuário com este e-mail
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Usuário já existe" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Cria o novo usuário com approved false
    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      approved: false,
    });
    
    await newUser.save();
    return res.status(201).json({ message: "Usuário registrado! Aguarde aprovação do administrador." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro no servidor", error });
  }
});

// Rota de Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }
    
    // Normaliza o e-mail no login
    const normalizedEmail = email.trim().toLowerCase();
    
    // Busca o usuário e inclui o campo approved
    const user = await User.findOne({ email: normalizedEmail }).select('+approved');
    if (!user) {
      return res.status(400).json({ message: "Usuário não encontrado" });
    }
    
    if (!user.approved) {
      return res.status(403).json({ message: "Usuário ainda não foi aprovado!" });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Senha incorreta" });
    }
    
    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1h' });
    return res.status(200).json({ message: "Login bem-sucedido!", token });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro no servidor", error });
  }
});

// Rota Protegida para Dashboard
app.get('/dashboard', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Acesso negado" });
    
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    
    return res.status(200).json({ message: "Bem-vindo ao dashboard", user });
  } catch (error) {
    console.error("Erro ao acessar o dashboard:", error);
    return res.status(500).json({ message: "Erro ao acessar o dashboard", error });
  }
});

// (Opcional) Rota para listar usuários aprovados
app.get('/auth/approved-users', async (req, res) => {
  try {
    const approvedUsers = await User.find({ approved: true });
    return res.status(200).json(approvedUsers);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar usuários aprovados", error });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
