# Pactle Frontend

A React + TypeScript + Vite application for the Pactle platform.

## Development

This project uses:

- Node.js 20+ (required)
- React with TypeScript
- Vite for build tooling
- Yarn for package management
- Tailwind CSS for styling
- ESLint for code quality

## API Configuration

The frontend is configured to work with multiple API endpoints:

- **Main API**: `https://api.pactle.co` - for most endpoints (auth, quotations, SKU, etc.)
- **RFQ Processing API**: `https://rfq.pactle.co` - for file processing endpoints

**Manual Setup:**
Create a `.env` file in the root directory:
```bash
VITE_API_URL=https://api.pactle.co
VITE_FILE_PROCESS_API_URL=https://rfq.pactle.co
```

## Deployment

Deployment scripts and configuration are located in the `deployment/` folder. This folder is gitignored for security reasons.

To deploy:

1. Configure your AWS credentials using `aws configure`
2. Run `./deployment/deploy.sh` from the project root

For detailed deployment instructions, see `deployment/README-DEPLOYMENT.md`.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
