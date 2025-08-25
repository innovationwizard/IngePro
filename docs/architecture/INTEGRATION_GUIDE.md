# IngePro Architecture Integration Guide

## 🎯 Overview

This guide explains how to integrate automated architecture diagram generation into your IngePro development workflow. The system automatically generates comprehensive architecture documentation using Mermaid diagrams and Markdown.

## 🚀 Quick Start

### 1. Generate Basic Diagrams
```bash
npm run generate-architecture
```

### 2. Generate Enhanced Diagrams
```bash
npm run generate-enhanced-architecture
```

### 3. Watch Mode (Auto-regenerate)
```bash
npm run architecture:watch
```

### 4. Update and Commit
```bash
npm run update-architecture
```

## 📊 Available Diagrams

### Core Architecture
- **System Overview**: High-level system design and technology stack
- **Component Dependencies**: React component hierarchy and relationships
- **API Documentation**: Endpoint structure and authentication flow
- **Infrastructure**: Deployment and AWS services configuration

### Enhanced Diagrams
- **Database Schema**: Detailed ERD with constraints and indexes
- **Security Architecture**: Authentication flow and authorization matrix
- **Deployment Pipeline**: CI/CD flow and infrastructure as code
- **Monitoring Architecture**: Health checks and alerting systems

## 🔧 Configuration

### Package.json Scripts
```json
{
  "scripts": {
    "generate-architecture": "node scripts/generate-architecture.js",
    "generate-enhanced-architecture": "node scripts/enhanced-architecture.js",
    "update-architecture": "npm run generate-architecture && git add docs/architecture && git commit -m 'Update architecture diagrams'",
    "architecture:watch": "nodemon --watch src --watch prisma --ext js,ts,tsx,prisma --exec 'npm run generate-architecture'"
  }
}
```

### GitHub Actions Workflow
The `.github/workflows/architecture-diagrams.yml` file automatically:
- Triggers on code changes to `src/`, `prisma/`, and configuration files
- Generates updated diagrams
- Commits changes with `[skip ci]` flag
- Adds PR comments with diagram updates

## 🔄 Automation Workflows

### Development Workflow
1. **Local Development**: Use `npm run architecture:watch` for real-time updates
2. **Before Commits**: Run `npm run generate-architecture` to ensure diagrams are current
3. **Code Reviews**: Diagrams are automatically updated and commented on PRs

### CI/CD Integration
1. **Automatic Generation**: Diagrams update on every push to main/develop
2. **Version Control**: All diagram changes are tracked in git
3. **Team Collaboration**: Diagrams stay synchronized across the team

## 📁 File Structure

```
docs/architecture/
├── README.md                    # Main documentation
├── system-architecture.md       # System overview
├── component-dependencies.md    # Component hierarchy
├── api-documentation.md         # API structure
├── infrastructure.md            # Deployment info
├── database-schema-detailed.md  # Detailed database
├── security-architecture.md     # Security patterns
├── deployment-pipeline.md       # CI/CD flow
├── monitoring-architecture.md   # Monitoring setup
└── summary.md                   # Generation summary
```

## 🎨 Customization

### Adding New Diagrams
1. Create a new generation function in the appropriate script
2. Add the diagram to the files array
3. Update the README documentation
4. Test with `npm run generate-architecture`

### Modifying Existing Diagrams
1. Edit the template strings in the script files
2. Regenerate diagrams to see changes
3. Commit updates to version control

### Business-Specific Rules
The system includes construction-specific terminology:
- People → Workers/Users
- Projects → Construction Projects
- Materials → Construction Materials
- Tasks → Construction Tasks

## 🔍 Troubleshooting

### Common Issues

**Diagrams not generating:**
```bash
# Check Node.js version
node --version

# Verify script permissions
ls -la scripts/

# Check for syntax errors
node -c scripts/generate-architecture.js
```

**Missing dependencies:**
```bash
# Install dependencies
npm install

# Check package.json scripts
npm run
```

**Git integration issues:**
```bash
# Check git status
git status

# Verify git configuration
git config --list
```

### Debug Mode
```bash
# Run with verbose output
DEBUG=* npm run generate-architecture

# Check generated files
ls -la docs/architecture/
```

## 📈 Best Practices

### 1. Regular Updates
- Generate diagrams before major releases
- Update on significant architectural changes
- Review generated content for accuracy

### 2. Team Collaboration
- Share diagrams in design reviews
- Use for onboarding new developers
- Reference in technical discussions

### 3. Version Control
- Commit diagram updates with meaningful messages
- Include diagrams in pull request reviews
- Tag releases with architecture documentation

### 4. Quality Assurance
- Validate Mermaid syntax in generated files
- Test diagram rendering in GitHub
- Ensure business logic accuracy

## 🌐 Integration Examples

### VS Code Integration
Add to `.vscode/settings.json`:
```json
{
  "files.associations": {
    "*.md": "markdown"
  },
  "markdown.preview.breaks": true,
  "markdown.preview.mermaid": true
}
```

### Documentation Sites
- **GitHub**: Diagrams render automatically in markdown
- **GitLab**: Supports Mermaid diagrams
- **Notion**: Import markdown with diagrams
- **Confluence**: Copy Mermaid code blocks

### CI/CD Platforms
- **GitHub Actions**: ✅ Fully supported
- **GitLab CI**: ✅ Compatible
- **Jenkins**: ✅ Can run npm scripts
- **CircleCI**: ✅ Node.js support

## 🚀 Advanced Features

### Custom Templates
Create project-specific diagram templates:
```javascript
const customDiagram = `
# Custom Architecture View
\`\`\`mermaid
graph LR
    A[Custom Component] --> B[Another Component]
\`\`\`
`;
```

### Dynamic Generation
Generate diagrams based on code analysis:
```javascript
// Analyze component imports
const imports = analyzeImports('src/components/');
const diagram = generateImportDiagram(imports);
```

### Export Formats
Support multiple output formats:
- **Mermaid**: GitHub compatibility
- **SVG**: Static images
- **PNG**: High-resolution exports
- **PDF**: Documentation packages

## 📚 Resources

### Documentation
- [Mermaid Documentation](https://mermaid-js.github.io/mermaid/)
- [GitHub Markdown](https://docs.github.com/en/github/writing-on-github)
- [Next.js Architecture](https://nextjs.org/docs/advanced-features)

### Tools
- [Mermaid Live Editor](https://mermaid.live/)
- [Draw.io](https://draw.io/) - Alternative diagram tool
- [Lucidchart](https://www.lucidchart.com/) - Professional diagrams

### Community
- [GitHub Discussions](https://github.com/innovationwizard/ingepro/discussions)
- [Architecture Patterns](https://martinfowler.com/articles/architecture.html)
- [Software Architecture](https://www.reddit.com/r/softwarearchitecture/)

## 🔮 Future Enhancements

### Planned Features
- **Real-time Collaboration**: Live diagram editing
- **Version History**: Track diagram changes over time
- **Interactive Diagrams**: Clickable components and navigation
- **Integration APIs**: Connect with external tools

### Roadmap
- **Q1**: Enhanced diagram templates
- **Q2**: Automated code analysis
- **Q3**: Team collaboration features
- **Q4**: Advanced export options

---

*Last updated: ${new Date().toISOString()}*

*For support, open an issue in the repository or check the troubleshooting section.*
