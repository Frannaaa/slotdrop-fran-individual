import { useCatalogViewModel } from "./CatalogViewModel.js";
import { useDetailViewModel } from "./DetailViewModel.js";

// View: hooks supply state and actions; components only draw them.
const pesos = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

function ProductCard({ product }) {
  return <article className="workshop-card" data-availability={product.availability}>
    <img className="card-photo" src={product.image_url || "./assets/placeholder.svg"}
      alt={product.name} width="640" height="420" loading="lazy" />
    <div className="card-body">
      <p className="eyebrow">{product.category}</p>
      <h3>{product.name}</h3>
      <span className="availability" data-availability={product.availability}>{product.availability}</span>
      <p className="card-price"><strong>{pesos.format(product.price)}</strong><span>per person</span></p>
      <a className="button button-outline" href={`?screen=detail&id=${product.id}`}>View workshop <span aria-hidden="true">↗</span></a>
    </div>
  </article>;
}

function CatalogResult({ vm, featured = false }) {
  if (vm.status === "loading") return <div className="state-panel" role="status">
    <span className="loading-dot" aria-hidden="true"></span>
    <h3>Loading {featured ? "featured workshops" : "workshops"}...</h3>
    <p>Checking the catalog for you.</p>
  </div>;
  if (vm.status === "error") return <div className="state-panel error-panel" role="alert">
    <p className="eyebrow">Connection trouble</p>
    <h3>We couldn't load the workshops.</h3>
    <p>{vm.error}</p>
    <button className="button" onClick={vm.retry}>Retry</button>
  </div>;
  if (vm.status === "empty") return <div className="state-panel" role="status">
    <p className="eyebrow">Nothing here yet</p>
    <h3>{featured ? "No featured workshops right now." : "No workshops found."}</h3>
    <p>{featured ? "There are no workshops with seats in the featured selection."
      : <>No matches for <strong>{vm.query ? `“${vm.query}”` : "all workshop names"}</strong> in <strong>{vm.category || "all activities"}</strong>.</>}</p>
    {featured ? <a className="button" href="?screen=browse">Browse all workshops</a>
      : <button className="button" onClick={vm.clearFilters}>Clear filters</button>}
  </div>;
  return <>
    {!featured && <p className="result-count" role="status">{vm.products.length} workshops{vm.query && <> matching “{vm.query}”</>}{vm.category && <> in {vm.category}</>}</p>}
    <div className="workshop-grid">{vm.products.map(product => <ProductCard key={product.id} product={product} />)}</div>
  </>;
}

function Home() {
  const vm = useCatalogViewModel({ featured: true });
  return <>
    <section className="hero" aria-labelledby="home-heading">
      <div className="hero-copy">
        <p className="eyebrow">A little less scrolling. A little more making.</p>
        <h1 id="home-heading">Make room<br />for making<span>.</span></h1>
        <p className="lead">Find pottery and painting workshops in Metro Manila, with prices and seats in one place.</p>
        <a className="button" href="?screen=browse">Find your workshop <span aria-hidden="true">↗</span></a>
      </div>
      <figure className="hero-visual">
        <img src="./assets/laro-mug.webp" width="640" height="420"
          alt="Two people making their own ceramic mugs at Laro Ceramics" fetchPriority="high" />
        <figcaption>Something made by you.</figcaption>
      </figure>
    </section>
    <section className="catalog-section" aria-labelledby="featured-heading">
      <div className="section-heading"><div><p className="eyebrow">Start here</p><h2 id="featured-heading">Pick a new thing to try.</h2></div>
        <a className="text-link" href="?screen=browse">See all workshops <span aria-hidden="true">↗</span></a></div>
      <CatalogResult vm={vm} featured />
    </section>
  </>;
}

