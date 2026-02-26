# ⚡ Electric Simulator

> Simulador interactivo de circuitos eléctricos desarrollado con Next.js, React y TypeScript.

Electric Simulator es una aplicación web moderna diseñada para visualizar, crear y experimentar con circuitos eléctricos de forma intuitiva. El objetivo es ofrecer una herramienta educativa e interactiva para comprender mejor los principios básicos de la electricidad.

---

## 🚀 Características

- ⚡ Simulación visual de componentes eléctricos
- 🧩 Sistema de nodos interactivos
- 🎯 Diseño basado en cuadrícula (snap to grid)
- 🧠 Arquitectura escalable y modular
- 💾 Manejo de estado global con Zustand
- 🎨 Interfaz moderna con Tailwind CSS
- 🔒 Tipado estricto con TypeScript

---

## 🛠️ Tecnologías Utilizadas

- **Next.js** – Framework React para aplicaciones modernas
- **React** – Biblioteca para interfaces dinámicas
- **TypeScript** – Tipado estático
- **Zustand** – Manejo de estado global
- **Tailwind CSS** – Estilos rápidos y responsivos
- **UUID** – Generación de identificadores únicos

---

## 📦 Instalación

Clona el repositorio:

```bash
git clone https://github.com/NotGaabo/Electric-Simulator.git
cd Electric-Simulator
```

Instala las dependencias:

```bash
npm install
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre en tu navegador:

```
http://localhost:3000
```

---

## 📁 Estructura del Proyecto

```
Electric-Simulator/
│
├── public/                  # Recursos estáticos
├── src/
│   ├── app/                 # Rutas y layout principal (Next.js App Router)
│   ├── components/
│   │   └── electrical/      # Componentes del simulador eléctrico
│   ├── store/               # Estado global (Zustand)
│   ├── types/               # Tipos TypeScript
│   └── styles/              # Estilos globales
│
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 🧠 Cómo Funciona

El simulador utiliza:

- Un sistema de nodos eléctricos renderizados dinámicamente.
- Un grid con alineación automática para organizar los componentes.
- Un estado global centralizado para manejar proyectos y elementos del circuito.
- Componentes reutilizables para representar símbolos eléctricos.

---

## 📜 Scripts Disponibles

| Comando | Descripción |
|----------|------------|
| `npm run dev` | Ejecuta en modo desarrollo |
| `npm run build` | Construye la app para producción |
| `npm run start` | Ejecuta versión producción |
| `npm run lint` | Revisión de código |

---

## 🎯 Objetivo del Proyecto

Este proyecto busca:

- Facilitar el aprendizaje de electricidad
- Permitir experimentar visualmente con circuitos
- Servir como base para futuras simulaciones más avanzadas

---

## 🚀 Mejoras Futuras

- 🔌 Simulación real de corriente y voltaje  
- 📊 Gráficas dinámicas  
- 🧮 Implementación de Ley de Ohm  
- 💾 Guardado de proyectos  
- 🌙 Modo oscuro completo  

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas.  
Puedes abrir un issue o enviar un Pull Request.