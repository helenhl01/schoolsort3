import { useEffect, useMemo, useRef, useState } from 'react';
import { studentRole } from './datahandler.js';

const EMPTY_SET = new Set();

// Column definitions drive both the header row and each data row, so the two stay in sync.
// The Time column carries `sortOptions` instead of sorting directly on click, since it has
// two named orderings ("By time" = configs.js's TIMES order, "By day" = the grouped M1,M2... order).
const COLUMNS = [
  { key: "time", label: "Time", sortOptions: [
      { key: "timeByTime", label: "By time" },
      { key: "timeByDay", label: "By day" },
    ] },
  { key: "school", label: "School" },
    { key: "role", label: "Role" },
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "eid", label: "EID" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "carSpace", label: "Car space" },
];

// Builds the "Filter by" menu's categories from the live schools/times, so new schools or
// time slots automatically show up as filter options without touching this component.
function buildFilterCategories(schools, times) {
  return [
    { key: "time", label: "Time", options: times.map(t => ({ value: t.id, label: t.timeName })) },
    { key: "school", label: "School", options: schools.map(s => ({ value: s.name, label: s.name })) },
    { key: "po", label: "PO", options: [
        { value: "PO", label: "PO" },
        { value: "Exec", label: "Exec" }]},
    { key: "trainingStatus", label: "Training status", options: [
        { value: "Complete", label: "Complete" },
        { value: "Incomplete", label: "Incomplete" },
      ] },
  ];
}

// Builds a school-name -> time-slot-id lookup once (memoized on `schools`), instead of every
// comparator/filter check doing its own schools.find() scan per student, per render.
function buildSchoolTimeMap(schools) { //add a lookup table for school names and times and thenmaybe display order?
  const map = new Map(schools.map(s => [s.name, s.time]));
  return (schoolName) => map.get(schoolName) || "unsorted";
}

// Ascending text comparison (locale + case aware). Descending is handled by the caller
// reversing the sorted result, not by this function - see applySort below.
function compareText(a, b) {
  return (a || "").localeCompare(b || "", undefined, { sensitivity: "base" });
}

// Looks up a student's time-slot label for display, falling back to "Unsorted" for
// students with no valid school assignment. Real slots are trimmed from
// "Monday 2:30-4:30" to "Monday 2:30" - but "Unsorted" itself isn't in that format,
// so it's left alone rather than getting chopped into "Uns".
function timeLabelFor(student, schoolTimeOf, times) {
  const timeId = schoolTimeOf(student.schoolName);
  const match = times.find(t => t.id === timeId);
  if (!match) return "Unsorted";
  return match.id === "unsorted" ? match.timeName : match.timeName.slice(0, -5);
}

// The single source of truth for what a column displays for a given student - used both to
// render each cell and to measure how wide that column needs to be (computeColumnWidths below),
// so the two can never drift out of sync with each other.
function cellText(columnKey, student, schoolTimeOf, times) {
  switch (columnKey) {
    case "time": return timeLabelFor(student, schoolTimeOf, times);
    case "school": return student.schoolName || "Unsorted";
    case "carSpace": return student.carSpace || "";
    case "role": return studentRole(student);
    default: return student[columnKey] || "";
  }
}

// Sizes each column to fit its widest value (header label or any cell currently in that
// column) in `ch` units - roughly one average character's width in the current font - instead
// of a fixed pixel guess. Long emails get room, short columns like "Car space" stay compact.
// Measured against the full list (not just the filtered-down rows), so applying a filter
// doesn't make columns jump around.
function computeColumnWidths(students, schoolTimeOf, times) {
  return COLUMNS
    .map(column => {
      let longest = column.label.length;
      for (const student of students) {
        const length = String(cellText(column.key, student, schoolTimeOf, times)).length;
        if (length > longest) longest = length;
      }
      return `${longest + 2}ch`; // +2 for a little breathing room around the text
    })
    .join(" ");
}

const TIME_SORT_ORDER = ["M1", "M2", "T1", "T2", "W1", "W2", "R1", "R2"];

// Returns where a time-slot id falls in the "By time" order; ids not in the list
// (namely "unsorted") sort after every real slot.
function timeRank(timeId) {
  const i = TIME_SORT_ORDER.indexOf(timeId);
  return i === -1 ? TIME_SORT_ORDER.length : i;
}

