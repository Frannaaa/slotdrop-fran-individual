# Reflection

## 1. What does RLS do that hiding the key does not?

The browser must send the publishable key, so anyone can inspect it.
RLS checks which database rows the requesting role may access, even when
someone calls the API outside my interface. A table grant allows the
operation; its policy decides which rows are visible. This build allows
anonymous product reads and blocks order access and browser writes.

## 2. Why is the computed field in the ViewModel?

`availability` describes stock for the interface. Storing both stock and
the badge could leave them disagreeing after an update. The ViewModel
derives it from the current row. JSX displays the result without deciding
whether three seats count as low stock.

## 3. Why does no matching search return 200 and an empty array?

The database successfully answered the question; nothing matched. That is
different from a failed request. Browse shows the searched phrase and a
clear-filters action. An unknown numeric detail id also returns an empty
array, which the detail hook turns into a not-found screen.

## 4. Which state required the most care?

Error and retry needed the most coordination. A failed call must become
visible state, and Retry must make a new request. A previous request must
also be cancelled when filters change, so a slow old response cannot
replace newer results. The distinction is between a request failing and
an intentional cancellation while navigating or searching.

## 5. Which file holds each layer?

- Model: `CatalogModel.js` makes REST reads and handles HTTP failures.
- ViewModel: `CatalogViewModel.js` owns catalog state and actions;
  `DetailViewModel.js` handles detail state. The catalog ViewModel also
  defines the one stock badge calculation.
- View: `Catalog.js` renders the three screens and their states. It
  consumes the hooks and contains no fetch or local state hooks.

## 6. What is worse than GC2?

This catalog cannot reserve seats or create a booking. GC2 checked prices
and seats on the server and saved a receipt safely across retries. This
individual stage only reads products, so displayed stock does not
guarantee a place. There is also no checkout or owner dashboard.
