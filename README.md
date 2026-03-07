# 💰 Finanzas Personales - MVP

Aplicación web local para gestión de finanzas personales con diseño dark mode premium.

## ✨ Características del MVP

✅ **Dashboard**
- Balance total con desglose de ingresos y gastos
- Últimas transacciones
- Diseño glassmorphism elegante

✅ **Gestión de Transacciones**
- Añadir gastos e ingresos
- Editar y eliminar transacciones
- Categorías predefinidas con iconos
- Filtros por tipo (gasto/ingreso)
- Vista agrupada por mes
- Selector visual de categorías

✅ **Privacidad Total**
- Todos los datos se guardan localmente
- IndexedDB para almacenamiento robusto
- Fallback automático a localStorage
- Sin backend, sin servidores

✅ **Diseño Premium**
- Dark mode por defecto
- Efectos glassmorphism
- Animaciones suaves
- Responsive (móvil y desktop)
- Colores pastel para categorías

## 🚀 Cómo usar

### Instalación

1. **Opción 1: Abrir directamente**
   - Simplemente abre el archivo `index.html` en tu navegador
   - Funciona con file:// protocol

2. **Opción 2: Servidor local** (recomendado)
   ```bash
   # Con Python 3
   python -m http.server 8000

   # Con Node.js (si tienes http-server instalado)
   npx http-server -p 8000

   # Luego abre: http://localhost:8000
   ```

### Uso básico

1. **Añadir una transacción**
   - Ve a la vista "Transacciones"
   - Presiona el botón flotante "+"
   - Selecciona tipo (Gasto o Ingreso)
   - Rellena cantidad, descripción, categoría y fecha
   - ¡Listo!

2. **Ver tu balance**
   - El dashboard muestra tu balance total
   - Desglose de ingresos y gastos
   - Últimas transacciones

3. **Editar o eliminar**
   - Haz hover sobre una transacción
   - Aparecerán botones de editar (✏️) y eliminar (🗑️)

## 📂 Estructura del proyecto

```
finance-app/
├── index.html              # Punto de entrada
├── css/                    # Estilos
│   ├── main.css           # Variables y reset
│   ├── components/        # Componentes UI
│   ├── layouts/           # Layouts de vistas
│   └── utilities/         # Animaciones, glassmorphism
├── js/                     # JavaScript
│   ├── app.js             # Inicialización
│   ├── core/              # Módulos centrales
│   │   ├── config.js      # Configuración
│   │   ├── state.js       # Gestión de estado
│   │   ├── eventBus.js    # Sistema de eventos
│   │   └── router.js      # Navegación SPA
│   ├── data/              # Persistencia
│   │   └── database.js    # IndexedDB wrapper
│   ├── models/            # Modelos de datos
│   │   ├── Transaction.js
│   │   └── Category.js
│   ├── services/          # Lógica de negocio
│   │   └── transactionService.js
│   ├── ui/                # Componentes y vistas
│   │   ├── components/
│   │   │   ├── Modal.js
│   │   │   └── Toast.js
│   │   └── views/
│   │       ├── DashboardView.js
│   │       ├── TransactionsView.js
│   │       ├── GoalsView.js
│   │       └── SettingsView.js
│   └── utils/
│       └── formatters.js  # Formateo de datos
└── assets/                 # Recursos (futuro)
```

## 🎨 Categorías predefinidas

### Gastos
- 🛒 Alimentación
- 🚗 Transporte
- 💊 Salud
- 🎮 Ocio
- 🏠 Hogar
- 👕 Ropa
- 📱 Tecnología
- ✈️ Viajes
- 💰 Otros

### Ingresos
- 💵 Salario
- 💼 Freelance
- 🎁 Ingresos varios
- 💰 Otros

## 🔧 Stack técnico

- **HTML5** - Estructura semántica
- **CSS3** - Diseño moderno con glassmorphism
- **JavaScript ES6+** - Modules, async/await
- **IndexedDB** - Base de datos local
- **localStorage** - Fallback para almacenamiento
- **Sin frameworks** - JavaScript vanilla puro

## 📱 Compatibilidad

- ✅ Chrome / Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Móviles (iOS, Android)

## 🔒 Privacidad

- **100% local**: Todos los datos se guardan en tu navegador
- **Sin servidores**: No hay backend ni servicios externos
- **Sin rastreo**: Cero analytics o cookies de terceros
- **Tus datos son tuyos**: Exporta/importa cuando quieras (próximamente)

## 🚧 Próximas funcionalidades (Fases siguientes)

- 🎯 Objetivos de ahorro con progress visual
- 📊 Gráficos de tendencias (Chart.js)
- 🔍 Búsqueda avanzada de transacciones
- 💬 Entrada rápida con texto natural ("gasto mercadona 45")
- 🤖 Detección automática de categorías
- 📈 Análisis y estadísticas mensuales
- 📤 Export/Import de datos (JSON)
- 🔁 Transacciones recurrentes
- 📱 PWA (instalable como app nativa)

## 📄 Licencia

Proyecto personal - Uso libre

## 👨‍💻 Desarrollo

Desarrollado con ❤️ usando JavaScript vanilla