// Returns the comparator function for a given sort key. "timeByDay" and "timeByTime" are
// the two Time-column modes; every other key just compares that field on the student object.
function makeComparator(sortKey, schoolTimeOf, times) {
  switch (sortKey) {
    case "timeByTime":
      return (a, b) => times.findIndex(t => t.id === schoolTimeOf(a.schoolName)) -
                        times.findIndex(t => t.id === schoolTimeOf(b.schoolName));
    case "timeByDay":
      return (a, b) => timeRank(schoolTimeOf(a.schoolName)) - timeRank(schoolTimeOf(b.schoolName));
    case "carSpace":
      return (a, b) => (a.carSpace || 0) - (b.carSpace || 0);
    case "school":
      return (a, b) => compareText(a.schoolName || "Unsorted", b.schoolName || "Unsorted");
    case "role":
      return (a, b) => compareText(studentRole(a), studentRole(b));
    default:
      return (a, b) => compareText(a[sortKey], b[sortKey]);
  }
}

// A student passes if, for every category with at least one selected value, the student's
// value for that category is one of the selected ones (OR within a category). Categories
// with nothing selected are skipped, so all active categories combine as AND.
function matchesFilters(student, activeFilters, schoolTimeOf) {
  for (const [category, values] of Object.entries(activeFilters)) {
    if (!values || values.size === 0) continue;
    let studentValue;
    if (category === "time") studentValue = schoolTimeOf(student.schoolName);
    else if (category === "school") studentValue = student.schoolName || "Unsorted";
    else if (category === "po") studentValue = studentRole(student);
    else if (category === "trainingStatus") studentValue = student.trainingComplete ? "Complete" : "Incomplete";
    if (!values.has(studentValue)) return false;
  }
  return true;
}

// Finds the human-readable label for a selected filter bubble, e.g. category "school",
// value "Sunset Valley" -> "Sunset Valley"; category "time", value "M1" -> "Monday 2:30-4:30".
function bubbleLabel(category, value, filterCategories) {
  const found = filterCategories.find(c => c.key === category);
  const option = found && found.options.find(o => o.value === value);
  return option ? option.label : String(value);
}

