# Boardly issue board

A client-only React issue board inspired by the reference project's Todo, In Progress, and Done workflow. It does not include a Node.js server or database; issues are saved in the current browser with `localStorage`.

## Run locally

```sh
npm install
npm run dev
```

## Features

- Add issues directly to any of the three columns.
- Move issues with the status selector or by dragging cards between columns.
- Search issues and delete cards.
- Keep board changes after reloads in the same browser.

The included sample board is used the first time the app is opened. Clearing this site's browser storage resets the board to the sample data.
