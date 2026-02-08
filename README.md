# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

## Group Management Features

This application now supports group-based financial management, allowing users to organize their finances into different groups (e.g., "Personal", "Family", "Project X").

### Key Functionalities:
- **Group Creation and Management:** Users can create, view, edit, and delete groups.
- **Financial Entry Association:** All financial entries (bills, incomes, investments, random expenses) can now be associated with a specific group.
- **Dashboard Filtering:** The main dashboard can be filtered to display financial data relevant to a selected group.

### How to Use:

#### 1. Managing Groups:
- Navigate to the "Group Management" section (or a dedicated page/modal for group management).
- **Create a New Group:** Use the provided form to create a new group by giving it a name. The creator automatically becomes an 'admin' of the group.
- **View Your Groups:** A list of all groups you are a member of will be displayed, along with your role in each group (admin, editor, viewer).
- **Select a Group:** You can select a `currentGroup` from the list. This group will then be used as the default for new financial entries and for filtering the dashboard view.
- **Edit/Delete Groups:** If you are an 'admin' of a group, you will see options to edit its name or delete the group entirely.
- **Invite Users:** As an 'admin', you can invite other users to join your group by entering their username.

#### 2. Associating Financial Entries with Groups:
- When adding a new Bill, Income, Investment, or Random Expense, a "Group" selection dropdown will appear in the respective forms.
- Select the desired group from the dropdown. The default selected group will be your `currentGroup`.

#### 3. Filtering the Dashboard:
- On the main Dashboard, a group selector dropdown will be available (typically near the date selector).
- Choose a group from this dropdown to view all financial data (incomes, bills, investments, expenses) specifically associated with that group.

This feature provides enhanced flexibility and organization for users managing multiple financial contexts.```
