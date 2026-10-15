import { useEffect, useState } from "react";
import "./App.css";

const STORAGE_KEY = "issue-board-items-v1";
const COLUMNS = [
  { id: "todo", label: "To do", color: "blue" },
  { id: "in_progress", label: "In progress", color: "amber" },
  { id: "done", label: "Done", color: "green" },
];

const STARTER_ISSUES = [
  { id: "issue-1", title: "Fix background color", section: "todo" },
  { id: "issue-2", title: "Review the new dashboard layout", section: "in_progress" },
  { id: "issue-3", title: "Set up the project workspace", section: "done" },
];

function readBoard() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return { issues: STARTER_ISSUES, warning: "" };

    const issues = JSON.parse(saved);
    const valid =
      Array.isArray(issues) &&
      issues.every(
        (issue) =>
          typeof issue.id === "string" &&
          typeof issue.title === "string" &&
          COLUMNS.some((column) => column.id === issue.section),
      );

    if (!valid) throw new Error("Saved board data has an invalid format.");
    return { issues, warning: "" };
  } catch (error) {
    console.error("Unable to read the saved issue board.", error);
    return {
      issues: STARTER_ISSUES,
      warning: "Your saved board could not be read. A sample board is shown instead.",
    };
  }
}

function App() {
  const [board, setBoard] = useState(readBoard);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState({});
  const [draggedIssue, setDraggedIssue] = useState(null);
  const [storageWarning, setStorageWarning] = useState("");
  const visibleWarning = storageWarning || board.warning;
  const normalizedSearch = search.trim().toLowerCase();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(board.issues));
      setStorageWarning("");
    } catch (error) {
      console.error("Unable to save the issue board.", error);
      setStorageWarning("Changes could not be saved in this browser.");
    }
  }, [board.issues]);

  function addIssue(section) {
    const title = (drafts[section] ?? "").trim();
    if (!title) return;

    setBoard((current) => ({
      ...current,
      issues: [
        ...current.issues,
        { id: crypto.randomUUID(), title, section },
      ],
    }));
    setDrafts((current) => ({ ...current, [section]: "" }));
  }

  function moveIssue(issueId, section) {
    setBoard((current) => ({
      ...current,
      issues: current.issues.map((issue) =>
        issue.id === issueId ? { ...issue, section } : issue,
      ),
    }));
  }

  function deleteIssue(issueId) {
    setBoard((current) => ({
      ...current,
      issues: current.issues.filter((issue) => issue.id !== issueId),
    }));
  }

  const filteredIssues = board.issues.filter((issue) =>
    issue.title.toLowerCase().includes(normalizedSearch),
  );
  const activeCount = board.issues.filter((issue) => issue.section !== "done").length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#board" aria-label="Issue board home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>boardly</span>
        </a>
        <div className="workspace-label">
          <span className="workspace-avatar">W</span>
          <span>Workspace</span>
          <span className="chevron" aria-hidden="true">⌄</span>
        </div>
        <div className="topbar-spacer" />
        <span className={`save-indicator${storageWarning ? " save-indicator-warning" : ""}`}>
          <span className="save-dot" />
          {storageWarning ? "Not saved" : "Saved locally"}
        </span>
        <span className="profile-avatar" aria-label="Your profile">S</span>
      </header>

      <section className="board-area" id="board">
        <div className="board-heading">
          <div>
            <div className="eyebrow">WORKSPACE <span>/</span> PROJECTS</div>
            <h1>Issue board</h1>
            <p className="board-subtitle">
              A clear view of what needs doing and what’s already done.
            </p>
          </div>
          <div className="board-summary">
            <span className="summary-number">{activeCount}</span>
            <span className="summary-label">open {activeCount === 1 ? "issue" : "issues"}</span>
          </div>
        </div>

        <div className="board-toolbar">
          <label className="search-box">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="8.8" cy="8.8" r="5.6" />
              <path d="m13 13 4 4" />
            </svg>
            <input
              type="search"
              placeholder="Search issues..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search issues"
            />
            {search && (
              <button
                className="clear-search"
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </label>
          <p className="board-hint">Drag an issue to move it between columns</p>
        </div>

        {visibleWarning && (
          <p className="storage-warning" role="status">{visibleWarning}</p>
        )}

        <div className="columns">
          {COLUMNS.map((column) => {
            const issues = filteredIssues.filter(
              (issue) => issue.section === column.id,
            );
            const totalInColumn = board.issues.filter(
              (issue) => issue.section === column.id,
            ).length;

            return (
              <section
                className={`column column-${column.color}`}
                key={column.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggedIssue) moveIssue(draggedIssue, column.id);
                  setDraggedIssue(null);
                }}
                aria-label={`${column.label} issues`}
              >
                <div className="column-heading">
                  <div className="column-title">
                    <span className="column-dot" />
                    <h2>{column.label}</h2>
                    <span className="column-count">{totalInColumn}</span>
                  </div>
                </div>

                <form
                  className="add-issue-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addIssue(column.id);
                  }}
                >
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="Add an issue..."
                    value={drafts[column.id] ?? ""}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [column.id]: event.target.value,
                      }))
                    }
                    aria-label={`New issue in ${column.label}`}
                  />
                  <button
                    type="submit"
                    aria-label={`Add issue to ${column.label}`}
                    disabled={!(drafts[column.id] ?? "").trim()}
                  >
                    +
                  </button>
                </form>

                <div className="issue-list">
                  {issues.map((issue, index) => (
                    <article
                      className="issue-card"
                      key={issue.id}
                      draggable
                      onDragStart={() => setDraggedIssue(issue.id)}
                      onDragEnd={() => setDraggedIssue(null)}
                    >
                      <div className="issue-card-top">
                        <span className={`issue-tag issue-tag-${column.color}`}>
                          {column.label}
                        </span>
                        <button
                          className="delete-issue"
                          type="button"
                          onClick={() => deleteIssue(issue.id)}
                          aria-label={`Delete ${issue.title}`}
                          title="Delete issue"
                        >
                          ×
                        </button>
                      </div>
                      <h3>{issue.title}</h3>
                      <div className="issue-card-footer">
                        <span className="issue-id">ISS-{String(index + 1).padStart(3, "0")}</span>
                        <label className="move-control">
                          <span className="sr-only">Move {issue.title}</span>
                          <select
                            value={issue.section}
                            onChange={(event) => moveIssue(issue.id, event.target.value)}
                            aria-label={`Move ${issue.title}`}
                          >
                            {COLUMNS.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </article>
                  ))}

                  {issues.length === 0 && (
                    <div className="empty-column">
                      <span className="empty-icon" aria-hidden="true">＋</span>
                      <p>{normalizedSearch ? "No matching issues" : "Nothing here yet"}</p>
                      {!normalizedSearch && <span>Add an issue above to get started.</span>}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
        <footer className="board-footer">
          <span>{board.issues.length} total {board.issues.length === 1 ? "issue" : "issues"}</span>
          <span>Changes are saved in this browser</span>
        </footer>
      </section>
    </main>
  );
}

export default App;