function SpreadsheetView({ studentList, schools, times, onSelectStudent }) {
  const [orderedList, setOrderedList] = useState(studentList);
  const [activeFilters, setActiveFilters] = useState({});
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [timeSortMenuOpen, setTimeSortMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const timeSortMenuRef = useRef(null);

  const schoolTimeOf = useMemo(() => buildSchoolTimeMap(schools), [schools]);
  const filterCategories = useMemo(() => buildFilterCategories(schools, times), [schools, times]);
  const columnWidths = useMemo(
    () => computeColumnWidths(orderedList, schoolTimeOf, times),
    [orderedList, schoolTimeOf, times]
  );

  // Keeps orderedList (the spreadsheet's own display order, independent of studentList's
  // incoming order) in sync whenever studentList changes for reasons outside this view -
  // an upload, or an edit/drag-and-drop made from the schedule view. Existing rows keep
  // their position and just get their fresh data; genuinely new students are appended.
  useEffect(() => {
    setOrderedList(prev => {
      const currentById = new Map(studentList.map(s => [s.eid, s]));
      const kept = prev.filter(s => currentById.has(s.eid)).map(s => currentById.get(s.eid));
      const prevIds = new Set(prev.map(s => s.eid));
      const added = studentList.filter(s => !prevIds.has(s.eid));
      return [...kept, ...added];
    });
  }, [studentList]);

  // Closes the "Filter by" dropdown or the Time column's sort-mode menu on an outside click.
  useEffect(() => {
    if (!menuOpen && !timeSortMenuOpen) return;
    function handleClickOutside(e) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (timeSortMenuOpen && timeSortMenuRef.current && !timeSortMenuRef.current.contains(e.target)) setTimeSortMenuOpen(false);
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, timeSortMenuOpen]);

  // The visible rows: orderedList filtered down by the active filters. Recomputed only when
  // the order or the filters actually change, not on every render (e.g. hovering a menu item).
  const filteredList = useMemo(
    () => orderedList.filter(s => matchesFilters(s, activeFilters, schoolTimeOf)),
    [orderedList, activeFilters, schoolTimeOf]
  );

  // Re-sorts orderedList by the given comparator, stably - ties keep whatever relative order
  // they already had, which is what makes "most recent sort wins, previous sort still shows
  // through on ties" work without tracking sort history. Clicking the same sort key twice
  // flips ascending/descending; clicking a different one starts ascending.
  function applySort(sortKey, comparator) {
    const direction = sortColumn === sortKey && sortDirection === "asc" ? "desc" : "asc";
    setOrderedList(prev => {
      const sorted = [...prev].sort(comparator);
      return direction === "asc" ? sorted : sorted.reverse();
    });
    setSortColumn(sortKey);
    setSortDirection(direction);
  }

  // Header triangle click: the Time column opens its "By day"/"By time" mode menu instead
  // of sorting immediately, since it needs the user to pick which ordering to use.
  function handleHeaderSortClick(column) {
    if (column.sortOptions) {
      setTimeSortMenuOpen(open => !open);
      return;
    }
    applySort(column.key, makeComparator(column.key, schoolTimeOf, times));
  }

  function handleTimeSortOption(optionKey) {
    applySort(optionKey, makeComparator(optionKey, schoolTimeOf, times));
    setTimeSortMenuOpen(false);
  }

  // Toggles a single value within a filter category's selected set (immutably).
  function toggleFilterValue(category, value) {
    setActiveFilters(prev => {
      const next = new Set(prev[category] || EMPTY_SET);
      next.has(value) ? next.delete(value) : next.add(value);
      return { ...prev, [category]: next };
    });
  }

  // "Select all" toggles the whole category on or off together, based on whether
  // everything is currently selected.
  function toggleSelectAll(category, options) {
    setActiveFilters(prev => {
      const current = prev[category] || EMPTY_SET;
      const allSelected = options.every(o => current.has(o.value));
      return { ...prev, [category]: allSelected ? new Set() : new Set(options.map(o => o.value)) };
    });
  }

  return (
    <div className="spreadsheet-view">
      <div className="spreadsheet-toolbar" ref={menuRef}>
        <button type="button" className="filter-menu-btn" onClick={() => setMenuOpen(open => !open)}>
          Filter by <span className="filter-caret">&#9662;</span>
        </button>

        {menuOpen &&
          <div className="filter-dropdown" onMouseLeave={() => setHoveredCategory(null)}>
            {filterCategories.map(category => (
              <div key={category.key} className="filter-category-row" onMouseEnter={() => setHoveredCategory(category.key)}>
                <span>{category.label}</span> <span className="filter-caret">&#8250;</span>

                {hoveredCategory === category.key &&
                  <div className="filter-flyout">
                    {category.options.map(option => (
                      <label key={String(option.value)} className="filter-option">
                        <input
                          type="checkbox"
                          checked={(activeFilters[category.key] || EMPTY_SET).has(option.value)}
                          onChange={() => toggleFilterValue(category.key, option.value)}
                        />
                        {option.label}
                      </label>
                    ))}
                    {category.options.length > 1 &&
                      <label className="filter-option filter-select-all">
                        <input
                          type="checkbox"
                          checked={category.options.every(o => (activeFilters[category.key] || EMPTY_SET).has(o.value))}
                          onChange={() => toggleSelectAll(category.key, category.options)}
                        />
                        Select all
                      </label>
                    }
                  </div>
                }
              </div>
            ))}
          </div>
        }

        <div className="filter-bubbles">
          {Object.entries(activeFilters).flatMap(([category, values]) =>
            [...(values || EMPTY_SET)].map(value => (
              <span key={`${category}-${value}`} className="filter-bubble">
                {bubbleLabel(category, value, filterCategories)}
                <button type="button" className="filter-bubble-remove" aria-label="Remove filter" onClick={() => toggleFilterValue(category, value)}>&times;</button>
              </span>
            ))
          )}
        </div>
      </div>

      <div className="spreadsheet-table-wrap">
        <div className="spreadsheet-grid spreadsheet-header-row" style={{ gridTemplateColumns: columnWidths }}>
          {COLUMNS.map(column => (
            <div
              key={column.key}
              className="spreadsheet-header-cell"
              style={column.sortOptions ? { position: "relative" } : undefined}
              ref={column.sortOptions ? timeSortMenuRef : null}
            >
              {column.label}
              <button type="button" className="sort-triangle" aria-label={`Sort by ${column.label}`} onClick={() => handleHeaderSortClick(column)}>&#9662;</button>

              {column.sortOptions && timeSortMenuOpen &&
                <div className="time-sort-menu">
                  {column.sortOptions.map(option => (
                    <button type="button" key={option.key} className="time-sort-option" onClick={() => handleTimeSortOption(option.key)}>
                      {option.label}
                    </button>
                  ))}
                </div>
              }
            </div>
          ))}
        </div>

        {filteredList.map((student, index) => (
          <div
            key={student.eid}
            className={`spreadsheet-grid spreadsheet-row ${index % 2 ? "spreadsheet-row-alt" : ""}`}
            style={{ gridTemplateColumns: columnWidths }}
            role="button"
            tabIndex={0}
            onClick={() => onSelectStudent(student)}
          >
            {COLUMNS.map(column => (
              <div key={column.key}>{cellText(column.key, student, schoolTimeOf, times)}</div>
            ))}
          </div>
        ))}
      </div>

      <p className="spreadsheet-row-count">{filteredList.length} of {studentList.length} students shown</p>
    </div>
  );
}

export default SpreadsheetView;
