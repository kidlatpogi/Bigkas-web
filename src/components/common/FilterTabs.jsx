import './FilterTabs.css';

/**
 * FilterTabs — reusable horizontal pill/tab filter bar.
 *
 * Props:
 *   tabs     {Array<{ label: string, value: string }>}  — tab definitions
 *   active   {string}                                   — currently active value
 *   onChange {(value: string) => void}                  — called on tab click
 *   className {string}                                  — optional extra class
 */
function FilterTabs({ tabs = [], active, onChange, className = '' }) {
  return (
    <div className={`filter-tabs ${className}`.trim()} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active === tab.value}
          className={`filter-tab-btn${active === tab.value ? ' active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default FilterTabs;
