# IngePro - Gestión de Productividad en Construcción

Una plataforma integral de gestión de productividad para el sector de la construcción, con seguimiento de tiempo, gestión de usuarios y colaboración en tiempo real.

## Features

- 🏗️ **Gestión de Proyectos**: Control completo de proyectos de construcción
- ⏱️ **Seguimiento de Tiempo**: Registro de horas trabajadas en tiempo real
- 👥 **Gestión de Usuarios**: Sistema de usuarios y roles administrativos
- 📱 **Diseño Responsivo**: Interfaz optimizada para dispositivos móviles
- ⚡ **Rendimiento Optimizado**: Construido con Next.js y TypeScript
- 🔒 **Autenticación Segura**: Sistema de login y autorización
- 🎯 **TypeScript**: Seguridad de tipos para mejor experiencia de desarrollo

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/innovationwizard/ingepro.git
cd ingepro
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## 🏗️ Architecture Documentation

Automated architecture diagrams are available in the [docs/architecture](./docs/architecture/) directory. These diagrams are generated using **Swark** and provide:

- **System Architecture Overview** - High-level system design and technology stack
- **Database Schema** - Entity relationships and data models
- **Component Dependencies** - React component hierarchy and relationships
- **API Documentation** - Endpoint structure and authentication flow
- **Security Architecture** - Authentication and authorization patterns
- **Infrastructure Setup** - Deployment and AWS services configuration

### Generate Architecture Diagrams

```bash
# Basic diagrams
npm run generate-architecture

# Enhanced diagrams with Swark
npm run generate-enhanced-architecture

# Watch mode (auto-regenerate on changes)
npm run architecture:watch

# Update and commit changes
npm run update-architecture
```

The diagrams are automatically updated via GitHub Actions when code changes are pushed to the repository.

4. Open your browser and navigate to `http://localhost:3000`

## Tecnologías Utilizadas

- **Next.js 14** - Framework de React para aplicaciones web
- **TypeScript** - Seguridad de tipos y mejor experiencia de desarrollo
- **Prisma** - ORM para gestión de base de datos
- **NextAuth.js** - Autenticación y autorización
- **Tailwind CSS** - Framework de CSS para diseño responsivo
- **PostgreSQL** - Base de datos relacional

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.



## License

ISC License

## Contact

For questions or contributions, please open an issue on GitHub.