function Catalog() {
  const vm = useCatalogViewModel();
  return <section className="catalog-section" aria-labelledby="browse-heading">
    <p className="eyebrow">Your next small adventure</p>
    <h1 id="browse-heading" className="page-title">Find your workshop.</h1>
    <p className="lead">Try a wheel, shape a mug, or start with a blank canvas.</p>
    <form className="filters" role="search" onSubmit={vm.submitSearch}>
      <div className="search-field"><label htmlFor="search">Workshop or studio name</label>
        <input id="search" type="search" maxLength="120" placeholder="Try mug, Laro or painting"
          value={vm.search} onChange={event => vm.setSearch(event.target.value)} />
      </div>
      <div className="category-field"><label htmlFor="category">Activity</label>
        <select id="category" value={vm.category} onChange={event => vm.setCategory(event.target.value)}>
          <option value="">All activities</option><option value="Pottery">Pottery</option><option value="Painting">Painting</option>
        </select>
      </div>
      <button className="button" type="submit">Search</button>
      <button className="text-button" type="button" onClick={vm.clearFilters}>Reset</button>
    </form>
    <CatalogResult vm={vm} />
  </section>;
}

function Detail({ id }) {
  const vm = useDetailViewModel(id);
  return <section className="catalog-section" aria-labelledby="detail-heading">
    <a className="text-link back-link" href="?screen=browse">← All workshops</a>
    {vm.status === "loading" && <div className="state-panel" role="status"><h1 id="detail-heading">Loading workshop...</h1><p>Getting its price and seats.</p></div>}
    {vm.status === "error" && <div className="state-panel error-panel" role="alert"><h1 id="detail-heading">This workshop didn't load.</h1><p>{vm.error}</p><button className="button" onClick={vm.retry}>Retry</button></div>}
    {vm.status === "empty" && <div className="state-panel" role="status"><p className="eyebrow">Workshop not found</p><h1 id="detail-heading">We couldn't find that workshop.</h1><p>No workshop matches id “{vm.id || "(missing)"}”. Choose another from Browse.</p><a className="button" href="?screen=browse">Browse workshops</a></div>}
    {vm.status === "ready" && <article className="detail-layout">
      <img className="detail-photo" src={vm.product.image_url || "./assets/placeholder.svg"}
        alt={vm.product.name} width="640" height="420" />
      <div className="detail-copy"><p className="eyebrow">{vm.product.category}</p>
        <h1 id="detail-heading">{vm.product.name}</h1>
        <span className="availability" data-availability={vm.product.availability}>{vm.product.availability}</span>
        <p className="detail-price">{pesos.format(vm.product.price)}<span>per person</span></p>
        <dl className="facts"><div><dt>Catalog seats</dt><dd>{vm.product.stock}</dd></div><div><dt>Workshop code</dt><dd>{vm.product.sku}</dd></div></dl>
        <p className="detail-note">This is a workshop catalog. Dates and real availability must be confirmed with the studio.</p>
        <a className="button" href="?screen=browse">Explore more workshops <span aria-hidden="true">↗</span></a>
      </div>
    </article>}
  </section>;
}

function Storefront({ screen, id }) {
  return <>
    <header className="site-header"><div className="header-inner">
      <a className="wordmark" href="./index.html" aria-label="SlotDrop home">slotdrop<span aria-hidden="true">✳</span></a>
      <nav aria-label="Main navigation"><a href="./index.html" aria-current={screen === "home" ? "page" : undefined}>Home</a><a href="?screen=browse" aria-current={screen === "browse" ? "page" : undefined}>Workshops</a></nav>
    </div></header>
    <main id="main" className="container">{screen === "home" ? <Home /> : screen === "detail" ? <Detail id={id} /> : <Catalog />}</main>
    <footer className="site-footer"><div className="container footer-inner"><p className="footer-brand">A small break. Something you made.</p>
      <p>Individual course catalog by Francine de Asis. Studio names and reference prices are real; catalog seats are classroom allocations. No reservation or payment is made.</p></div></footer>
  </>;
}

// Composition root: URL navigation and mounting belong to the View.
const parameters = new URLSearchParams(window.location.search);
const screen = ["browse", "detail"].includes(parameters.get("screen")) ? parameters.get("screen") : "home";
ReactDOM.createRoot(document.getElementById("root")).render(<Storefront screen={screen} id={parameters.get("id")} />);
