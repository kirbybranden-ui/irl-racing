Your `DriverProfilePage.jsx` itself is fine. The problem is likely in your `App.jsx` route handling, not the driver profile component. 

But I DO see one thing:

Your uploaded file contains the ENTIRE `OwnersPage` component inside the same file/export chain as the driver profile system. That means somewhere in `App.jsx`, Bowhunter is probably being routed into:

```jsx
<OwnersPage />
```

instead of:

```jsx
<DriverProfilePage />
```

Your actual `DriverProfilePage.jsx` does NOT contain redirect logic. So the issue is definitely inside `App.jsx`.

What you need is this EXACT behavior:

```jsx
if (pathname.startsWith("/driver/")) {
  return <DriverProfilePage />
}
```

and NEVER:

```jsx
if (driverIsOwner) {
  return <OwnersPage />
}
```

for the driver route.

You should ONLY open OwnersPage from:

```jsx
/owners
```

NOT from:

```jsx
/driver/18
```

Your `DriverProfilePage.jsx` is safe — it already behaves like a normal driver profile page. 
