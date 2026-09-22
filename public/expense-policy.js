// Legacy couple-only costs stay fully assigned to the payer's couple, but are
// now visible to the whole household. This does not introduce a new debt.
export function householdExpense(expense) {
  return expense.visibility === 'private'
    ? {...expense, visibility: 'shared', split: expense.payer < 2 ? 'a' : 'b'}
    : {...expense, visibility: 'shared'};
}

// The payer and author can differ. Only the authenticated author owns edits.
// Missing authors remain read-only rather than guessing from the payer.
export function canManageExpenseAs(expense, seat) {
  return !!expense && Number.isInteger(seat) && expense.creator === seat && !expense.settlement;
}
