# React Contexts

The application uses the Context API for global state management, avoiding prop drilling.

## Provider Hierarchy
```jsx
<AuthProvider>
  <GroupProvider>
    <FinanceProvider>
      <App />
    </FinanceProvider>
  </GroupProvider>
</AuthProvider>
```

## `AuthContext`
- **State:** `user` (User object), `token` (JWT), `isAuthenticated` (boolean).
- **Actions:** `login(username, password)`, `logout()`.
- **Persistance:** Checks `localStorage` on initialization to restore session.

## `GroupContext`
- **Dependencies:** Requires `AuthContext`.
- **State:**
    - `groups`: List of groups the user belongs to.
    - `currentGroup`: The currently selected group object.
- **Actions:**
    - `selectGroup(groupId)`: Switches the active tenant.
    - `refreshGroups()`: Re-fetches the list from the API.

## `FinanceContext`
- **Dependencies:** Requires `GroupContext`.
- **State:**
    - `bills`, `incomes`, `investments`, `randomExpenses`: Arrays of data.
    - `loading`: Boolean flag for async operations.
- **Actions:**
    - `fetchData()`: Loads all data for the *currentGroup*.
    - `addBill()`, `payBill()`, `deleteBill()`, etc.: Wrappers around API calls that also update local state upon success.
- **Behavior:** automatically re-fetches data whenever `currentGroup` changes.