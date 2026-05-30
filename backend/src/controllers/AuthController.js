const authRepository = require('../repositories/AuthRepository');

const AuthController = {
  async login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }
    try {
      const user = await authRepository.findByEmailAndPassword(email, password);
      if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
      res.json(user);
    } catch (err) {
      console.error('Error in login:', err);
      res.status(500).json({ error: 'Error interno del servidor en la consulta' });
    }
  },

  async register(req, res) {
    const { email, password, nombre } = req.body;
    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    try {
      const exists = await authRepository.existsByEmail(email);
      if (exists) return res.status(400).json({ error: 'El correo electrónico ya está registrado' });

      const user = await authRepository.create(nombre, email, password);
      res.status(201).json(user);
    } catch (err) {
      console.error('Error in register:', err);
      res.status(500).json({ error: 'Error al registrar el docente' });
    }
  }
};

module.exports = AuthController;
