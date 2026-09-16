# Business Rules

1. A business can contain multiple independent stores.
2. A store belongs to exactly one business.
3. A product belongs to exactly one store and one business.
4. Inventory is isolated by store. A product from Store A cannot be mutated through Store B.
5. Every active product has exactly one inventory row.
6. Inventory quantity can never be negative.
7. Every successful stock change creates exactly one stock movement in the same database transaction.
8. A stock movement is historical evidence and is not edited to change current stock. Corrections are new movements.
9. Screens cannot perform SQL mutations or enforce domain rules. They call services.
10. Validation rejects malformed input before service execution, but services still enforce invariants because UI validation is not a security boundary.
11. Product `criticalLevel` must be less than or equal to `reorderLevel`.
12. Stock health is deterministic:
    - `critical`: quantity <= critical level
    - `warning`: quantity <= reorder level and above critical level
    - `healthy`: quantity > reorder level
13. Settings contain non-secret application preferences only.
14. Sensitive small values use SecureStore. Inventory, products, movements, and insight payloads do not.
15. Insight snapshots are derived and must never be used as the authoritative stock balance.
16. Paid features are checked through the centralized feature gate only.
17. The only entitlement is `stockpilot_lifetime`.
18. A verified lifetime purchase has no app-defined expiration date.
19. Purchase/restore failures never modify inventory data.
20. Database migrations are forward-only, ordered, and recorded. A migration must either complete or roll back.
