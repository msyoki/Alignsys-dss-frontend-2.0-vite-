import React from 'react';
import TableIconButton from './TableIconButton';

const ACTION_FIELD = /^action\d*$/;
const ICON_BUTTON = 30; // TableIconButton size
const GAP = 10; // space between action buttons

/**
 * Replace a table's separate action columns (fields "action", "action1", …)
 * with one "Actions" column, placed where the first one was. Each action keeps
 * its own click handler; a bare clickable icon becomes an icon button with a
 * tooltip named after its old column ("Sign", "Preview", …).
 *
 *   <DataGrid columns={autoSizeColumns(mergeActionColumns(columns), rows)} />
 */
export default function mergeActionColumns(columns) {
  const actions = columns.filter((c) => ACTION_FIELD.test(c.field) && c.renderCell);
  if (actions.length === 0) return columns;

  const renderAction = (col, params) => {
    const el = col.renderCell(params);
    if (!React.isValidElement(el)) return el;
    // Already a button (e.g. TableIconButton): use as is.
    if (el.type === TableIconButton || !el.props?.onClick) return el;
    const { onClick } = el.props;
    return (
      <TableIconButton title={col.headerName} onClick={onClick}>
        {React.cloneElement(el, { onClick: undefined, style: { ...el.props.style, cursor: undefined } })}
      </TableIconButton>
    );
  };

  const merged = {
    field: 'actions',
    headerName: 'Actions',
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    disableExport: true,
    minWidth: actions.length * ICON_BUTTON + (actions.length - 1) * GAP + 32,
    renderCell: (params) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: GAP }}>
        {actions.map((col) => (
          <React.Fragment key={col.field}>{renderAction(col, params)}</React.Fragment>
        ))}
      </span>
    ),
  };

  const firstIndex = columns.findIndex((c) => actions.includes(c));
  const rest = columns.filter((c) => !actions.includes(c));
  rest.splice(firstIndex, 0, merged);
  return rest;
}
